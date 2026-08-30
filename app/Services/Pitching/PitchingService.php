<?php

namespace App\Services\Pitching;

use App\DTO\PitchEvaluationDto;
use App\DTO\PitchResultDto;
use App\DTO\TranscriptionResultDto;
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
        private PitchSegmentationService $segmentationService,
        private PitchAnalysisService $analysisService,
        private PitchScoringService $scoringService,
    ) {}

    public function canUploadToday(User $user): bool
    {
        $attemptsUsed = $this->pitchRepository->countTodayAttempts($user->id);
        $maxAttempts = config('pitching.max_daily_attempts', 5);

        return $attemptsUsed < $maxAttempts;
    }

    /**
     * @return array<int, array{id: string, name: string, created_at: string, duration: int|null, score: int, isPassed: bool}>
     */
    public function getCompletedHistory(User $user): array
    {
        return $this->pitchRepository->getCompletedByUserId($user->id)
            ->map(fn (Pitch $pitch) => [
                'id' => $pitch->id,
                'name' => $pitch->name ?? 'Питч городского проекта',
                'created_at' => $pitch->created_at->toIso8601String(),
                'duration' => $pitch->duration,
                'score' => (int) ($pitch->score ?? $pitch->result['score'] ?? 0),
                'isPassed' => $pitch->result['isPassed'] ?? false,
            ])
            ->all();
    }

    public function initiatePitchProcessing(User $user, UploadedFile $audio, int $durationSeconds): string
    {
        return DB::transaction(function () use ($user, $audio, $durationSeconds) {
            $pitch = $this->pitchRepository->create([
                'user_id' => $user->id,
                'duration' => $durationSeconds,
                'status' => PitchStatus::Processing,
                'step' => PitchStep::Upload,
            ]);

            $pitchId = $pitch->id;
            $extension = $this->resolveAudioExtension($audio);

            $path = $audio->storeAs("pitches/{$user->id}", "{$pitchId}.{$extension}", 'public');
            $audioPath = Storage::disk('public')->path($path);

            $this->pitchRepository->update($pitch, [
                'audio_path' => $audioPath,
            ]);

            ProcessPitchJob::dispatch($pitchId, $audioPath);

            return $pitchId;
        });
    }

    public function process(string $pitchId, string $audioPath): PitchResultDto
    {
        $pitch = $this->pitchRepository->findOrFail($pitchId);

        $this->pitchRepository->markProcessing($pitch, PitchStep::Transcription);
        $transcription = $this->transcriptionService->transcribe($audioPath);

        $this->pitchRepository->markProcessing($pitch, PitchStep::Segmentation);
        $segmentation = $this->segmentationService->segment($transcription->text, $transcription->segments);

        $this->pitchRepository->markProcessing($pitch, PitchStep::Analysis);
        $actualSeconds = (int) round($transcription->duration);
        $speech = $this->scoringService->analyzeSpeech($transcription->text);
        $analysis = $this->analysisService->analyze(
            $this->scoringService->buildBlockTexts($segmentation, $transcription->segments, $transcription->text),
            $actualSeconds,
            $speech['fillerCount'],
            $this->scoringService->wasCutOff($actualSeconds),
        );

        $evaluation = $this->scoringService->evaluate($segmentation, $analysis, $transcription);

        $this->pitchRepository->markCompleted(
            $pitch,
            [
                'text' => $transcription->text,
                'duration' => $transcription->duration,
                'language' => $transcription->language,
                'segments' => $transcription->segments,
            ],
            $evaluation->toArray(),
            $evaluation->name,
            $evaluation->score,
            $evaluation->methodologyVersion,
            $actualSeconds,
        );

        return $this->buildPitchResultFromData(
            pitchId: $pitchId,
            transcription: $transcription,
            analysis: $evaluation,
        );
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

        return $this->buildPitchResultFromData(
            pitchId: $pitch->id,
            transcription: $transcription,
            analysis: PitchEvaluationDto::fromArray($pitch->result ?? [], $pitch->name ?? ''),
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
        TranscriptionResultDto $transcription,
        PitchEvaluationDto $analysis,
        string $status = 'completed',
    ): PitchResultDto {
        return new PitchResultDto(
            id: $pitchId,
            audioUrl: route('pitch.media', ['pitch' => $pitchId]),
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

    /**
     * Нормализация контейнера: RecordRTC отдаёт webm/opus без заголовка
     * длительности, поэтому такие записи сохраняем как ogg — иначе браузер
     * не может перематывать. mp3 и остальные форматы уже перематываются.
     */
    private function resolveAudioExtension(UploadedFile $audio): string
    {
        $clientExtension = strtolower($audio->getClientOriginalExtension() ?: '');

        return match ($clientExtension) {
            'mp3', 'wav', 'm4a', 'ogg', 'oga' => $clientExtension,
            default => 'ogg',
        };
    }
}
