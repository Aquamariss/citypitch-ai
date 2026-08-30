<?php

namespace Database\Factories;

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
            'audio_path' => null,
            'duration' => 600,
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
            'name' => 'Соседский центр в Заречье',
            'status' => PitchStatus::Completed,
            'step' => PitchStep::Done,
            'score' => 72,
            'methodology_version' => 'city-2026-08',
            'duration' => 585,
            'transcription' => [
                'text' => 'Меня зовут Анна, я занимаюсь развитием районных сообществ.',
                'duration' => 585.0,
                'language' => 'ru',
                'segments' => [
                    ['start' => 0.0, 'end' => 2.5, 'text' => 'Меня зовут Анна'],
                ],
            ],
            'result' => [
                'score' => 72,
                'isPassed' => true,
                'summary' => 'Понятный питч с сильным блоком о ценности для города.',
                'overallFeedback' => 'Добавьте конкретики в показатели.',
                'criteria' => [
                    [
                        'key' => 'structure',
                        'name' => 'Структура',
                        'score' => 25.0,
                        'maxScore' => 30.0,
                        'feedback' => 'Почти все блоки на месте.',
                    ],
                ],
                'blocks' => [
                    [
                        'key' => 'intro',
                        'title' => 'Представление',
                        'status' => 'covered',
                        'actualSeconds' => 40,
                        'limitSeconds' => 45,
                        'feedback' => 'Коротко и по делу.',
                    ],
                ],
                'speech' => ['fillerCount' => 4, 'fillerTop' => [], 'wordCount' => 900],
                'duration' => [
                    'actualSeconds' => 585,
                    'recommendedSeconds' => 600,
                    'hardLimitSeconds' => 720,
                    'wasCutOff' => false,
                ],
                'methodologyVersion' => 'city-2026-08',
            ],
            'audio_path' => storage_path('app/public/pitches/1/pitch.ogg'),
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
