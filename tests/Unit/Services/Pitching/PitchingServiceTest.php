<?php

namespace Tests\Unit\Services\Pitching;

use App\DTO\PitchAnalysisResultDto;
use App\DTO\TranscriptionResultDto;
use App\Enums\PitchStatus;
use App\Enums\PitchStep;
use App\Models\Pitch;
use App\Models\User;
use App\Repositories\Pitching\Contracts\PitchRepositoryInterface;
use App\Services\Pitching\PitchAnalysisService;
use App\Services\Pitching\PitchingService;
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

        $user = new User(['email' => '__VG_EMAIL_249f0363e205__']);
        $user->id = 1;

        $repository = Mockery::mock(PitchRepositoryInterface::class);
        $repository->shouldReceive('countTodayAttempts')
            ->once()
            ->with(1)
            ->andReturn(5);

        $service = new PitchingService(
            $repository,
            Mockery::mock(TranscriptionService::class),
            Mockery::mock(PitchAnalysisService::class),
        );

        $this->assertFalse($service->canUploadToday($user));
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

        $service = new PitchingService(
            $repository,
            Mockery::mock(TranscriptionService::class),
            Mockery::mock(PitchAnalysisService::class),
        );

        $service->failProcessing('pitch-id', 'Something went wrong');
    }

    #[Test]
    public function process_stores_transcription_and_analysis(): void
    {
        $pitch = new Pitch([
            'id' => 'pitch-id',
            'user_id' => 1,
            'video_path' => storage_path('app/public/pitches/1/pitch-id.webm'),
            'status' => PitchStatus::Processing,
            'step' => PitchStep::Upload,
        ]);

        $transcription = new TranscriptionResultDto(
            text: 'Hello world',
            duration: 120.0,
            language: 'ru',
            segments: [],
        );

        $analysis = new PitchAnalysisResultDto(
            name: 'AI-репетитор',
            summary: 'Good pitch',
            isPassed: true,
            criteria: [],
            overallFeedback: 'Well done',
        );

        $repository = Mockery::mock(PitchRepositoryInterface::class);
        $repository->shouldReceive('findOrFail')->once()->with('pitch-id')->andReturn($pitch);
        $repository->shouldReceive('markProcessing')->twice()->with($pitch, Mockery::type(PitchStep::class));
        $repository->shouldReceive('markCompleted')->once()->with(
            $pitch,
            Mockery::on(fn (array $data) => $data['text'] === 'Hello world'),
            Mockery::on(fn (array $data) => $data['isPassed'] === true),
            'AI-репетитор',
        );

        $transcriptionService = Mockery::mock(TranscriptionService::class);
        $transcriptionService->shouldReceive('transcribe')
            ->once()
            ->andReturn($transcription);

        $analysisService = Mockery::mock(PitchAnalysisService::class);
        $analysisService->shouldReceive('analyze')
            ->once()
            ->with('Hello world', 180, 120.0)
            ->andReturn($analysis);

        $service = new PitchingService($repository, $transcriptionService, $analysisService);

        $result = $service->process('pitch-id', $pitch->video_path, 180);

        $this->assertSame('pitch-id', $result->id);
        $this->assertSame('Hello world', $result->transcription->text);
        $this->assertTrue($result->analysis->isPassed);
        $this->assertSame('AI-репетитор', $result->analysis->name);
    }
}
