<?php

namespace App\Domains\Auth\Repositories;

use App\Models\User;

interface UserRepositoryInterface
{
    public function findOrCreateByEmail(string $email): User;
}
