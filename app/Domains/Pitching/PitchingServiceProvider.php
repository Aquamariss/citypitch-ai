<?php

namespace App\Domains\Pitching;

use App\Domains\Pitching\Repositories\EloquentPitchRepository;
use App\Domains\Pitching\Repositories\PitchRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class PitchingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PitchRepositoryInterface::class, EloquentPitchRepository::class);
    }
}
