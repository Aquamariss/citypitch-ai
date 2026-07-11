<?php

namespace App\Domains\Pitching\DTOs;

readonly class PitchResult
{
    public function __construct(
        public string $id,
        public string $videoUrl,
        public TranscriptionResult $transcription,
        public PitchAnalysisResult $analysis,
        public string $status = 'completed',
    ) {}
}
