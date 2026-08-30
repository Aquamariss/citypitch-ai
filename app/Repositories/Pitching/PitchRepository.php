<?php

namespace App\Repositories\Pitching;

use App\Enums\PitchStatus;
use App\Enums\PitchStep;
use App\Models\Pitch;
use App\Repositories\Pitching\Contracts\PitchRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class PitchRepository implements PitchRepositoryInterface
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

    public function markCompleted(
        Pitch $pitch,
        array $transcription,
        array $result,
        string $name,
        int $score,
        string $methodologyVersion,
        int $durationSeconds,
    ): void {
        $this->update($pitch, [
            'name' => $name,
            'status' => PitchStatus::Completed,
            'step' => PitchStep::Done,
            'score' => $score,
            'methodology_version' => $methodologyVersion,
            'duration' => $durationSeconds,
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
