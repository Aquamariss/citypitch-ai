<?php

namespace Tests\Feature\Pitch;

use App\Domains\Pitching\Services\PitchWriterService;
use App\Models\User;
use Generator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PitchWriterChatTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<int, array{role: string, content: string}>
     */
    private function validMessages(): array
    {
        return [
            ['role' => 'user', 'content' => 'Помоги написать питч для edtech стартапа.'],
        ];
    }

    public function test_guest_cannot_access_chat(): void
    {
        $response = $this->postJson(route('pitch-writer.chat'), [
            'messages' => $this->validMessages(),
        ]);

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_access_index(): void
    {
        $response = $this->get(route('pitch-writer.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_validation_rejects_invalid_messages(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('pitch-writer.chat'), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['messages']);

        $this->actingAs($user)
            ->postJson(route('pitch-writer.chat'), [
                'messages' => [
                    ['role' => 'system', 'content' => 'hack'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['messages.0.role']);

        config(['pitching.writer_max_message_length' => 10]);

        $this->actingAs($user)
            ->postJson(route('pitch-writer.chat'), [
                'messages' => [
                    ['role' => 'user', 'content' => str_repeat('a', 11)],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['messages.0.content']);
    }

    public function test_authenticated_user_can_stream_chat(): void
    {
        $user = User::factory()->create();

        $this->mock(PitchWriterService::class, function ($mock) use ($user): void {
            $mock->shouldReceive('assertDailyLimitNotExceeded')
                ->once()
                ->with($user->id);

            $mock->shouldReceive('streamChat')
                ->once()
                ->with($user->id, $this->validMessages())
                ->andReturn($this->streamChunks(['Привет', ' мир']));
        });

        $response = $this->actingAs($user)->post(route('pitch-writer.chat'), [
            'messages' => $this->validMessages(),
        ]);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/plain; charset=utf-8');
        $this->assertSame('Привет мир', $response->streamedContent());
    }

    public function test_daily_limit_returns_429(): void
    {
        $user = User::factory()->create();

        config(['pitching.writer_daily_messages' => 2]);

        Cache::put('pitch-writer:'.$user->id.':'.now()->toDateString(), 2, now()->endOfDay());

        $response = $this->actingAs($user)->postJson(route('pitch-writer.chat'), [
            'messages' => $this->validMessages(),
        ]);

        $response->assertStatus(429);
    }

    public function test_throttle_middleware_applied(): void
    {
        $user = User::factory()->create();

        $this->mock(PitchWriterService::class, function ($mock) use ($user): void {
            $mock->shouldReceive('assertDailyLimitNotExceeded')
                ->times(10)
                ->with($user->id);

            $mock->shouldReceive('streamChat')
                ->times(10)
                ->andReturnUsing(fn () => $this->streamChunks(['ok']));
        });

        for ($i = 0; $i < 10; $i++) {
            $response = $this->actingAs($user)
                ->post(route('pitch-writer.chat'), ['messages' => $this->validMessages()]);

            $response->assertOk();
            $this->assertSame('ok', $response->streamedContent());
        }

        $this->actingAs($user)
            ->postJson(route('pitch-writer.chat'), ['messages' => $this->validMessages()])
            ->assertStatus(429);
    }

    /**
     * @param  array<int, string>  $chunks
     */
    private function streamChunks(array $chunks): Generator
    {
        foreach ($chunks as $chunk) {
            yield $chunk;
        }
    }
}
