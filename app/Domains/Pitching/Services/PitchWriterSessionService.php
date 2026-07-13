<?php

namespace App\Domains\Pitching\Services;

use App\Domains\Pitching\Repositories\PitchWriterSessionRepositoryInterface;
use App\Domains\Pitching\Support\PitchDraftBlocks;
use App\Models\PitchWriterSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PitchWriterSessionService
{
    public function __construct(
        private readonly PitchWriterSessionRepositoryInterface $sessions
    ) {}

    public function getOrCreateForUser(User $user): PitchWriterSession
    {
        $session = $this->sessions->findByUserId($user->id);

        if ($session) {
            return $session;
        }

        return $this->sessions->create([
            'user_id' => $user->id,
            'blocks' => PitchDraftBlocks::empty(),
        ]);
    }

    /**
     * @return array{
     *     session: array{id: string, blocks: array<string, string>, updated_at: string|null},
     *     messages: list<array{id: string, role: string, content: string, draft_patch: array<string, string>|null, created_at: string|null}>,
     *     can_undo: bool
     * }
     */
    public function payloadForUser(User $user): array
    {
        $session = $this->getOrCreateForUser($user);
        $messages = $this->sessions->getAllMessages($session->id);

        return [
            'session' => $this->serializeSession($session),
            'messages' => $messages->map(fn ($message) => [
                'id' => $message->id,
                'role' => $message->role,
                'content' => $message->content,
                'draft_patch' => $message->draft_patch,
                'created_at' => $message->created_at?->toIso8601String(),
            ])->all(),
            'can_undo' => $this->sessions->latestRevision($session->id) !== null,
        ];
    }

    /**
     * @param  array<string, mixed>  $blocks
     * @return array{id: string, blocks: array<string, string>, updated_at: string|null}
     */
    public function updateDraft(User $user, array $blocks, ?string $updatedAt = null): array
    {
        $session = $this->getOrCreateForUser($user);

        if ($updatedAt !== null && $session->updated_at?->toIso8601String() !== $updatedAt) {
            throw ValidationException::withMessages([
                'updated_at' => 'Черновик был изменён в другой вкладке. Обновите страницу.',
            ]);
        }

        $normalized = PitchDraftBlocks::normalize($blocks);
        $maxLength = (int) config('pitching.writer_max_block_length', 1500);

        foreach ($normalized as $key => $value) {
            if (mb_strlen($value) > $maxLength) {
                throw ValidationException::withMessages([
                    "blocks.{$key}" => "Блок не должен превышать {$maxLength} символов.",
                ]);
            }
        }

        return DB::transaction(function () use ($session, $normalized) {
            if ($session->blocks !== $normalized) {
                $this->sessions->createRevision([
                    'session_id' => $session->id,
                    'blocks' => $session->blocks,
                    'source' => 'user',
                    'created_at' => now(),
                ]);
                $this->sessions->pruneRevisions(
                    $session->id,
                    (int) config('pitching.writer_max_revisions', 20)
                );
            }

            $session = $this->sessions->update($session, ['blocks' => $normalized]);

            return $this->serializeSession($session);
        });
    }

    /**
     * @param  array<string, mixed>  $blocks
     * @return array{id: string, blocks: array<string, string>, updated_at: string|null}
     */
    public function importDraftIfEmpty(User $user, array $blocks): array
    {
        $session = $this->getOrCreateForUser($user);
        $normalized = PitchDraftBlocks::normalize($blocks);

        if (PitchDraftBlocks::hasContent($session->blocks) || ! PitchDraftBlocks::hasContent($normalized)) {
            return $this->serializeSession($session);
        }

        $session = $this->sessions->update($session, ['blocks' => $normalized]);

        return $this->serializeSession($session);
    }

    /**
     * @return array{id: string, blocks: array<string, string>, updated_at: string|null}
     */
    public function undoDraft(User $user): array
    {
        $session = $this->getOrCreateForUser($user);
        $revision = $this->sessions->latestRevision($session->id);

        if (! $revision) {
            throw ValidationException::withMessages([
                'draft' => 'Нет изменений для отмены.',
            ]);
        }

        return DB::transaction(function () use ($session, $revision) {
            $session = $this->sessions->update($session, [
                'blocks' => PitchDraftBlocks::normalize($revision->blocks),
            ]);
            $this->sessions->deleteRevision($revision);

            return $this->serializeSession($session);
        });
    }

    /**
     * @return array{
     *     session: array{id: string, blocks: array<string, string>, updated_at: string|null},
     *     messages: list<array{}>,
     *     can_undo: bool
     * }
     */
    public function resetSession(User $user, bool $clearDraft = false): array
    {
        $session = $this->getOrCreateForUser($user);

        return DB::transaction(function () use ($session, $clearDraft, $user) {
            $this->sessions->deleteMessages($session->id);

            if ($clearDraft) {
                $this->sessions->update($session, [
                    'blocks' => PitchDraftBlocks::empty(),
                ]);
            }

            return $this->payloadForUser($user);
        });
    }

    /**
     * @param  array<string, mixed>  $patch
     * @return array{blocks: array<string, string>, changed: list<string>, session: PitchWriterSession}
     */
    public function applyAgentPatch(PitchWriterSession $session, array $patch): array
    {
        return DB::transaction(function () use ($session, $patch) {
            $result = PitchDraftBlocks::applyPatch($session->blocks ?? PitchDraftBlocks::empty(), $patch);

            if ($result['changed'] === []) {
                return [
                    'blocks' => PitchDraftBlocks::normalize($session->blocks ?? []),
                    'changed' => [],
                    'session' => $session,
                ];
            }

            $this->sessions->createRevision([
                'session_id' => $session->id,
                'blocks' => $session->blocks,
                'source' => 'agent',
                'created_at' => now(),
            ]);
            $this->sessions->pruneRevisions(
                $session->id,
                (int) config('pitching.writer_max_revisions', 20)
            );

            $session = $this->sessions->update($session, [
                'blocks' => $result['blocks'],
            ]);

            return [
                'blocks' => $result['blocks'],
                'changed' => $result['changed'],
                'session' => $session,
            ];
        });
    }

    /**
     * @return array{id: string, blocks: array<string, string>, updated_at: string|null}
     */
    private function serializeSession(PitchWriterSession $session): array
    {
        return [
            'id' => $session->id,
            'blocks' => PitchDraftBlocks::normalize($session->blocks ?? []),
            'updated_at' => $session->updated_at?->toIso8601String(),
        ];
    }
}
