<?php

namespace App\Providers;

use App\Repositories\Pitching\Contracts\PitchRepositoryInterface;
use App\Repositories\Pitching\Contracts\PitchWriterSessionRepositoryInterface;
use App\Repositories\Pitching\PitchRepository;
use App\Repositories\Pitching\PitchWriterSessionRepository;
use Illuminate\Support\ServiceProvider;

class PitchingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PitchRepositoryInterface::class, PitchRepository::class);
        $this->app->bind(PitchWriterSessionRepositoryInterface::class, PitchWriterSessionRepository::class);
    }
}
