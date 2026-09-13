<?php

namespace App\DTO;

readonly class PitchResultDto
{
    public function __construct(
        public string $id,
        public string $audioUrl,
        public TranscriptionResultDto $transcription,
        public PitchEvaluationDto $analysis,
        public string $status = 'completed',
    ) {}
}
