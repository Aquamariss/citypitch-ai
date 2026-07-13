<?php

namespace Tests\Feature\Pitch;

use App\Domains\Pitching\Support\PitchDraftBlocks;
use App\Models\PitchWriterMessage;
use App\Models\PitchWriterSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PitchWriterSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_draft_blocks(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson(route('pitch-writer.draft.update'), [
            'blocks' => [
                ...PitchDraftBlocks::empty(),
                'problem' => 'Фаундеры готовят питч вслепую.',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('session.blocks.problem', 'Фаундеры готовят питч вслепую.')
            ->assertJsonPath('can_undo', true);

        $this->assertDatabaseHas('pitch_writer_sessions', [
            'user_id' => $user->id,
        ]);
    }

    public function test_draft_update_rejects_oversized_block(): void
    {
        $user = User::factory()->create();

        config(['pitching.writer_max_block_length' => 10]);

        $this->actingAs($user)
            ->patchJson(route('pitch-writer.draft.update'), [
                'blocks' => [
                    ...PitchDraftBlocks::empty(),
                    'problem' => str_repeat('a', 11),
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['blocks.problem']);
    }

    public function test_import_only_fills_empty_draft(): void
    {
        $user = User::factory()->create();

        $session = PitchWriterSession::query()->create([
            'user_id' => $user->id,
            'blocks' => PitchDraftBlocks::empty(),
        ]);

        $this->actingAs($user)
            ->postJson(route('pitch-writer.draft.import'), [
                'blocks' => [
                    ...PitchDraftBlocks::empty(),
                    'solution' => 'Pitch AI закрывает цикл подготовки.',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('session.blocks.solution', 'Pitch AI закрывает цикл подготовки.');

        $session->update([
            'blocks' => [
                ...PitchDraftBlocks::empty(),
                'problem' => 'Уже есть текст',
            ],
        ]);

        $this->actingAs($user)
            ->postJson(route('pitch-writer.draft.import'), [
                'blocks' => [
                    ...PitchDraftBlocks::empty(),
                    'solution' => 'Не должно примениться',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('session.blocks.problem', 'Уже есть текст')
            ->assertJsonPath('session.blocks.solution', '');
    }

    public function test_undo_restores_previous_blocks(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patchJson(route('pitch-writer.draft.update'), [
            'blocks' => [
                ...PitchDraftBlocks::empty(),
                'problem' => 'Первая версия',
            ],
        ])->assertOk();

        $this->actingAs($user)->patchJson(route('pitch-writer.draft.update'), [
            'blocks' => [
                ...PitchDraftBlocks::empty(),
                'problem' => 'Вторая версия',
            ],
        ])->assertOk();

        $this->actingAs($user)
            ->postJson(route('pitch-writer.draft.undo'))
            ->assertOk()
            ->assertJsonPath('session.blocks.problem', 'Первая версия');
    }

    public function test_reset_clears_messages_and_optionally_draft(): void
    {
        $user = User::factory()->create();

        $session = PitchWriterSession::query()->create([
            'user_id' => $user->id,
            'blocks' => [
                ...PitchDraftBlocks::empty(),
                'problem' => 'Текст',
            ],
        ]);

        PitchWriterMessage::query()->create([
            'session_id' => $session->id,
            'role' => 'user',
            'content' => 'Привет',
            'created_at' => now(),
        ]);

        $this->actingAs($user)
            ->postJson(route('pitch-writer.session.reset'), [
                'clear_draft' => true,
            ])
            ->assertOk()
            ->assertJsonPath('messages', [])
            ->assertJsonPath('session.blocks.problem', '');

        $this->assertDatabaseCount('pitch_writer_messages', 0);
    }

    public function test_user_cannot_update_another_users_session_via_shared_endpoints(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        PitchWriterSession::query()->create([
            'user_id' => $owner->id,
            'blocks' => [
                ...PitchDraftBlocks::empty(),
                'problem' => 'Секретно',
            ],
        ]);

        $this->actingAs($intruder)
            ->patchJson(route('pitch-writer.draft.update'), [
                'blocks' => [
                    ...PitchDraftBlocks::empty(),
                    'problem' => 'Чужой текст',
                ],
            ])
            ->assertOk();

        $this->assertSame(
            'Секретно',
            PitchWriterSession::query()->where('user_id', $owner->id)->value('blocks')['problem'] ?? null
        );

        $this->assertSame(
            'Чужой текст',
            PitchWriterSession::query()->where('user_id', $intruder->id)->value('blocks')['problem'] ?? null
        );
    }

    public function test_studio_index_includes_draft_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('pitch.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Pitch/Index')
                ->has('draft_session.id')
                ->has('draft_session.blocks')
            );
    }
}
