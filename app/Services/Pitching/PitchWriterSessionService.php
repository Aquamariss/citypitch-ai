<?php

namespace App\Services\Pitching;

use App\Models\PitchWriterSession;
use App\Models\User;
use App\Repositories\Pitching\Contracts\PitchWriterSessionRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PitchWriterSessionService
{
    public function __construct(
        private readonly PitchWriterSessionRepositoryInterface $pitchWriterSessionRepository,
        private readonly PitchDraftService $pitchDraftService,
    ) {}

    public function getOrCreateForUser(User $user): PitchWriterSession
    {
        $session = $this->pitchWriterSessionRepository->findByUserId($user->id);

        if ($session) {
            return $session;
        }

        return $this->pitchWriterSessionRepository->create([
            'user_id' => $user->id,
            'blocks' => $this->pitchDraftService->empty(),
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
        $messages = $this->pitchWriterSessionRepository->getAllMessages($session->id);

        return [
            'session' => $this->serializeSession($session),
            'messages' => $messages->map(fn ($message) => [
                'id' => $message->id,
                'role' => $message->role,
                'content' => $message->content,
                'draft_patch' => $message->draft_patch,
                'created_at' => $message->created_at?->toIso8601String(),
            ])->all(),
            'can_undo' => $this->pitchWriterSessionRepository->latestRevision($session->id) !== null,
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

        $normalized = $this->pitchDraftService->normalize($blocks);
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
                $this->pitchWriterSessionRepository->createRevision([
                    'session_id' => $session->id,
                    'blocks' => $session->blocks,
                    'source' => 'user',
                    'created_at' => now(),
                ]);
                $this->pitchWriterSessionRepository->pruneRevisions(
                    $session->id,
                    (int) config('pitching.writer_max_revisions', 20)
                );
            }

            $session = $this->pitchWriterSessionRepository->update($session, ['blocks' => $normalized]);

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
        $normalized = $this->pitchDraftService->normalize($blocks);

        if ($this->pitchDraftService->hasContent($session->blocks) || ! $this->pitchDraftService->hasContent($normalized)) {
            return $this->serializeSession($session);
        }

        $session = $this->pitchWriterSessionRepository->update($session, ['blocks' => $normalized]);

        return $this->serializeSession($session);
    }

    /**
     * @return array{id: string, blocks: array<string, string>, updated_at: string|null}
     */
    public function undoDraft(User $user): array
    {
        $session = $this->getOrCreateForUser($user);
        $revision = $this->pitchWriterSessionRepository->latestRevision($session->id);

        if (! $revision) {
            throw ValidationException::withMessages([
                'draft' => 'Нет изменений для отмены.',
            ]);
        }

        return DB::transaction(function () use ($session, $revision) {
            $session = $this->pitchWriterSessionRepository->update($session, [
                'blocks' => $this->pitchDraftService->normalize($revision->blocks),
            ]);
            $this->pitchWriterSessionRepository->deleteRevision($revision);

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
            $this->pitchWriterSessionRepository->deleteMessages($session->id);

            if ($clearDraft) {
                $this->pitchWriterSessionRepository->update($session, [
                    'blocks' => $this->pitchDraftService->empty(),
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
            $result = $this->pitchDraftService->applyPatch($session->blocks ?? $this->pitchDraftService->empty(), $patch);

            if ($result['changed'] === []) {
                return [
                    'blocks' => $this->pitchDraftService->normalize($session->blocks ?? []),
                    'changed' => [],
                    'session' => $session,
                ];
            }

            $this->pitchWriterSessionRepository->createRevision([
                'session_id' => $session->id,
                'blocks' => $session->blocks,
                'source' => 'agent',
                'created_at' => now(),
            ]);
            $this->pitchWriterSessionRepository->pruneRevisions(
                $session->id,
                (int) config('pitching.writer_max_revisions', 20)
            );

            $session = $this->pitchWriterSessionRepository->update($session, [
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
            'blocks' => $this->pitchDraftService->normalize($session->blocks ?? []),
            'updated_at' => $session->updated_at?->toIso8601String(),
        ];
    }
}
