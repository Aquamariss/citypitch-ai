<?php

namespace App\Domains\Pitching\DTOs;

readonly class TranscriptionResult
{
    public function __construct(
        public string $text,
        public float $duration,
        public string $language,
        public array $segments = [],
    ) {}
}
