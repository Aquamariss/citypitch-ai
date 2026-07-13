<?php

namespace Tests\Feature\Pitch;

use App\Domains\Pitching\Services\PitchWriterSessionService;
use App\Domains\Pitching\Support\PitchDraftBlocks;
use App\Models\PitchWriterSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PitchWriterAgentDraftTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_patch_updates_blocks_and_creates_revision(): void
    {
        $user = User::factory()->create();
        $session = PitchWriterSession::query()->create([
            'user_id' => $user->id,
            'blocks' => PitchDraftBlocks::empty(),
        ]);

        $service = app(PitchWriterSessionService::class);
        $result = $service->applyAgentPatch($session, [
            'problem' => 'Фаундеры готовят питч без обратной связи.',
            'solution' => 'Pitch AI даёт оценку до демо-дня.',
        ]);

        $this->assertSame(['problem', 'solution'], $result['changed']);
        $this->assertSame(
            'Фаундеры готовят питч без обратной связи.',
            $result['blocks']['problem']
        );
        $this->assertDatabaseCount('pitch_writer_draft_revisions', 1);

        $undone = $service->undoDraft($user);
        $this->assertSame('', $undone['blocks']['problem']);
    }
}
