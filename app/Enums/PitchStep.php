<?php

namespace App\Enums;

enum PitchStep: string
{
    case Upload = 'загрузка';
    case Transcription = 'распознавание речи';
    case Segmentation = 'разметка по блокам';
    case Analysis = 'анализ ИИ';
    case Done = 'готово';
    case Error = 'ошибка';
}
