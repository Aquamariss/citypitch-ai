<?php

namespace App\Services\Pitching\Exceptions;

use Exception;

class PitchWriterStreamBusyException extends Exception
{
    public function __construct()
    {
        parent::__construct('Уже выполняется генерация ответа. Дождитесь завершения.');
    }
}
