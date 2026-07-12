<?php

namespace App\Domains\Pitching\Exceptions;

use Exception;

class PitchWriterDailyLimitExceededException extends Exception
{
    public function __construct()
    {
        parent::__construct('Превышен дневной лимит сообщений Pitch Writer.');
    }
}
