<?php

namespace App\Domains\Pitching\Services;

use App\Domains\Pitching\Exceptions\PitchWriterDailyLimitExceededException;
use App\Domains\Pitching\Prompts\PitchWriterPrompt;
use Generator;
use Illuminate\Support\Facades\Cache;
use OpenAI;
use OpenAI\Client;

class PitchWriterService
{
    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function streamChat(int $userId, array $messages): Generator
    {
        $this->consumeDailyMessageQuota($userId);

        $formattedMessages = [
            ['role' => 'system', 'content' => PitchWriterPrompt::getSystemPrompt()],
        ];

        foreach ($messages as $message) {
            $formattedMessages[] = [
                'role' => $message['role'],
                'content' => $message['content'],
            ];
        }

        $stream = $this->client()->chat()->createStreamed([
            'model' => config('pitching.writer_model', 'gpt-5.4-mini'),
            'messages' => $formattedMessages,
        ]);

        foreach ($stream as $response) {
            $text = $response->choices[0]->delta->content ?? null;

            if ($text !== null && $text !== '') {
                yield $text;
            }
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
}
