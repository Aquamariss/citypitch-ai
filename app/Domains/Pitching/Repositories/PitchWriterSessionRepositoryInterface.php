<?php

namespace App\Domains\Pitching\Repositories;

use App\Models\PitchWriterDraftRevision;
use App\Models\PitchWriterMessage;
use App\Models\PitchWriterSession;
use Illuminate\Database\Eloquent\Collection;

interface PitchWriterSessionRepositoryInterface
{
    public function findByUserId(int $userId): ?PitchWriterSession;

    public function findOrFailForUser(string $sessionId, int $userId): PitchWriterSession;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): PitchWriterSession;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(PitchWriterSession $session, array $attributes): PitchWriterSession;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createMessage(array $attributes): PitchWriterMessage;

    /**
     * @return Collection<int, PitchWriterMessage>
     */
    public function getRecentMessages(string $sessionId, int $limit): Collection;

    /**
     * @return Collection<int, PitchWriterMessage>
     */
    public function getAllMessages(string $sessionId): Collection;

    public function deleteMessages(string $sessionId): void;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createRevision(array $attributes): PitchWriterDraftRevision;

    public function latestRevision(string $sessionId): ?PitchWriterDraftRevision;

    public function deleteRevision(PitchWriterDraftRevision $revision): void;

    public function pruneRevisions(string $sessionId, int $keep): void;
}
