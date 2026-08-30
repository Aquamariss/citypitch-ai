<?php

return [
    // Технический предел записи: методика рекомендует 10 минут, запас — 2 минуты.
    'max_duration_seconds' => env('PITCH_MAX_DURATION_SECONDS', 720),
    'max_daily_attempts' => env('PITCH_MAX_DAILY_ATTEMPTS', 5),
    'default_duration_seconds' => env('PITCH_DEFAULT_DURATION_SECONDS', 600),

    'transcription_model' => env('PITCH_TRANSCRIPTION_MODEL', 'whisper-1'),

    'analysis_model' => env('PITCH_ANALYSIS_MODEL', 'gpt-4.1-mini'),
    'analysis_request_timeout' => env('OPENAI_ANALYSIS_TIMEOUT', 180),
    'analysis_max_completion_tokens' => env('PITCH_ANALYSIS_MAX_COMPLETION_TOKENS', 4000),

    'writer_model' => env('PITCH_WRITER_MODEL', 'gpt-4.1-mini'),
    'writer_max_messages' => env('PITCH_WRITER_MAX_MESSAGES', 20),
    'writer_max_message_length' => env('PITCH_WRITER_MAX_MESSAGE_LENGTH', 4000),
    'writer_daily_messages' => env('PITCH_WRITER_DAILY_MESSAGES', 50),
    'writer_request_timeout' => env('OPENAI_WRITER_TIMEOUT', 120),

    'writer_context_messages' => env('PITCH_WRITER_CONTEXT_MESSAGES', 16),
    'writer_max_completion_tokens' => env('PITCH_WRITER_MAX_COMPLETION_TOKENS', 1000),
    'writer_daily_token_budget' => env('PITCH_WRITER_DAILY_TOKEN_BUDGET', 100000),
    'writer_max_block_length' => env('PITCH_WRITER_MAX_BLOCK_LENGTH', 1500),
    'writer_max_tool_rounds' => env('PITCH_WRITER_MAX_TOOL_ROUNDS', 1),
    'writer_max_revisions' => env('PITCH_WRITER_MAX_REVISIONS', 20),
];
