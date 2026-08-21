<?php

namespace Tests\Feature\Pitch;

use App\Models\User;
use App\Services\Pitching\PitchWriterQuotaService;
use App\Services\Pitching\PitchWriterService;
use Generator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PitchWriterChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_chat(): void
    {
        $response = $this->postJson(route('pitch-writer.chat'), [
            'content' => 'Помоги написать питч',
        ]);

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_access_index(): void
    {
        $response = $this->get(route('pitch-writer.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_index_creates_session_and_returns_payload(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('pitch-writer.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('PitchWriter/Index')
            ->has('session.id')
            ->has('session.blocks')
            ->has('messages')
            ->has('limits.messages_remaining')
            ->has('limits.tokens_remaining_approx')
            ->where('can_undo', false)
        );

        $this->assertDatabaseHas('pitch_writer_sessions', [
            'user_id' => $user->id,
        ]);
    }

    public function test_validation_rejects_invalid_content(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('pitch-writer.chat'), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);

        config(['pitching.writer_max_message_length' => 10]);

        $this->actingAs($user)
            ->postJson(route('pitch-writer.chat'), [
                'content' => str_repeat('a', 11),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    }

    public function test_authenticated_user_can_stream_chat(): void
    {
        $user = User::factory()->create();

        $this->mock(PitchWriterQuotaService::class, function ($mock) use ($user): void {
            $mock->shouldReceive('assertDailyLimitNotExceeded')
                ->once()
                ->with($user->id);
        });

        $this->mock(PitchWriterService::class, function ($mock) use ($user): void {
            $mock->shouldReceive('streamTurn')
                ->once()
                ->withArgs(fn (User $passedUser, string $content) => $passedUser->is($user)
                    && $content === 'Помоги написать питч для edtech стартапа.')
                ->andReturn($this->streamChunks([
                    "event: message.delta\ndata: {\"text\":\"Привет\"}\n\n",
                    "event: message.delta\ndata: {\"text\":\" мир\"}\n\n",
                    "event: message.done\ndata: {\"message\":null,\"limits\":{\"messages_remaining\":49,\"tokens_remaining_approx\":99000}}\n\n",
                ]));
        });

        $response = $this->actingAs($user)->post(route('pitch-writer.chat'), [
            'content' => 'Помоги написать питч для edtech стартапа.',
        ]);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/event-stream; charset=utf-8');
        $this->assertStringContainsString('event: message.delta', $response->streamedContent());
        $this->assertStringContainsString('Привет', $response->streamedContent());
    }

    public function test_daily_limit_returns_429(): void
    {
        $user = User::factory()->create();

        config(['pitching.writer_daily_messages' => 2]);

        Cache::put('pitch-writer:'.$user->id.':'.now()->toDateString(), 2, now()->endOfDay());

        $response = $this->actingAs($user)->postJson(route('pitch-writer.chat'), [
            'content' => 'Помоги написать питч',
        ]);

        $response->assertStatus(429);
    }

    public function test_throttle_middleware_applied(): void
    {
        $user = User::factory()->create();

        $this->mock(PitchWriterQuotaService::class, function ($mock) use ($user): void {
            $mock->shouldReceive('assertDailyLimitNotExceeded')
                ->times(10)
                ->with($user->id);
        });

        $this->mock(PitchWriterService::class, function ($mock): void {
            $mock->shouldReceive('streamTurn')
                ->times(10)
                ->andReturnUsing(fn () => $this->streamChunks([
                    "event: message.done\ndata: {\"message\":null}\n\n",
                ]));
        });

        for ($i = 0; $i < 10; $i++) {
            $response = $this->actingAs($user)
                ->post(route('pitch-writer.chat'), ['content' => 'Сообщение '.$i]);

            $response->assertOk();
            $response->streamedContent();
        }

        $this->actingAs($user)
            ->postJson(route('pitch-writer.chat'), ['content' => 'Ещё одно'])
            ->assertStatus(429);
    }

    public function test_chat_endpoint_streams_when_service_is_mocked(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('pitch-writer.index'))->assertOk();

        $this->mock(PitchWriterQuotaService::class, function ($mock) use ($user): void {
            $mock->shouldReceive('assertDailyLimitNotExceeded')->once()->with($user->id);
        });

        $this->mock(PitchWriterService::class, function ($mock): void {
            $mock->shouldReceive('streamTurn')
                ->once()
                ->andReturn($this->streamChunks([
                    "event: message.delta\ndata: {\"text\":\"Ок\"}\n\n",
                    "event: message.done\ndata: {\"message\":{\"id\":\"1\",\"role\":\"assistant\",\"content\":\"Ок\",\"draft_patch\":null}}\n\n",
                ]));
        });

        $response = $this->actingAs($user)
            ->post(route('pitch-writer.chat'), ['content' => 'Нужен блок проблемы']);

        $response->assertOk();
        $this->assertStringContainsString('Ок', $response->streamedContent());
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
