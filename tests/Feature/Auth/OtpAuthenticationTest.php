<?php

namespace Tests\Feature\Auth;

use App\Mail\OtpCodeMail;
use App\Models\User;
use App\Services\Auth\OtpService;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
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

    public function test_send_code_remembers_profile_and_sends_mail(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.send-code'), $this->profilePayload());

        $response->assertRedirect();
        $response->assertSessionHas(
            OtpService::PENDING_PROFILE_KEY,
            fn (array $profile) => $profile['email'] === 'student@example.com'
                && $profile['phone'] === '+79001234567'
                && $profile['city'] === 'Кемерово'
                && $profile['messenger'] === '@anna_sokolova',
        );
        Mail::assertSent(OtpCodeMail::class, function (OtpCodeMail $mail) {
            return strlen($mail->code) === 6;
        });
    }

    public function test_personal_data_consent_is_required(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.send-code'), $this->profilePayload([
            'personal_data_consent' => false,
        ]));

        $response->assertSessionHasErrors('personal_data_consent');
        $this->assertGuest();
        Mail::assertNothingSent();
    }

    public function test_email_and_phone_are_required(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.send-code'), $this->profilePayload([
            'email' => '',
            'phone' => '',
        ]));

        $response->assertSessionHasErrors(['email', 'phone']);
        Mail::assertNothingSent();
    }

    public function test_full_name_messenger_city_and_marketing_consent_are_optional(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.send-code'), [
            'email' => 'student@example.com',
            'phone' => '+7 (900) 123-45-67',
            'personal_data_consent' => true,
        ]);

        $response->assertSessionHasNoErrors();
        Mail::assertSent(OtpCodeMail::class);
    }

    public function test_russian_phone_without_country_code_is_normalized(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.send-code'), $this->profilePayload([
            'phone' => '8 (900) 123-45-67',
        ]));

        $response->assertSessionHas(
            OtpService::PENDING_PROFILE_KEY,
            fn (array $profile) => $profile['phone'] === '+79001234567',
        );
    }

    public function test_international_phone_is_accepted(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.send-code'), $this->profilePayload([
            'phone' => '+44 20 7946 0958',
        ]));

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas(
            OtpService::PENDING_PROFILE_KEY,
            fn (array $profile) => $profile['phone'] === '+442079460958',
        );
    }

    public function test_malformed_phone_is_rejected(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.send-code'), $this->profilePayload([
            'phone' => '12345',
        ]));

        $response->assertSessionHasErrors('phone');
        Mail::assertNothingSent();
    }

    public function test_verify_code_creates_user_with_profile_and_consents(): void
    {
        Cache::put('otp_student@example.com', '123456', now()->addMinutes(10));

        $response = $this
            ->withSession([OtpService::PENDING_PROFILE_KEY => $this->pendingProfile(['marketing_consent' => true])])
            ->post(route('auth.verify-code'), [
                'email' => 'student@example.com',
                'code' => '123456',
            ]);

        $response->assertRedirect(route('pitch.index'));
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'student@example.com')->firstOrFail();

        $this->assertSame('Анна Соколова', $user->full_name);
        $this->assertSame('+79001234567', $user->phone);
        $this->assertSame('Кемерово', $user->city);
        $this->assertSame('@anna_sokolova', $user->messenger);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->personal_data_consent_at);
        $this->assertNotNull($user->marketing_consent_at);
    }

    public function test_verify_code_without_pending_profile_asks_to_fill_form_again(): void
    {
        Cache::put('otp_student@example.com', '123456', now()->addMinutes(10));

        $response = $this->post(route('auth.verify-code'), [
            'email' => 'student@example.com',
            'code' => '123456',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->assertSame('123456', Cache::get('otp_student@example.com'), 'Код не должен сгорать, пока анкета не заполнена.');
    }

    public function test_verify_code_reuses_existing_user_and_updates_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'student@example.com',
            'city' => 'Новокузнецк',
            'messenger' => '@old_contact',
            'marketing_consent_at' => now()->subMonth(),
        ]);
        Cache::put('otp_student@example.com', '123456', now()->addMinutes(10));

        $response = $this
            ->withSession([OtpService::PENDING_PROFILE_KEY => $this->pendingProfile([
                'city' => null,
                'messenger' => null,
                'marketing_consent' => false,
            ])])
            ->post(route('auth.verify-code'), [
                'email' => 'student@example.com',
                'code' => '123456',
            ]);

        $response->assertRedirect(route('pitch.index'));
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseCount('users', 1);

        $user->refresh();

        $this->assertSame('Новокузнецк', $user->city, 'Пустое необязательное поле не затирает сохранённое.');
        $this->assertSame('@old_contact', $user->messenger, 'Пустой контакт не затирает сохранённый.');
        $this->assertNull($user->marketing_consent_at, 'Снятая галка отзывает согласие на рекламу.');
    }

    public function test_verify_code_rejects_invalid_code(): void
    {
        Cache::put('otp_student@example.com', '123456', now()->addMinutes(10));

        $response = $this
            ->withSession([OtpService::PENDING_PROFILE_KEY => $this->pendingProfile()])
            ->post(route('auth.verify-code'), [
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

    public function test_local_environment_logs_in_without_otp(): void
    {
        Mail::fake();
        config(['app.env' => 'local']);
        $this->withoutMiddleware([
            PreventRequestForgery::class,
        ]);

        $response = $this->post(route('auth.send-code'), $this->profilePayload([
            'email' => 'dev@example.com',
        ]));

        $response->assertRedirect(route('pitch.index'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'dev@example.com',
            'phone' => '+79001234567',
            'full_name' => 'Анна Соколова',
        ]);
        Mail::assertNothingSent();
    }

    public function test_user_without_consent_is_sent_back_to_login(): void
    {
        $user = User::factory()->withoutConsent()->create();

        $response = $this->actingAs($user)->get(route('pitch.index'));

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_login_remembers_user_for_configured_period(): void
    {
        Cache::put('otp_student@example.com', '123456', now()->addMinutes(10));

        $response = $this
            ->withSession([OtpService::PENDING_PROFILE_KEY => $this->pendingProfile()])
            ->post(route('auth.verify-code'), [
                'email' => 'student@example.com',
                'code' => '123456',
            ]);

        $recallerName = Auth::guard('web')->getRecallerName();
        $response->assertCookie($recallerName);

        $expiresAt = $response->getCookie($recallerName, decrypt: false)->getExpiresTime();
        $expectedExpiry = now()->addMinutes((int) config('auth.guards.web.remember'))->getTimestamp();

        $this->assertSame(43200, (int) config('auth.guards.web.remember'), 'По умолчанию тренажёр помнит пользователя 30 дней.');
        $this->assertEqualsWithDelta($expectedExpiry, $expiresAt, 120);
        $this->assertNotNull(User::query()->where('email', 'student@example.com')->value('remember_token'));
    }

    public function test_remembered_user_enters_without_the_form(): void
    {
        $user = User::factory()->create(['remember_token' => 'remembered-token']);
        $guard = Auth::guard('web');
        $recaller = $user->id.'|remembered-token|'.$guard->hashPasswordForCookie($user->getAuthPassword());

        $response = $this
            ->withCookie($guard->getRecallerName(), $recaller)
            ->get(route('pitch.index'));

        $response->assertOk();
        $this->assertAuthenticatedAs($user);
    }

    public function test_remembered_user_without_consent_is_still_sent_to_the_form(): void
    {
        $user = User::factory()->withoutConsent()->create(['remember_token' => 'remembered-token']);
        $guard = Auth::guard('web');
        $recaller = $user->id.'|remembered-token|'.$guard->hashPasswordForCookie($user->getAuthPassword());

        $response = $this
            ->withCookie($guard->getRecallerName(), $recaller)
            ->get(route('pitch.index'));

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function profilePayload(array $overrides = []): array
    {
        return array_merge([
            'full_name' => 'Анна Соколова',
            'email' => 'student@example.com',
            'phone' => '+7 (900) 123-45-67',
            'city' => 'Кемерово',
            'messenger' => '@anna_sokolova',
            'personal_data_consent' => true,
            'marketing_consent' => false,
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function pendingProfile(array $overrides = []): array
    {
        return array_merge([
            'email' => 'student@example.com',
            'phone' => '+79001234567',
            'full_name' => 'Анна Соколова',
            'city' => 'Кемерово',
            'messenger' => '@anna_sokolova',
            'marketing_consent' => false,
        ], $overrides);
    }
}
