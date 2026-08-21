<?php

namespace App\Services\Auth;

use App\Mail\OtpCodeMail;
use App\Models\User;
use App\Repositories\Auth\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class OtpService
{
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

    public function authenticateUser(string $email): User
    {
        return $this->userRepository->findOrCreateByEmail($email);
    }

    public function login(User $user): void
    {
        Auth::login($user);
    }

    public function logout(): void
    {
        Auth::logout();
    }
}
