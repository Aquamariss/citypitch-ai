<?php

return [
    'max_duration_seconds' => env('PITCH_MAX_DURATION_SECONDS', 600), // 10 minutes
    'max_daily_attempts' => env('PITCH_MAX_DAILY_ATTEMPTS', 5),
    'default_duration_seconds' => env('PITCH_DEFAULT_DURATION_SECONDS', 180), // 3 minutes

    'writer_model' => env('PITCH_WRITER_MODEL', 'gpt-5.4-mini'),
    'writer_max_messages' => env('PITCH_WRITER_MAX_MESSAGES', 20),
    'writer_max_message_length' => env('PITCH_WRITER_MAX_MESSAGE_LENGTH', 4000),
    'writer_daily_messages' => env('PITCH_WRITER_DAILY_MESSAGES', 50),
    'writer_request_timeout' => env('OPENAI_WRITER_TIMEOUT', 120),
];
