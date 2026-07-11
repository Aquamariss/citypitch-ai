<?php

namespace App\Jobs;

use App\Domains\Pitching\Services\PitchingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessPitchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300;

    public function __construct(
        public string $pitchId,
        public string $videoPath,
        public int $durationSeconds,
        public int $userId,
    ) {}

    public function handle(PitchingService $pitchingService): void
    {
        try {
            $pitchingService->process($this->pitchId, $this->videoPath, $this->durationSeconds, $this->userId);
        } catch (\Throwable $e) {
            $pitchingService->failProcessing($this->pitchId, $e->getMessage());

            throw $e;
        }
    }
}
