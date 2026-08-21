<?php

namespace App\Services\Pitching;

use App\DTO\PitchAnalysisResultDto;
use App\DTO\PitchResultDto;
use App\DTO\TranscriptionResultDto;
use App\Enums\MediaType;
use App\Enums\PitchStatus;
use App\Enums\PitchStep;
use App\Jobs\ProcessPitchJob;
use App\Models\Pitch;
use App\Models\User;
use App\Repositories\Pitching\Contracts\PitchRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PitchingService
{
    public function __construct(
        private PitchRepositoryInterface $pitchRepository,
        private TranscriptionService $transcriptionService,
        private PitchAnalysisService $analysisService,
    ) {}

    public function canUploadToday(User $user): bool
    {
        $attemptsUsed = $this->pitchRepository->countTodayAttempts($user->id);
        $maxAttempts = config('pitching.max_daily_attempts', 5);

        return $attemptsUsed < $maxAttempts;
    }

    /**
     * @return array<int, array{id: string, name: string, created_at: string, duration: int|null, media_type: string, isPassed: bool}>
     */
    public function getCompletedHistory(User $user): array
    {
        return $this->pitchRepository->getCompletedByUserId($user->id)
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
            $pitch = $this->pitchRepository->create([
                'user_id' => $user->id,
                'duration' => $durationSeconds,
                'media_type' => MediaType::from($mediaType),
                'status' => PitchStatus::Processing,
                'step' => PitchStep::Upload,
            ]);

            $pitchId = $pitch->id;
            $extension = $this->resolveMediaExtension($video, $mediaType);

            $path = $video->storeAs("pitches/{$user->id}", "{$pitchId}.{$extension}", 'public');
            $videoPath = Storage::disk('public')->path($path);

            $this->pitchRepository->update($pitch, [
                'video_path' => $videoPath,
            ]);

            ProcessPitchJob::dispatch($pitchId, $videoPath, $durationSeconds);

            return $pitchId;
        });
    }

    public function process(string $pitchId, string $videoPath, int $durationSeconds): PitchResultDto
    {
        $pitch = $this->pitchRepository->findOrFail($pitchId);

        $this->pitchRepository->markProcessing($pitch, PitchStep::Transcription);
        $transcription = $this->transcriptionService->transcribe($videoPath);

        $this->pitchRepository->markProcessing($pitch, PitchStep::Analysis);
        $analysis = $this->analysisService->analyze($transcription->text, $durationSeconds, $transcription->duration);

        $result = $this->buildPitchResultFromData(
            pitchId: $pitchId,
            videoPath: $pitch->video_path,
            transcription: $transcription,
            analysis: $analysis,
        );

        $this->pitchRepository->markCompleted($pitch, [
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

        return $result;
    }

    public function failProcessing(string $pitchId, string $message): void
    {
        $pitch = $this->pitchRepository->find($pitchId);

        if ($pitch) {
            $this->pitchRepository->markFailed($pitch, $message);
        }
    }

    public function buildPitchResult(Pitch $pitch): PitchResultDto
    {
        $transcription = new TranscriptionResultDto(
            text: $pitch->transcription['text'] ?? '',
            duration: $pitch->transcription['duration'] ?? 0,
            language: $pitch->transcription['language'] ?? 'ru',
            segments: $pitch->transcription['segments'] ?? [],
        );

        $analysis = new PitchAnalysisResultDto(
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
        TranscriptionResultDto $transcription,
        PitchAnalysisResultDto $analysis,
        string $status = 'completed',
    ): PitchResultDto {
        return new PitchResultDto(
            id: $pitchId,
            videoUrl: route('pitch.media', ['pitch' => $pitchId]),
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

    private function resolvePitchName(string $name): string
    {
        $name = trim($name);

        return $name !== '' ? $name : 'Стартап-питч';
    }

    /**
     * Normalize audio to a seekable container. RecordRTC streams webm/opus
     * without a duration header; renaming the extension keeps browsers from
     * misreading it. mp3 already carries a seekable index.
     */
    private function resolveMediaExtension(UploadedFile $video, string $mediaType): string
    {
        $clientExt = strtolower($video->getClientOriginalExtension() ?: '');

        if ($mediaType !== 'audio') {
            return $clientExt !== '' ? $clientExt : 'webm';
        }

        return match ($clientExt) {
            'mp3', 'wav', 'm4a', 'ogg', 'oga' => $clientExt,
            default => 'ogg',
        };
    }
}
