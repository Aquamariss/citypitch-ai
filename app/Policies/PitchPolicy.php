<?php

namespace App\Policies;

use App\Models\Pitch;
use App\Models\User;

class PitchPolicy
{
    public function view(User $user, Pitch $pitch): bool
    {
        return $user->id === $pitch->user_id;
    }
}
