<?php

namespace App\Domains\Pitching\Repositories;

use App\Domains\Pitching\Enums\PitchStatus;
use App\Domains\Pitching\Enums\PitchStep;
use App\Models\Pitch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class EloquentPitchRepository implements PitchRepositoryInterface
{
    public function find(string $id): ?Pitch
    {
        return Pitch::find($id);
    }

    public function findOrFail(string $id): Pitch
    {
        return Pitch::findOrFail($id);
    }

    public function create(array $attributes): Pitch
    {
        return Pitch::create($attributes);
    }

    public function update(Pitch $pitch, array $attributes): Pitch
    {
        $pitch->update($attributes);

        return $pitch->refresh();
    }

    public function countTodayAttempts(int $userId): int
    {
        return $this->scopeForUser(Pitch::query(), $userId)
            ->where(fn (Builder $query) => $this->scopeToday($query))
            ->count();
    }

    public function getCompletedByUserId(int $userId): Collection
    {
        return $this->scopeForUser(Pitch::query(), $userId)
            ->where(fn (Builder $query) => $this->scopeCompleted($query))
            ->orderByDesc('created_at')
            ->get();
    }

    public function markProcessing(Pitch $pitch, PitchStep $step): void
    {
        $this->update($pitch, [
            'status' => PitchStatus::Processing,
            'step' => $step,
        ]);
    }

    public function markCompleted(Pitch $pitch, array $transcription, array $result, string $name): void
    {
        $this->update($pitch, [
            'name' => $name,
            'status' => PitchStatus::Completed,
            'step' => PitchStep::Done,
            'transcription' => $transcription,
            'result' => $result,
        ]);
    }

    public function markFailed(Pitch $pitch, string $message): void
    {
        $this->update($pitch, [
            'status' => PitchStatus::Error,
            'step' => PitchStep::Error,
            'error_message' => $message,
        ]);
    }

    private function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    private function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', PitchStatus::Completed);
    }

    private function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('created_at', today());
    }
}
