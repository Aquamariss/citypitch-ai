<?php

namespace App\Repositories\Auth;

use App\DTO\UserProfileDto;
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

    /**
     * Пустые необязательные поля не затирают сохранённые ранее значения.
     * Согласие на рекламу отражает последнее решение пользователя: снятая
     * галка отзывает его.
     */
    public function saveProfile(User $user, UserProfileDto $profile): User
    {
        $user->update([
            'full_name' => $profile->fullName ?? $user->full_name,
            'phone' => $profile->phone,
            'city' => $profile->city ?? $user->city,
            'personal_data_consent_at' => now(),
            'marketing_consent_at' => $profile->marketingConsent ? now() : null,
        ]);

        return $user->refresh();
    }
}
