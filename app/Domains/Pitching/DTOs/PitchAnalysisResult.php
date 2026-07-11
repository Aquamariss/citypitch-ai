<?php

namespace App\Domains\Pitching\DTOs;

readonly class PitchAnalysisResult
{
    /**
     * @param  array<int, array{name: string, score: int, feedback: string}>  $criteria
     */
    public function __construct(
        public string $name,
        public string $summary,
        public bool $isPassed,
        public array $criteria,
        public string $overallFeedback,
    ) {}
}
