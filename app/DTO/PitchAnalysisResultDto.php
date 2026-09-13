<?php

namespace App\DTO;

use App\Services\Pitching\PitchScoringService;

/**
 * Результат второго этапа анализа: содержательные оценки модели.
 *
 * Баллы за структуру и тайминг сюда не входят — их считает
 * {@see PitchScoringService}.
 */
readonly class PitchAnalysisResultDto
{
    /**
     * @param  array<string, array{score: float, feedback: string}>  $criteria  оценки 0–10 по ключам критериев
     */
    public function __construct(
        public string $name,
        public string $summary,
        public string $overallFeedback,
        public string $structureFeedback,
        public array $criteria,
    ) {}
}
