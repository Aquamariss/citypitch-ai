<?php

namespace App\Domains\Pitching\Services;

use App\Domains\Pitching\DTOs\PitchAnalysisResult;
use App\Domains\Pitching\DTOs\PitchResult;
use App\Domains\Pitching\DTOs\TranscriptionResult;
use App\Domains\Pitching\Enums\MediaType;
use App\Domains\Pitching\Enums\PitchStatus;
use App\Domains\Pitching\Enums\PitchStep;
use App\Domains\Pitching\Repositories\PitchRepositoryInterface;
use App\Jobs\ProcessPitchJob;
use App\Models\Pitch;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PitchingService
{
    public function __construct(
        private PitchRepositoryInterface $pitches,
        private TranscriptionService $transcriptionService,
        private PitchAnalysisService $analysisService,
    ) {}

    public function canUploadToday(User $user): bool
    {
        $attemptsUsed = $this->pitches->countTodayAttempts($user->id);
        $maxAttempts = config('pitching.max_daily_attempts', 5);

        return $attemptsUsed < $maxAttempts;
    }

    public function getPitchForUser(string $pitchId, User $user): ?Pitch
    {
        $pitch = $this->pitches->find($pitchId);

        if (! $pitch || $pitch->user_id !== $user->id) {
            return null;
        }

        return $pitch;
    }

    /**
     * @return array<int, array{id: string, name: string, created_at: string, duration: int|null, media_type: string, isPassed: bool}>
     */
    public function getCompletedHistory(User $user): array
    {
        return $this->pitches->getCompletedByUserId($user->id)
            ->map(fn (Pitch $pitch) => [
                'id' => $pitch->id,
                'name' => $pitch->name ?? 'Стартап-питч',
                'created_at' => $pitch->created_at->format('d.m.Y H:i'),
                'duration' => $pitch->duration,
                'media_type' => $pitch->media_type->value,
                'isPassed' => $pitch->result['isPassed'] ?? false,
            ])
            ->all();
    }

    public function initiatePitchProcessing(User $user, UploadedFile $video, int $durationSeconds, string $mediaType = 'video'): string
    {
        return DB::transaction(function () use ($user, $video, $durationSeconds, $mediaType) {
            $pitch = $this->pitches->create([
                'user_id' => $user->id,
                'duration' => $durationSeconds,
                'media_type' => MediaType::from($mediaType),
                'status' => PitchStatus::Processing,
                'step' => PitchStep::Upload,
            ]);

            $pitchId = $pitch->id;
            $extension = $video->getClientOriginalExtension() ?: 'webm';

            $path = $video->storeAs("pitches/{$user->id}", "{$pitchId}.{$extension}", 'public');
            $videoPath = Storage::disk('public')->path($path);

            $this->pitches->update($pitch, [
                'video_path' => $videoPath,
            ]);

            ProcessPitchJob::dispatch($pitchId, $videoPath, $durationSeconds, $user->id);

            return $pitchId;
        });
    }

    public function process(string $pitchId, string $videoPath, int $durationSeconds, int $userId): PitchResult
    {
        $pitch = $this->pitches->findOrFail($pitchId);

        $this->pitches->markProcessing($pitch, PitchStep::Transcription);
        $transcription = $this->transcriptionService->transcribe($videoPath);

        $this->pitches->markProcessing($pitch, PitchStep::Analysis);
        $analysis = $this->analysisService->analyze($transcription->text, $durationSeconds, $transcription->duration);

        $result = $this->buildPitchResultFromData(
            pitchId: $pitchId,
            videoPath: $pitch->video_path,
            transcription: $transcription,
            analysis: $analysis,
        );

        $this->pitches->markCompleted($pitch, [
            'text' => $transcription->text,
            'duration' => $transcription->duration,
            'language' => $transcription->language,
            'segments' => $transcription->segments,
        ], [
            'summary' => $analysis->summary,
            'isPassed' => $analysis->isPassed,
            'criteria' => $analysis->criteria,
            'overallFeedback' => $analysis->overallFeedback,
        ], $this->resolvePitchName($analysis->name));

        $this->cleanupPreviousVideos($userId, $pitchId);

        return $result;
    }

    public function failProcessing(string $pitchId, string $message): void
    {
        $pitch = $this->pitches->find($pitchId);

        if ($pitch) {
            $this->pitches->markFailed($pitch, $message);
        }
    }

    public function buildPitchResult(Pitch $pitch): PitchResult
    {
        $transcription = new TranscriptionResult(
            text: $pitch->transcription['text'] ?? '',
            duration: $pitch->transcription['duration'] ?? 0,
            language: $pitch->transcription['language'] ?? 'ru',
            segments: $pitch->transcription['segments'] ?? [],
        );

        $analysis = new PitchAnalysisResult(
            name: $pitch->name ?? '',
            summary: $pitch->result['summary'] ?? '',
            isPassed: $pitch->result['isPassed'] ?? false,
            criteria: $pitch->result['criteria'] ?? [],
            overallFeedback: $pitch->result['overallFeedback'] ?? '',
        );

        return $this->buildPitchResultFromData(
            pitchId: $pitch->id,
            videoPath: $pitch->video_path,
            transcription: $transcription,
            analysis: $analysis,
            status: $pitch->status->value,
        );
    }

    public function buildWebVtt(Pitch $pitch): string
    {
        $segments = $pitch->transcription['segments'] ?? [];

        $vtt = "WEBVTT\n\n";

        foreach ($segments as $segment) {
            $start = $this->formatVttTime($segment['start']);
            $end = $this->formatVttTime($segment['end']);
            $text = trim($segment['text']);

            $vtt .= "{$start} --> {$end}\n{$text}\n\n";
        }

        return $vtt;
    }

    private function buildPitchResultFromData(
        string $pitchId,
        string $videoPath,
        TranscriptionResult $transcription,
        PitchAnalysisResult $analysis,
        string $status = 'completed',
    ): PitchResult {
        $relativeVideoPath = str_replace(Storage::disk('public')->path(''), '', $videoPath);

        return new PitchResult(
            id: $pitchId,
            videoUrl: Storage::disk('public')->url(ltrim($relativeVideoPath, '/')),
            transcription: $transcription,
            analysis: $analysis,
            status: $status,
        );
    }

    private function formatVttTime(float $seconds): string
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds / 60) % 60);
        $secs = floor($seconds % 60);
        $milliseconds = round(($seconds - floor($seconds)) * 1000);

        return sprintf('%02d:%02d:%02d.%03d', $hours, $minutes, $secs, $milliseconds);
    }

    private function cleanupPreviousVideos(int $userId, string $currentPitchId): void
    {
        $directory = "pitches/{$userId}";
        $files = Storage::disk('public')->files($directory);

        foreach ($files as $file) {
            if (! Str::contains($file, $currentPitchId)) {
                Storage::disk('public')->delete($file);
            }
        }
    }

    private function resolvePitchName(string $name): string
    {
        $name = trim($name);

        return $name !== '' ? $name : 'Стартап-питч';
    }
}
