<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+7900'.fake()->numerify('#######'),
            'city' => fake()->city(),
            'messenger' => '@'.fake()->userName(),
            'email_verified_at' => now(),
            'personal_data_consent_at' => now(),
            'marketing_consent_at' => null,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn () => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Пользователь из времён до анкеты: без телефона и согласия.
     */
    public function withoutConsent(): static
    {
        return $this->state(fn () => [
            'phone' => null,
            'personal_data_consent_at' => null,
        ]);
    }
}
