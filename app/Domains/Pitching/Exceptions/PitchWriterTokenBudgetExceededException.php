<?php

namespace App\Domains\Pitching\Exceptions;

use Exception;

class PitchWriterTokenBudgetExceededException extends Exception
{
    public function __construct()
    {
        parent::__construct('Превышен дневной лимит токенов Pitch Writer.');
    }
}
