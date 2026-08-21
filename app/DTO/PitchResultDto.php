<?php

namespace App\DTO;

readonly class PitchResultDto
{
    public function __construct(
        public string $id,
        public string $videoUrl,
        public TranscriptionResultDto $transcription,
        public PitchAnalysisResultDto $analysis,
        public string $status = 'completed',
    ) {}
}
