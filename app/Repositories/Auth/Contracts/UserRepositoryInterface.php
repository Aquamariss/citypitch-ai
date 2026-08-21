<?php

namespace App\Repositories\Auth\Contracts;

use App\Models\User;

interface UserRepositoryInterface
{
    public function findOrCreateByEmail(string $email): User;
}
