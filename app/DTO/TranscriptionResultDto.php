<?php

namespace App\DTO;

readonly class TranscriptionResultDto
{
    public function __construct(
        public string $text,
        public float $duration,
        public string $language,
        public array $segments = [],
    ) {}
}
