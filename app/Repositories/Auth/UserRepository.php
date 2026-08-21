<?php

namespace App\Repositories\Auth;

use App\Models\User;
use App\Repositories\Auth\Contracts\UserRepositoryInterface;

class UserRepository implements UserRepositoryInterface
{
    public function findOrCreateByEmail(string $email): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['email_verified_at' => now()],
        );

        if ($user->email_verified_at === null) {
            $user->update(['email_verified_at' => now()]);
        }

        return $user->refresh();
    }
}
