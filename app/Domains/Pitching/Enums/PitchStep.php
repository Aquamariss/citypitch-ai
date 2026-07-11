<?php

namespace App\Domains\Pitching\Enums;

enum PitchStep: string
{
    case Upload = 'загрузка';
    case Transcription = 'распознавание речи';
    case Analysis = 'анализ ИИ';
    case Done = 'готово';
    case Error = 'ошибка';
}
