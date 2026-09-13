<?php

namespace Tests\Unit\Services\Pitching;

use App\DTO\PitchAnalysisResultDto;
use App\DTO\PitchSegmentationResultDto;
use App\DTO\TranscriptionResultDto;
use App\Enums\PitchStatus;
use App\Enums\PitchStep;
use App\Models\Pitch;
use App\Models\User;
use App\Repositories\Pitching\Contracts\PitchRepositoryInterface;
use App\Services\Pitching\PitchAnalysisService;
use App\Services\Pitching\PitchingService;
use App\Services\Pitching\PitchMethodology;
use App\Services\Pitching\PitchScoringService;
use App\Services\Pitching\PitchSegmentationService;
use App\Services\Pitching\TranscriptionService;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PitchingServiceTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    #[Test]
    public function can_upload_today_returns_false_when_limit_reached(): void
    {
        config(['pitching.max_daily_attempts' => 5]);

        $user = new User(['email' => 'student@example.com']);
        $user->id = 1;

        $repository = Mockery::mock(PitchRepositoryInterface::class);
        $repository->shouldReceive('countTodayAttempts')
            ->once()
            ->with(1)
            ->andReturn(5);

        $this->assertFalse($this->makeService($repository)->canUploadToday($user));
    }

    #[Test]
    public function fail_processing_marks_pitch_as_failed(): void
    {
        $pitch = Mockery::mock(Pitch::class);

        $repository = Mockery::mock(PitchRepositoryInterface::class);
        $repository->shouldReceive('find')
            ->once()
            ->with('pitch-id')
            ->andReturn($pitch);
        $repository->shouldReceive('markFailed')
            ->once()
            ->with($pitch, 'Something went wrong');

        $this->makeService($repository)->failProcessing('pitch-id', 'Something went wrong');
    }

    #[Test]
    public function process_stores_transcription_and_scored_evaluation(): void
    {
        $pitch = new Pitch([
            'id' => 'pitch-id',
            'user_id' => 1,
            'audio_path' => storage_path('app/public/pitches/1/pitch-id.ogg'),
            'status' => PitchStatus::Processing,
            'step' => PitchStep::Upload,
        ]);

        $transcription = new TranscriptionResultDto(
            text: 'Меня зовут Анна, я занимаюсь районными сообществами.',
            duration: 585.0,
            language: 'ru',
            segments: [
                ['start' => 0.0, 'end' => 40.0, 'text' => 'Меня зовут Анна'],
                ['start' => 40.0, 'end' => 585.0, 'text' => 'я занимаюсь районными сообществами'],
            ],
        );

        $segmentation = new PitchSegmentationResultDto(blocks: array_map(
            fn (string $key): array => [
                'key' => $key,
                'status' => 'covered',
                'startSegment' => 0,
                'endSegment' => 1,
                'feedback' => 'Блок раскрыт.',
            ],
            PitchMethodology::keys(),
        ));

        $analysis = new PitchAnalysisResultDto(
            name: 'Соседский центр',
            summary: 'Понятный питч.',
            overallFeedback: 'Добавьте цифр в показатели.',
            structureFeedback: 'Все блоки на месте.',
            criteria: [
                'logic' => ['score' => 8.0, 'feedback' => 'Логика выстроена.'],
                'delivery' => ['score' => 7.0, 'feedback' => 'Звучите уверенно.'],
                'clarity' => ['score' => 7.0, 'feedback' => 'Идея понятна.'],
            ],
        );

        $repository = Mockery::mock(PitchRepositoryInterface::class);
        $repository->shouldReceive('findOrFail')->once()->with('pitch-id')->andReturn($pitch);
        $repository->shouldReceive('markProcessing')->times(3)->with($pitch, Mockery::type(PitchStep::class));
        $repository->shouldReceive('markCompleted')->once()->with(
            $pitch,
            Mockery::on(fn (array $data) => str_starts_with($data['text'], 'Меня зовут Анна')),
            Mockery::on(fn (array $data) => $data['isPassed'] === true && $data['score'] > 0 && count($data['blocks']) === 9),
            'Соседский центр',
            Mockery::type('int'),
            Mockery::type('string'),
            585,
        );

        $transcriptionService = Mockery::mock(TranscriptionService::class);
        $transcriptionService->shouldReceive('transcribe')->once()->andReturn($transcription);

        $segmentationService = Mockery::mock(PitchSegmentationService::class);
        $segmentationService->shouldReceive('segment')->once()->andReturn($segmentation);

        $analysisService = Mockery::mock(PitchAnalysisService::class);
        $analysisService->shouldReceive('analyze')->once()->andReturn($analysis);

        $service = $this->makeService($repository, $transcriptionService, $segmentationService, $analysisService);

        $result = $service->process('pitch-id', $pitch->audio_path);

        $this->assertSame('pitch-id', $result->id);
        $this->assertStringStartsWith('Меня зовут Анна', $result->transcription->text);
        $this->assertTrue($result->analysis->isPassed);
        $this->assertSame('Соседский центр', $result->analysis->name);
    }

    private function makeService(
        PitchRepositoryInterface $repository,
        ?TranscriptionService $transcriptionService = null,
        ?PitchSegmentationService $segmentationService = null,
        ?PitchAnalysisService $analysisService = null,
    ): PitchingService {
        return new PitchingService(
            $repository,
            $transcriptionService ?? Mockery::mock(TranscriptionService::class),
            $segmentationService ?? Mockery::mock(PitchSegmentationService::class),
            $analysisService ?? Mockery::mock(PitchAnalysisService::class),
            new PitchScoringService,
        );
    }
}
