<?php

namespace App\Http\Controllers;

use App\Domains\Pitching\Exceptions\PitchWriterDailyLimitExceededException;
use App\Domains\Pitching\Services\PitchWriterService;
use App\Http\Requests\PitchWriterChatRequest;
use Generator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class PitchWriterController extends Controller
{
    public function __construct(
        private readonly PitchWriterService $pitchWriterService
    ) {}

    public function index(): Response
    {
        return Inertia::render('PitchWriter/Index');
    }

    public function chat(PitchWriterChatRequest $request): StreamedResponse
    {
        $user = $request->user();
        $messages = $request->validated('messages');

        try {
            $this->pitchWriterService->assertDailyLimitNotExceeded($user->id);
        } catch (PitchWriterDailyLimitExceededException $exception) {
            abort(429, $exception->getMessage());
        }

        return response()->stream(function () use ($user, $messages): Generator {
            try {
                foreach ($this->pitchWriterService->streamChat($user->id, $messages) as $chunk) {
                    if (connection_aborted()) {
                        break;
                    }

                    yield $chunk;
                }
            } catch (Throwable $exception) {
                Log::error('Pitch Writer stream failed', [
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);

                throw $exception;
            }
        }, 200, [
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }
}
