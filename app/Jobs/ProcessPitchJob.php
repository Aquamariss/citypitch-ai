<?php

namespace App\Jobs;

use App\Services\Pitching\PitchingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessPitchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Десятиминутная запись: распознавание речи плюс два обращения к модели.
     */
    public $timeout = 900;

    public function __construct(
        public string $pitchId,
        public string $audioPath,
    ) {}

    public function handle(PitchingService $pitchingService): void
    {
        try {
            $pitchingService->process($this->pitchId, $this->audioPath);
        } catch (\Throwable $e) {
            $pitchingService->failProcessing($this->pitchId, $e->getMessage());

            throw $e;
        }
    }
}
