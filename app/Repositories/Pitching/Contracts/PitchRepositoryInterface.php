<?php

namespace App\Repositories\Pitching\Contracts;

use App\Enums\PitchStep;
use App\Models\Pitch;
use Illuminate\Database\Eloquent\Collection;

interface PitchRepositoryInterface
{
    public function find(string $id): ?Pitch;

    public function findOrFail(string $id): Pitch;

    public function create(array $attributes): Pitch;

    public function update(Pitch $pitch, array $attributes): Pitch;

    public function countTodayAttempts(int $userId): int;

    /**
     * @return Collection<int, Pitch>
     */
    public function getCompletedByUserId(int $userId): Collection;

    public function markProcessing(Pitch $pitch, PitchStep $step): void;

    /**
     * @param  array<string, mixed>  $transcription
     * @param  array<string, mixed>  $result
     */
    public function markCompleted(Pitch $pitch, array $transcription, array $result, string $name): void;

    public function markFailed(Pitch $pitch, string $message): void;
}
