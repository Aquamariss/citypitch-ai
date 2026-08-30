<?php

namespace App\DTO;

/**
 * Результат первого этапа анализа: разметка транскрипта по блокам методики.
 */
readonly class PitchSegmentationResultDto
{
    /**
     * @param  list<array{key: string, status: string, startSegment: int, endSegment: int, feedback: string}>  $blocks
     */
    public function __construct(
        public array $blocks,
    ) {}

    /**
     * @return array{key: string, status: string, startSegment: int, endSegment: int, feedback: string}|null
     */
    public function block(string $key): ?array
    {
        foreach ($this->blocks as $block) {
            if ($block['key'] === $key) {
                return $block;
            }
        }

        return null;
    }
}
