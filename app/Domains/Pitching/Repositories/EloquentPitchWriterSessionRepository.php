<?php

namespace App\Domains\Pitching\Repositories;

use App\Models\PitchWriterDraftRevision;
use App\Models\PitchWriterMessage;
use App\Models\PitchWriterSession;
use Illuminate\Database\Eloquent\Collection;

class EloquentPitchWriterSessionRepository implements PitchWriterSessionRepositoryInterface
{
    public function findByUserId(int $userId): ?PitchWriterSession
    {
        return PitchWriterSession::query()
            ->where('user_id', $userId)
            ->first();
    }

    public function findOrFailForUser(string $sessionId, int $userId): PitchWriterSession
    {
        return PitchWriterSession::query()
            ->whereKey($sessionId)
            ->where('user_id', $userId)
            ->firstOrFail();
    }

    public function create(array $attributes): PitchWriterSession
    {
        return PitchWriterSession::query()->create($attributes);
    }

    public function update(PitchWriterSession $session, array $attributes): PitchWriterSession
    {
        $session->update($attributes);

        return $session->refresh();
    }

    public function createMessage(array $attributes): PitchWriterMessage
    {
        return PitchWriterMessage::query()->create($attributes);
    }

    public function getRecentMessages(string $sessionId, int $limit): Collection
    {
        return PitchWriterMessage::query()
            ->where('session_id', $sessionId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->sortBy('created_at')
            ->values();
    }

    public function getAllMessages(string $sessionId): Collection
    {
        return PitchWriterMessage::query()
            ->where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get();
    }

    public function deleteMessages(string $sessionId): void
    {
        PitchWriterMessage::query()
            ->where('session_id', $sessionId)
            ->delete();
    }

    public function createRevision(array $attributes): PitchWriterDraftRevision
    {
        return PitchWriterDraftRevision::query()->create($attributes);
    }

    public function latestRevision(string $sessionId): ?PitchWriterDraftRevision
    {
        return PitchWriterDraftRevision::query()
            ->where('session_id', $sessionId)
            ->orderByDesc('created_at')
            ->first();
    }

    public function deleteRevision(PitchWriterDraftRevision $revision): void
    {
        $revision->delete();
    }

    public function pruneRevisions(string $sessionId, int $keep): void
    {
        $idsToKeep = PitchWriterDraftRevision::query()
            ->where('session_id', $sessionId)
            ->orderByDesc('created_at')
            ->limit($keep)
            ->pluck('id');

        PitchWriterDraftRevision::query()
            ->where('session_id', $sessionId)
            ->whereNotIn('id', $idsToKeep)
            ->delete();
    }
}
