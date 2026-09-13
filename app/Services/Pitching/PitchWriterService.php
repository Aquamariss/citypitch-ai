<?php

namespace App\Services\Pitching;

use App\Models\PitchWriterMessage;
use App\Models\PitchWriterSession;
use App\Models\User;
use App\Repositories\Pitching\Contracts\PitchWriterSessionRepositoryInterface;
use App\Services\Pitching\Prompts\PitchWriterPrompt;
use Generator;
use Illuminate\Support\Facades\Log;
use OpenAI\Client;
use Throwable;

class PitchWriterService
{
    public function __construct(
        private readonly PitchWriterSessionRepositoryInterface $pitchWriterSessionRepository,
        private readonly PitchWriterSessionService $pitchWriterSessionService,
        private readonly PitchWriterQuotaService $pitchWriterQuotaService,
        private readonly PitchDraftService $pitchDraftService,
        private readonly OpenAiClientFactory $clientFactory,
    ) {}

    /**
     * @return Generator<int, string>
     */
    public function streamTurn(User $user, string $content): Generator
    {
        $this->pitchWriterQuotaService->acquireStreamLock($user->id);

        try {
            $this->pitchWriterQuotaService->assertDailyLimitNotExceeded($user->id);

            $session = $this->pitchWriterSessionService->getOrCreateForUser($user);
            $contextLimit = (int) config('pitching.writer_context_messages', 16);
            $history = $this->pitchWriterSessionRepository->getRecentMessages($session->id, max(0, $contextLimit - 1));
            $pendingHistory = [
                ...$history->all(),
                ['role' => 'user', 'content' => $content],
            ];
            $formattedMessages = $this->buildPromptMessages($session, $pendingHistory);

            $estimate = $this->estimateTokens($formattedMessages)
                + (int) config('pitching.writer_max_completion_tokens', 1000);
            $this->pitchWriterQuotaService->assertTokenBudgetAllows($user->id, $estimate);

            $this->pitchWriterQuotaService->consumeDailyMessageQuota($user->id);
            $this->pitchWriterQuotaService->reserveTokenBudget($user->id, $estimate);

            $this->pitchWriterSessionRepository->createMessage([
                'session_id' => $session->id,
                'role' => 'user',
                'content' => $content,
                'created_at' => now(),
            ]);

            $assistantText = '';
            $draftPatch = null;
            $usageTokens = null;
            $toolRounds = 0;
            $maxToolRounds = (int) config('pitching.writer_max_tool_rounds', 1);

            try {
                foreach ($this->runModelStream($formattedMessages) as $event) {
                    if (connection_aborted()) {
                        break;
                    }

                    if ($event['type'] === 'message.delta') {
                        $assistantText .= $event['text'];
                        yield $this->sse('message.delta', ['text' => $event['text']]);
                    }

                    if ($event['type'] === 'tool_call' && $toolRounds < $maxToolRounds) {
                        $toolRounds++;
                        $applied = $this->handleToolCall($session, $event['name'], $event['arguments']);

                        if ($applied !== null) {
                            $session = $applied['session'];
                            $draftPatch = array_intersect_key(
                                $applied['blocks'],
                                array_flip($applied['changed'])
                            );

                            yield $this->sse('draft.updated', [
                                'blocks' => $applied['blocks'],
                                'changed' => $applied['changed'],
                                'updated_at' => $session->updated_at?->toIso8601String(),
                                'can_undo' => true,
                            ]);
                        }
                    }

                    if ($event['type'] === 'usage') {
                        $usageTokens = $event['total_tokens'];
                    }
                }
            } catch (Throwable $exception) {
                Log::error('Pitch Writer stream failed', [
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);

                yield $this->sse('error', [
                    'message' => 'Не удалось получить ответ. Попробуйте позже.',
                ]);

                return;
            }

            if (trim($assistantText) === '' && is_array($draftPatch) && $draftPatch !== []) {
                $labels = array_map(
                    fn (string $key) => PitchDraftService::label($key),
                    array_keys($draftPatch)
                );
                $assistantText = 'Обновил черновик: '.implode(', ', $labels).'.';
                yield $this->sse('message.delta', ['text' => $assistantText]);
            }

            $assistantMessage = null;

            if (trim($assistantText) !== '') {
                $assistantMessage = $this->pitchWriterSessionRepository->createMessage([
                    'session_id' => $session->id,
                    'role' => 'assistant',
                    'content' => trim($assistantText),
                    'draft_patch' => $draftPatch,
                    'created_at' => now(),
                ]);
            }

            $actualTokens = $usageTokens ?? $estimate;
            $this->pitchWriterQuotaService->settleTokenBudget($user->id, $estimate, $actualTokens);

            yield $this->sse('message.done', [
                'message' => $assistantMessage ? [
                    'id' => $assistantMessage->id,
                    'role' => $assistantMessage->role,
                    'content' => $assistantMessage->content,
                    'draft_patch' => $assistantMessage->draft_patch,
                    'created_at' => $assistantMessage->created_at?->toIso8601String(),
                ] : null,
                'limits' => $this->pitchWriterQuotaService->limitsPayload($user->id),
            ]);
        } finally {
            $this->pitchWriterQuotaService->releaseStreamLock($user->id);
        }
    }

    /**
     * @param  list<PitchWriterMessage|array{role: string, content: string}>  $messages
     * @return list<array{role: string, content: string}>
     */
    private function buildPromptMessages(PitchWriterSession $session, array $messages): array
    {
        $draftSnapshot = $this->pitchDraftService->toPromptSnapshot(
            $this->pitchDraftService->normalize($session->blocks ?? [])
        );

        $formatted = [
            ['role' => 'system', 'content' => PitchWriterPrompt::getSystemPrompt()],
            ['role' => 'system', 'content' => "Текущий черновик питча:\n{$draftSnapshot}"],
        ];

        foreach ($messages as $message) {
            if (is_array($message)) {
                $formatted[] = [
                    'role' => $message['role'],
                    'content' => $message['content'],
                ];

                continue;
            }

            $formatted[] = [
                'role' => $message->role,
                'content' => $message->content,
            ];
        }

        return $formatted;
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     */
    private function estimateTokens(array $messages): int
    {
        $chars = 0;

        foreach ($messages as $message) {
            $chars += mb_strlen($message['content']);
        }

        return (int) max(1, ceil($chars / 4));
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @return Generator<int, array{type: string, text?: string, name?: string, arguments?: string, total_tokens?: int}>
     */
    private function runModelStream(array $messages): Generator
    {
        $stream = $this->client()->chat()->createStreamed([
            'model' => config('pitching.writer_model', 'gpt-4.1-mini'),
            'messages' => $messages,
            'tools' => PitchWriterPrompt::tools(),
            'tool_choice' => 'auto',
            'max_completion_tokens' => (int) config('pitching.writer_max_completion_tokens', 1000),
            'stream_options' => [
                'include_usage' => true,
            ],
        ]);

        $toolCalls = [];
        $emittedToolCalls = false;

        foreach ($stream as $response) {
            if ($response->usage !== null) {
                yield [
                    'type' => 'usage',
                    'total_tokens' => $response->usage->totalTokens,
                ];
            }

            $choice = $response->choices[0] ?? null;

            if ($choice === null) {
                continue;
            }

            $delta = $choice->delta;
            $text = $delta->content ?? null;

            if (is_string($text) && $text !== '') {
                yield ['type' => 'message.delta', 'text' => $text];
            }

            foreach ($delta->toolCalls as $toolCall) {
                $index = $toolCall->index ?? 0;

                if (! isset($toolCalls[$index])) {
                    $toolCalls[$index] = [
                        'id' => $toolCall->id ?? '',
                        'name' => $toolCall->function->name ?? '',
                        'arguments' => '',
                    ];
                }

                if ($toolCall->id !== null) {
                    $toolCalls[$index]['id'] = $toolCall->id;
                }

                if ($toolCall->function->name !== null && $toolCall->function->name !== '') {
                    $toolCalls[$index]['name'] = $toolCall->function->name;
                }

                if ($toolCall->function->arguments !== null && $toolCall->function->arguments !== '') {
                    $toolCalls[$index]['arguments'] .= $toolCall->function->arguments;
                }
            }

            if ($choice->finishReason === 'tool_calls') {
                $emittedToolCalls = true;

                foreach ($toolCalls as $toolCall) {
                    yield [
                        'type' => 'tool_call',
                        'name' => $toolCall['name'],
                        'arguments' => $toolCall['arguments'],
                    ];
                }
            }
        }

        if (! $emittedToolCalls) {
            foreach ($toolCalls as $toolCall) {
                if ($toolCall['name'] !== '' && $toolCall['arguments'] !== '') {
                    yield [
                        'type' => 'tool_call',
                        'name' => $toolCall['name'],
                        'arguments' => $toolCall['arguments'],
                    ];
                }
            }
        }
    }

    /**
     * @return array{blocks: array<string, string>, changed: list<string>, session: PitchWriterSession}|null
     */
    private function handleToolCall(PitchWriterSession $session, string $name, string $argumentsJson): ?array
    {
        if ($name !== 'update_pitch_draft') {
            return null;
        }

        $decoded = json_decode($argumentsJson, true);

        if (! is_array($decoded)) {
            return null;
        }

        $patch = $decoded['blocks'] ?? $decoded;

        if (! is_array($patch)) {
            return null;
        }

        $applied = $this->pitchWriterSessionService->applyAgentPatch($session, $patch);

        if ($applied['changed'] === []) {
            return null;
        }

        return $applied;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sse(string $event, array $payload): string
    {
        return 'event: '.$event."\n".'data: '.json_encode($payload, JSON_UNESCAPED_UNICODE)."\n\n";
    }

    private function client(): Client
    {
        return $this->clientFactory->make((int) config('pitching.writer_request_timeout', 120));
    }
}
