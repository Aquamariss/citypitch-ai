<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'email',
    'email_verified_at',
    'full_name',
    'phone',
    'city',
    'personal_data_consent_at',
    'marketing_consent_at',
])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'personal_data_consent_at' => 'datetime',
            'marketing_consent_at' => 'datetime',
        ];
    }

    /**
     * Анкета заполнена и согласие на обработку персональных данных дано —
     * без этого пользоваться тренажёром нельзя.
     */
    public function hasCompletedProfile(): bool
    {
        return $this->personal_data_consent_at !== null && filled($this->phone);
    }

    /**
     * Паролей нет: вход по анкете и коду из письма. Cookie «запомнить
     * пользователя» хеширует пароль, поэтому вместо null — пустая строка.
     */
    public function getAuthPassword(): string
    {
        return '';
    }

    public function pitches(): HasMany
    {
        return $this->hasMany(Pitch::class);
    }
}
