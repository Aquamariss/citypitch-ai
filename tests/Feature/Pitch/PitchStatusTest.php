<?php

namespace Tests\Feature\Pitch;

use App\Models\Pitch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PitchStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_endpoint_returns_json_for_processing_pitch(): void
    {
        $user = User::factory()->create(['email' => 'student@example.com']);
        $pitch = Pitch::factory()->processing()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson(route('pitch.status', ['pitch' => $pitch->id]));

        $response->assertOk()
            ->assertJson([
                'status' => 'processing',
                'step' => 'распознавание речи',
            ]);
    }

    public function test_status_redirects_to_result_when_completed(): void
    {
        $user = User::factory()->create(['email' => 'student@example.com']);
        $pitch = Pitch::factory()->completed()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->get(route('pitch.status', ['pitch' => $pitch->id]));

        $response->assertRedirect(route('pitch.result', ['pitch' => $pitch->id]));
    }

    public function test_result_page_is_accessible_for_completed_pitch(): void
    {
        $user = User::factory()->create(['email' => 'student@example.com']);
        $pitch = Pitch::factory()->completed()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->get(route('pitch.result', ['pitch' => $pitch->id]));

        $response->assertOk();
    }

    public function test_user_cannot_access_another_users_pitch(): void
    {
        $user = User::factory()->create(['email' => 'student@example.com']);
        $otherUser = User::factory()->create(['email' => 'other@example.com']);
        $pitch = Pitch::factory()->completed()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($user)
            ->get(route('pitch.result', ['pitch' => $pitch->id]));

        $response->assertRedirect(route('pitch.index'));
        $response->assertSessionHasErrors('video');
    }
}
