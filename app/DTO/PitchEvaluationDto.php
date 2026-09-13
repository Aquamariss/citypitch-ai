<?php

namespace App\DTO;

/**
 * Итоговая оценка питча: то, что сохраняется в `pitches.result`
 * и уходит на экран результата.
 */
readonly class PitchEvaluationDto
{
    /**
     * @param  list<array{key: string, name: string, score: float, maxScore: float, feedback: string}>  $criteria
     * @param  list<array{key: string, title: string, status: string, actualSeconds: int|null, limitSeconds: int, feedback: string}>  $blocks
     * @param  array{fillerCount: int, fillerTop: list<array{word: string, count: int}>, wordCount: int}  $speech
     * @param  array{actualSeconds: int, recommendedSeconds: int, hardLimitSeconds: int, wasCutOff: bool}  $duration
     */
    public function __construct(
        public string $name,
        public int $score,
        public bool $isPassed,
        public string $summary,
        public string $overallFeedback,
        public array $criteria,
        public array $blocks,
        public array $speech,
        public array $duration,
        public string $methodologyVersion,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'score' => $this->score,
            'isPassed' => $this->isPassed,
            'summary' => $this->summary,
            'overallFeedback' => $this->overallFeedback,
            'criteria' => $this->criteria,
            'blocks' => $this->blocks,
            'speech' => $this->speech,
            'duration' => $this->duration,
            'methodologyVersion' => $this->methodologyVersion,
        ];
    }

    /**
     * @param  array<string, mixed>  $result
     */
    public static function fromArray(array $result, string $name): self
    {
        return new self(
            name: $name,
            score: (int) ($result['score'] ?? 0),
            isPassed: (bool) ($result['isPassed'] ?? false),
            summary: (string) ($result['summary'] ?? ''),
            overallFeedback: (string) ($result['overallFeedback'] ?? ''),
            criteria: $result['criteria'] ?? [],
            blocks: $result['blocks'] ?? [],
            speech: $result['speech'] ?? ['fillerCount' => 0, 'fillerTop' => [], 'wordCount' => 0],
            duration: $result['duration'] ?? [
                'actualSeconds' => 0,
                'recommendedSeconds' => 0,
                'hardLimitSeconds' => 0,
                'wasCutOff' => false,
            ],
            methodologyVersion: (string) ($result['methodologyVersion'] ?? ''),
        );
    }
}
