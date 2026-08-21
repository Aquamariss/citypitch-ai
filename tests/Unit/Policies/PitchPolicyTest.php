<?php

namespace Tests\Unit\Policies;

use App\Models\Pitch;
use App\Models\User;
use App\Policies\PitchPolicy;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PitchPolicyTest extends TestCase
{
    #[Test]
    public function view_allows_the_owner(): void
    {
        $user = new User(['email' => '__VG_EMAIL_249f0363e205__']);
        $user->id = 1;
        $pitch = new Pitch(['id' => 'pitch-id', 'user_id' => 1]);

        $this->assertTrue((new PitchPolicy)->view($user, $pitch));
    }

    #[Test]
    public function view_denies_another_user(): void
    {
        $user = new User(['email' => '__VG_EMAIL_249f0363e205__']);
        $user->id = 1;
        $pitch = new Pitch(['id' => 'pitch-id', 'user_id' => 2]);

        $this->assertFalse((new PitchPolicy)->view($user, $pitch));
    }
}
