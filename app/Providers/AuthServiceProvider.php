<?php

namespace App\Providers;

use App\Repositories\Auth\Contracts\UserRepositoryInterface;
use App\Repositories\Auth\UserRepository;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    }
}
