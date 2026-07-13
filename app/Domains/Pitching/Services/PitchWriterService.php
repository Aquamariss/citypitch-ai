<?php

namespace App\Domains\Pitching\Services;

use App\Domains\Pitching\Exceptions\PitchWriterDailyLimitExceededException;
use App\Domains\Pitching\Exceptions\PitchWriterStreamBusyException;
use App\Domains\Pitching\Exceptions\PitchWriterTokenBudgetExceededException;
use App\Domains\Pitching\Prompts\PitchWriterPrompt;
use App\Domains\Pitching\Repositories\PitchWriterSessionRepositoryInterface;
use App\Domains\Pitching\Support\PitchDraftBlocks;
use App\Models\PitchWriterMessage;
use App\Models\PitchWriterSession;
use App\Models\User;
use Generator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use OpenAI;
use OpenAI\Client;
use Throwable;

class PitchWriterService
{
    public function __construct(
        private readonly PitchWriterSessionRepositoryInterface $sessions,
        private readonly PitchWriterSessionService $sessionService,
    ) {}

    /**
     * @return Generator<int, string>
     */
    public function streamTurn(User $user, string $content): Generator
    {
        $this->acquireStreamLock($user->id);

        try {
            $this->assertDailyLimitNotExceeded($user->id);

            $session = $this->sessionService->getOrCreateForUser($user);
            $contextLimit = (int) config('pitching.writer_context_messages', 16);
            $history = $this->sessions->getRecentMessages($session->id, max(0, $contextLimit - 1));
            $pendingHistory = [
                ...$history->all(),
                new PitchWriterMessage([
                    'role' => 'user',
                    'content' => $content,
                ]),
            ];
            $formattedMessages = $this->buildPromptMessages($session, $pendingHistory);

            $estimate = $this->estimateTokens($formattedMessages)
                + (int) config('pitching.writer_max_completion_tokens', 1000);
            $this->assertTokenBudgetAllows($user->id, $estimate);

            $this->consumeDailyMessageQuota($user->id);
            $this->reserveTokenBudget($user->id, $estimate);

            $this->sessions->createMessage([
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
                    fn (string $key) => PitchDraftBlocks::LABELS[$key] ?? $key,
                    array_keys($draftPatch)
                );
                $assistantText = 'Обновил черновик: '.implode(', ', $labels).'.';
                yield $this->sse('message.delta', ['text' => $assistantText]);
            }

            $assistantMessage = null;

            if (trim($assistantText) !== '') {
                $assistantMessage = $this->sessions->createMessage([
                    'session_id' => $session->id,
                    'role' => 'assistant',
                    'content' => trim($assistantText),
                    'draft_patch' => $draftPatch,
                    'created_at' => now(),
                ]);
            }

            $actualTokens = $usageTokens ?? $estimate;
            $this->settleTokenBudget($user->id, $estimate, $actualTokens);

            yield $this->sse('message.done', [
                'message' => $assistantMessage ? [
                    'id' => $assistantMessage->id,
                    'role' => $assistantMessage->role,
                    'content' => $assistantMessage->content,
                    'draft_patch' => $assistantMessage->draft_patch,
                    'created_at' => $assistantMessage->created_at?->toIso8601String(),
                ] : null,
                'limits' => $this->limitsPayload($user->id),
            ]);
        } finally {
            $this->releaseStreamLock($user->id);
        }
    }

    public function assertDailyLimitNotExceeded(int $userId): void
    {
        $maxMessages = (int) config('pitching.writer_daily_messages', 50);

        if ($this->getDailyMessageCount($userId) >= $maxMessages) {
            throw new PitchWriterDailyLimitExceededException;
        }
    }

    public function getDailyMessageCount(int $userId): int
    {
        return (int) Cache::get($this->dailyLimitCacheKey($userId), 0);
    }

    public function getDailyTokenCount(int $userId): int
    {
        return (int) Cache::get($this->dailyTokenCacheKey($userId), 0);
    }

