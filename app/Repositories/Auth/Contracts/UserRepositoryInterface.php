<?php

namespace App\Repositories\Auth\Contracts;

use App\DTO\UserProfileDto;
use App\Models\User;

interface UserRepositoryInterface
{
    public function findOrCreateByEmail(string $email): User;

    /**
     * Сохраняет анкету и отмечает время согласий.
     */
    public function saveProfile(User $user, UserProfileDto $profile): User;
}
