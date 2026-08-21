<?php

namespace Database\Factories;

use App\Enums\MediaType;
use App\Enums\PitchStatus;
use App\Enums\PitchStep;
use App\Models\Pitch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pitch>
 */
class PitchFactory extends Factory
{
    protected $model = Pitch::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => PitchStatus::Processing,
            'step' => PitchStep::Upload,
            'video_path' => null,
            'duration' => 180,
            'media_type' => MediaType::Video,
            'transcription' => null,
            'result' => null,
            'error_message' => null,
        ];
    }

    public function processing(): static
    {
        return $this->state(fn () => [
            'status' => PitchStatus::Processing,
            'step' => PitchStep::Transcription,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'name' => 'AI-репетитор для школьников',
            'status' => PitchStatus::Completed,
            'step' => PitchStep::Done,
            'transcription' => [
                'text' => 'Test transcription',
                'duration' => 120.0,
                'language' => 'ru',
                'segments' => [
                    ['start' => 0.0, 'end' => 2.5, 'text' => 'Hello world'],
                ],
            ],
            'result' => [
                'summary' => 'Good pitch',
                'isPassed' => true,
                'criteria' => [],
                'overallFeedback' => 'Well done',
            ],
            'video_path' => storage_path('app/public/pitches/1/pitch.webm'),
        ]);
    }

    public function error(): static
    {
        return $this->state(fn () => [
            'status' => PitchStatus::Error,
            'step' => PitchStep::Error,
            'error_message' => 'Processing failed',
        ]);
    }
}
