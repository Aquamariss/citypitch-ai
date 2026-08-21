<?php

namespace App\Http\Controllers\Auth;

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
        $email = $request->validated('email');

        if (! $this->otpService->isOtpRequired()) {
            $user = $this->otpService->authenticateUser($email);
            $this->otpService->login($user);
            $request->session()->regenerate();

            return redirect()->intended(route('pitch.index', absolute: false));
        }

        $this->otpService->sendCode($email);

        return back()->with('status', 'code-sent');
    }

    public function verifyCode(VerifyOtpRequest $request)
    {
        $email = $request->validated('email');
        $code = $request->validated('code');

        if (! $this->otpService->verifyCode($email, $code)) {
            return back()->withErrors([
                'code' => 'Неверный или устаревший код подтверждения.',
            ]);
        }

        $user = $this->otpService->authenticateUser($email);
        $this->otpService->login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('pitch.index', absolute: false));
    }

    public function logout(Request $request)
    {
        $this->otpService->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
