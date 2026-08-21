<?php

namespace App\Services\Pitching;

use App\Services\Pitching\Exceptions\PitchWriterDailyLimitExceededException;
use App\Services\Pitching\Exceptions\PitchWriterStreamBusyException;
use App\Services\Pitching\Exceptions\PitchWriterTokenBudgetExceededException;
use Illuminate\Support\Facades\Cache;

class PitchWriterQuotaService
{
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

    public function acquireStreamLock(int $userId): void
    {
        $key = $this->streamLockKey($userId);
        $ttl = (int) config('pitching.writer_request_timeout', 120) + 30;

        if (! Cache::add($key, 1, $ttl)) {
            throw new PitchWriterStreamBusyException;
        }
    }

    public function releaseStreamLock(int $userId): void
    {
        Cache::forget($this->streamLockKey($userId));
    }

    public function consumeDailyMessageQuota(int $userId): void
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

    public function assertTokenBudgetAllows(int $userId, int $estimate): void
    {
        $budget = (int) config('pitching.writer_daily_token_budget', 100000);
        $used = $this->getDailyTokenCount($userId);

        if ($used + $estimate > $budget) {
            throw new PitchWriterTokenBudgetExceededException;
        }
    }

    public function reserveTokenBudget(int $userId, int $estimate): void
    {
        $key = $this->dailyTokenCacheKey($userId);
        Cache::add($key, 0, now()->endOfDay());
        Cache::increment($key, $estimate);
    }

    public function settleTokenBudget(int $userId, int $reserved, int $actual): void
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
