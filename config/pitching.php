<?php

return [
    'max_duration_seconds' => env('PITCH_MAX_DURATION_SECONDS', 600), // 10 minutes
    'max_daily_attempts' => env('PITCH_MAX_DAILY_ATTEMPTS', 5),
    'default_duration_seconds' => env('PITCH_DEFAULT_DURATION_SECONDS', 180), // 3 minutes
];
