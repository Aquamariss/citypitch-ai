<?php

namespace App\Domains\Pitching\Enums;

enum PitchStatus: string
{
    case Processing = 'processing';
    case Completed = 'completed';
    case Error = 'error';
}
