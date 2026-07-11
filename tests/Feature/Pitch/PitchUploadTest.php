<?php

namespace Tests\Feature\Pitch;

use App\Jobs\ProcessPitchJob;
use App\Models\Pitch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PitchUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_upload_pitch(): void
    {
        Storage::fake('public');

        $response = $this->post(route('pitch.upload'), [
            'video' => UploadedFile::fake()->create('pitch.webm', 100, 'video/webm'),
            'duration' => 180,
            'media_type' => 'video',
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_upload_pitch(): void
    {
        Bus::fake();
        Storage::fake('public');

        $user = User::factory()->create(['email' => 'student@example.com']);

        $response = $this->actingAs($user)->post(route('pitch.upload'), [
            'video' => UploadedFile::fake()->create('pitch.webm', 100, 'video/webm'),
            'duration' => 180,
            'media_type' => 'video',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('pitches', [
            'user_id' => $user->id,
            'duration' => 180,
            'status' => 'processing',
        ]);

        Bus::assertDispatched(ProcessPitchJob::class);
    }

    public function test_upload_is_blocked_when_daily_limit_reached(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['email' => 'student@example.com']);

        Pitch::factory()
            ->count(5)
            ->create([
                'user_id' => $user->id,
                'created_at' => now(),
            ]);

        $response = $this->actingAs($user)->post(route('pitch.upload'), [
            'video' => UploadedFile::fake()->create('pitch.webm', 100, 'video/webm'),
            'duration' => 180,
            'media_type' => 'video',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('video');
        $this->assertDatabaseCount('pitches', 5);
    }
}
