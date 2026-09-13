<?php

namespace App\Http\Controllers\Auth;

use App\DTO\UserProfileDto;
use App\Http\Controllers\Controller;
use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Services\Auth\OtpService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OtpController extends Controller
{
    public function __construct(
        private OtpService $otpService
    ) {}

    public function showLogin(Request $request)
    {
        if ($request->user() !== null) {
            return redirect()->route('pitch.index');
        }

        return Inertia::render('Auth/Login', [
            'otpRequired' => $this->otpService->isOtpRequired(),
        ]);
    }

    public function sendCode(SendOtpRequest $request)
    {
        $profile = $request->toProfile();

        if (! $this->otpService->isOtpRequired()) {
            $this->completeLogin($request, $profile);

            return redirect()->intended(route('pitch.index', absolute: false));
        }

        $this->otpService->rememberPendingProfile($profile);
        $this->otpService->sendCode($profile->email);

        return back()->with('status', 'code-sent');
    }

    public function verifyCode(VerifyOtpRequest $request)
    {
        $email = $request->validated('email');
        $profile = $this->otpService->pendingProfile($email);

        // Анкету проверяем до кода, чтобы код не сгорел впустую.
        if ($profile === null) {
            return back()->withErrors([
                'email' => 'Данные формы не сохранились — заполните её ещё раз.',
            ]);
        }

        if (! $this->otpService->verifyCode($email, $request->validated('code'))) {
            return back()->withErrors([
                'code' => 'Неверный или устаревший код подтверждения.',
            ]);
        }

        $this->otpService->forgetPendingProfile();
        $this->completeLogin($request, $profile);

        return redirect()->intended(route('pitch.index', absolute: false));
    }

    public function logout(Request $request)
    {
        $this->otpService->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    private function completeLogin(Request $request, UserProfileDto $profile): void
    {
        $user = $this->otpService->authenticateUser($profile);
        $this->otpService->login($user);
        $request->session()->regenerate();
    }
}
