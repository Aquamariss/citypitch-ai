<?php

namespace App\Services\Auth;

use App\DTO\UserProfileDto;
use App\Mail\OtpCodeMail;
use App\Models\User;
use App\Repositories\Auth\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    /**
     * Анкета ждёт в сессии, пока пользователь не введёт код из письма.
     */
    public const PENDING_PROFILE_KEY = 'auth.pending_profile';

    public function __construct(
        private UserRepositoryInterface $userRepository,
    ) {}

    public function isOtpRequired(): bool
    {
        return config('app.env') !== 'local';
    }

    public function sendCode(string $email): void
    {
        $code = (string) random_int(100000, 999999);

        Cache::put("otp_{$email}", $code, now()->addMinutes(10));

        Mail::to($email)->send(new OtpCodeMail($code));
    }

    public function verifyCode(string $email, string $code): bool
    {
        $cachedCode = Cache::get("otp_{$email}");

        if (! $cachedCode || $cachedCode !== $code) {
            return false;
        }

        Cache::forget("otp_{$email}");

        return true;
    }

    public function rememberPendingProfile(UserProfileDto $profile): void
    {
        session()->put(self::PENDING_PROFILE_KEY, $profile->toArray());
    }

    /**
     * Анкета, заполненная для этого email на первом шаге входа.
     */
    public function pendingProfile(string $email): ?UserProfileDto
    {
        $data = session()->get(self::PENDING_PROFILE_KEY);

        if (! is_array($data) || ($data['email'] ?? null) !== $email) {
            return null;
        }

        return UserProfileDto::fromArray($data);
    }

    public function forgetPendingProfile(): void
    {
        session()->forget(self::PENDING_PROFILE_KEY);
    }

    public function authenticateUser(UserProfileDto $profile): User
    {
        $user = $this->userRepository->findOrCreateByEmail($profile->email);

        return $this->userRepository->saveProfile($user, $profile);
    }

    /**
     * Пользователь запоминается: следующие визиты в пределах срока
     * auth.guards.web.remember проходят без формы входа.
     */
    public function login(User $user): void
    {
        Auth::login($user, remember: true);
    }

    public function logout(): void
    {
        Auth::logout();
    }
}
