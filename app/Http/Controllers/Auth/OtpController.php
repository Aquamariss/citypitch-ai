<?php

namespace App\Http\Controllers\Auth;

use App\Domains\Auth\Services\OtpService;
use App\Http\Controllers\Controller;
use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OtpController extends Controller
{
    public function __construct(
        private OtpService $otpService
    ) {}

    public function showLogin(Request $request)
    {
        if (Auth::check()) {
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
            $this->otpService->authenticateSession($request, $email);

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

        $this->otpService->authenticateSession($request, $email);

        return redirect()->intended(route('pitch.index', absolute: false));
    }

    public function logout(Request $request)
    {
        $this->otpService->logout($request);

        return redirect()->route('login');
    }
}
