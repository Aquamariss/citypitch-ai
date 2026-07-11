<?php

namespace App\Domains\Auth\Services;

use App\Domains\Auth\Repositories\UserRepositoryInterface;
use App\Mail\OtpCodeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {}

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
        return $this->users->findOrCreateByEmail($email);
    }

    public function authenticateSession(Request $request, string $email): User
    {
        $user = $this->authenticateUser($email);

        Auth::login($user);
        $request->session()->regenerate();

        return $user;
    }

    public function logout(Request $request): void
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
