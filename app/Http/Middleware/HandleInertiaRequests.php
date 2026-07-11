<?php

namespace App\Http\Middleware;

use App\Domains\Pitching\Repositories\PitchRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'status' => fn () => $request->session()->get('status'),
            'auth_email' => fn () => $request->user()?->email,
            'attempts_used' => fn () => $request->user()
                ? app(PitchRepositoryInterface::class)->countTodayAttempts($request->user()->id)
                : 0,
            'max_attempts' => fn () => config('pitching.max_daily_attempts', 5),
        ];
    }
}