    /**
     * @return array{messages_remaining: int, tokens_remaining_approx: int}
     */
    public function limitsPayload(int $userId): array
    {
        $maxMessages = (int) config('pitching.writer_daily_messages', 50);
        $maxTokens = (int) config('pitching.writer_daily_token_budget', 100000);

        return [
            'messages_remaining' => max(0, $maxMessages - $this->getDailyMessageCount($userId)),
            'tokens_remaining_approx' => max(0, $maxTokens - $this->getDailyTokenCount($userId)),
        ];
    }

    private function acquireStreamLock(int $userId): void
    {
        $key = $this->streamLockKey($userId);
        $ttl = (int) config('pitching.writer_request_timeout', 120) + 30;

        if (! Cache::add($key, 1, $ttl)) {
            throw new PitchWriterStreamBusyException;
        }
    }

    private function releaseStreamLock(int $userId): void
    {
        Cache::forget($this->streamLockKey($userId));
    }

    private function consumeDailyMessageQuota(int $userId): void
    {
        $key = $this->dailyLimitCacheKey($userId);
        $maxMessages = (int) config('pitching.writer_daily_messages', 50);
        $ttl = now()->endOfDay();

        Cache::add($key, 0, $ttl);

        $count = (int) Cache::increment($key);

        if ($count > $maxMessages) {
            Cache::decrement($key);

            throw new PitchWriterDailyLimitExceededException;
        }
    }

    private function assertTokenBudgetAllows(int $userId, int $estimate): void
    {
        $budget = (int) config('pitching.writer_daily_token_budget', 100000);
        $used = $this->getDailyTokenCount($userId);

        if ($used + $estimate > $budget) {
            throw new PitchWriterTokenBudgetExceededException;
        }
    }

    private function reserveTokenBudget(int $userId, int $estimate): void
    {
        $key = $this->dailyTokenCacheKey($userId);
        Cache::add($key, 0, now()->endOfDay());
        Cache::increment($key, $estimate);
    }

    private function settleTokenBudget(int $userId, int $reserved, int $actual): void
    {
        $key = $this->dailyTokenCacheKey($userId);
        $delta = $actual - $reserved;

        if ($delta > 0) {
            Cache::increment($key, $delta);
        } elseif ($delta < 0) {
            $current = (int) Cache::get($key, 0);
            Cache::put($key, max(0, $current + $delta), now()->endOfDay());
        }
    }

    /**
     * @param  list<PitchWriterMessage>  $messages
     * @return list<array{role: string, content: string}>
     */
    private function buildPromptMessages(PitchWriterSession $session, array $messages): array
    {
        $draftSnapshot = PitchDraftBlocks::toPromptSnapshot(
            PitchDraftBlocks::normalize($session->blocks ?? [])
        );

        $formatted = [
            ['role' => 'system', 'content' => PitchWriterPrompt::getSystemPrompt()],
            ['role' => 'system', 'content' => "Текущий черновик питча:\n{$draftSnapshot}"],
        ];

        foreach ($messages as $message) {
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
            'model' => config('pitching.writer_model', 'gpt-5.4-mini'),
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

        $applied = $this->sessionService->applyAgentPatch($session, $patch);

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
        $apiKey = config('openai.api_key');
        $organization = config('openai.organization');
        $project = config('openai.project');
        $baseUri = config('openai.base_uri');

        $factory = OpenAI::factory()
            ->withApiKey(is_string($apiKey) ? $apiKey : '')
            ->withOrganization(is_string($organization) ? $organization : null)
            ->withHttpClient(new \GuzzleHttp\Client([
                'timeout' => (int) config('pitching.writer_request_timeout', 120),
            ]));

        if (is_string($project)) {
            $factory->withProject($project);
        }

        if (is_string($baseUri)) {
            $factory->withBaseUri($baseUri);
        }

        return $factory->make();
    }

    private function dailyLimitCacheKey(int $userId): string
    {
        return 'pitch-writer:'.$userId.':'.now()->toDateString();
    }

    private function dailyTokenCacheKey(int $userId): string
    {
        return 'pitch-writer:tokens:'.$userId.':'.now()->toDateString();
    }

    private function streamLockKey(int $userId): string
    {
        return 'pitch-writer:stream:'.$userId;
    }
}
