<?php

namespace App\Domains\Auth;

use App\Domains\Auth\Repositories\EloquentUserRepository;
use App\Domains\Auth\Repositories\UserRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
    }
}
