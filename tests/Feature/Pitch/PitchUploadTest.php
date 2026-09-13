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
            'audio' => UploadedFile::fake()->create('pitch.webm', 100, 'audio/webm'),
            'duration' => 600,
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_upload_audio_pitch(): void
    {
        Bus::fake();
        Storage::fake('public');

        $user = User::factory()->create(['email' => 'student@example.com']);

        $response = $this->actingAs($user)->post(route('pitch.upload'), [
            'audio' => UploadedFile::fake()->create('pitch.webm', 100, 'audio/webm'),
            'duration' => 585,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('pitches', [
            'user_id' => $user->id,
            'duration' => 585,
            'status' => 'processing',
        ]);

        Bus::assertDispatched(ProcessPitchJob::class);
    }

    /**
     * Браузер пишет звук в контейнер WebM, а по содержимому он определяется
     * как video/webm — такую запись обязаны принимать.
     */
    public function test_audio_recorded_into_a_webm_container_is_accepted(): void
    {
        Bus::fake();
        Storage::fake('public');

        $user = User::factory()->create(['email' => 'student@example.com']);

        $response = $this->actingAs($user)->post(route('pitch.upload'), [
            'audio' => UploadedFile::fake()->create('pitch.webm', 100, 'video/webm'),
            'duration' => 585,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseCount('pitches', 1);
        Bus::assertDispatched(ProcessPitchJob::class);
    }

    public function test_non_media_upload_is_rejected(): void
    {
        Bus::fake();
        Storage::fake('public');

        $user = User::factory()->create(['email' => 'student@example.com']);

        $response = $this->actingAs($user)->post(route('pitch.upload'), [
            'audio' => UploadedFile::fake()->create('pitch.pdf', 100, 'application/pdf'),
            'duration' => 585,
        ]);

        $response->assertSessionHasErrors('audio');
        $this->assertDatabaseCount('pitches', 0);
        Bus::assertNotDispatched(ProcessPitchJob::class);
    }

    public function test_recording_longer_than_hard_limit_is_rejected(): void
    {
        Bus::fake();
        Storage::fake('public');

        $user = User::factory()->create(['email' => 'student@example.com']);

        $response = $this->actingAs($user)->post(route('pitch.upload'), [
            'audio' => UploadedFile::fake()->create('pitch.webm', 100, 'audio/webm'),
            'duration' => config('pitching.max_duration_seconds') + 1,
        ]);

        $response->assertSessionHasErrors('duration');
        $this->assertDatabaseCount('pitches', 0);
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
            'audio' => UploadedFile::fake()->create('pitch.webm', 100, 'audio/webm'),
            'duration' => 600,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('audio');
        $this->assertDatabaseCount('pitches', 5);
    }
}
