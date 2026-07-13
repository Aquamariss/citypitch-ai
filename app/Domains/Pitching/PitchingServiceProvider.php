<?php

namespace App\Domains\Pitching;

use App\Domains\Pitching\Repositories\EloquentPitchRepository;
use App\Domains\Pitching\Repositories\EloquentPitchWriterSessionRepository;
use App\Domains\Pitching\Repositories\PitchRepositoryInterface;
use App\Domains\Pitching\Repositories\PitchWriterSessionRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class PitchingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PitchRepositoryInterface::class, EloquentPitchRepository::class);
        $this->app->bind(PitchWriterSessionRepositoryInterface::class, EloquentPitchWriterSessionRepository::class);
    }
}
