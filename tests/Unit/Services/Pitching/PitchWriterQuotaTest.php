<?php

namespace Tests\Unit\Services\Pitching;

use App\Models\User;
use App\Services\Pitching\Exceptions\PitchWriterStreamBusyException;
use App\Services\Pitching\Exceptions\PitchWriterTokenBudgetExceededException;
use App\Services\Pitching\PitchWriterQuotaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PitchWriterQuotaTest extends TestCase
{
    use RefreshDatabase;

    public function test_stream_lock_prevents_concurrent_turns(): void
    {
        $user = User::factory()->create();
        $service = app(PitchWriterQuotaService::class);

        $service->acquireStreamLock($user->id);

        $this->expectException(PitchWriterStreamBusyException::class);
        $service->acquireStreamLock($user->id);
    }

    public function test_token_budget_blocks_when_exceeded(): void
    {
        $user = User::factory()->create();
        config(['pitching.writer_daily_token_budget' => 100]);

        Cache::put('pitch-writer:tokens:'.$user->id.':'.now()->toDateString(), 90, now()->endOfDay());

        $service = app(PitchWriterQuotaService::class);

        $this->expectException(PitchWriterTokenBudgetExceededException::class);
        $service->assertTokenBudgetAllows($user->id, 20);
    }

    public function test_limits_payload_reports_remaining_quota(): void
    {
        $user = User::factory()->create();
        config([
            'pitching.writer_daily_messages' => 50,
            'pitching.writer_daily_token_budget' => 1000,
        ]);

        Cache::put('pitch-writer:'.$user->id.':'.now()->toDateString(), 10, now()->endOfDay());
        Cache::put('pitch-writer:tokens:'.$user->id.':'.now()->toDateString(), 250, now()->endOfDay());

        $limits = app(PitchWriterQuotaService::class)->limitsPayload($user->id);

        $this->assertSame(40, $limits['messages_remaining']);
        $this->assertSame(750, $limits['tokens_remaining_approx']);
    }
}
