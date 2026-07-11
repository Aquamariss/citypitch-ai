<?php

namespace Tests\Feature\Auth;

use App\Mail\OtpCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OtpAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_is_accessible(): void
    {
        $response = $this->get(route('login'));

        $response->assertOk();
    }

    public function test_send_code_stores_otp_and_sends_mail(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.send-code'), [
            'email' => 'student@example.com',
        ]);

        $response->assertRedirect();
        Mail::assertSent(OtpCodeMail::class, function (OtpCodeMail $mail) {
            return strlen($mail->code) === 6;
        });
    }

    public function test_verify_code_creates_user_and_authenticates_session(): void
    {
        Cache::put('otp_student@example.com', '123456', now()->addMinutes(10));

        $response = $this->post(route('auth.verify-code'), [
            'email' => 'student@example.com',
            'code' => '123456',
        ]);

        $response->assertRedirect(route('pitch.index'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'student@example.com',
        ]);
        $this->assertNotNull(User::where('email', 'student@example.com')->first()->email_verified_at);
    }

    public function test_verify_code_reuses_existing_user(): void
    {
        $user = User::factory()->create(['email' => 'student@example.com']);
        Cache::put('otp_student@example.com', '123456', now()->addMinutes(10));

        $response = $this->post(route('auth.verify-code'), [
            'email' => 'student@example.com',
            'code' => '123456',
        ]);

        $response->assertRedirect(route('pitch.index'));
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_verify_code_rejects_invalid_code(): void
    {
        Cache::put('otp_student@example.com', '123456', now()->addMinutes(10));

        $response = $this->post(route('auth.verify-code'), [
            'email' => 'student@example.com',
            'code' => '000000',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('code');
        $this->assertGuest();
        $this->assertDatabaseMissing('users', [
            'email' => 'student@example.com',
        ]);
    }

    public function test_logout_clears_session(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('auth.logout'));

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }
}
