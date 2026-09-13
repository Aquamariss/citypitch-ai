<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Не пускает в тренажёр без анкеты и согласия на обработку персональных
 * данных. Нужен для сессий, открытых до появления анкеты на входе.
 */
class EnsureConsentGiven
{
    private const MESSAGE = 'Заполните форму входа: нам нужны ваши контакты и согласие на обработку персональных данных.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || $user->hasCompletedProfile()) {
            return $next($request);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json(['message' => self::MESSAGE], Response::HTTP_UNAUTHORIZED);
        }

        return redirect()->route('login')->with('status', self::MESSAGE);
    }
}
