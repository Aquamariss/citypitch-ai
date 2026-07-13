<?php

namespace App\Http\Controllers;

use App\Domains\Pitching\Exceptions\PitchWriterDailyLimitExceededException;
use App\Domains\Pitching\Exceptions\PitchWriterStreamBusyException;
use App\Domains\Pitching\Exceptions\PitchWriterTokenBudgetExceededException;
use App\Domains\Pitching\Services\PitchWriterService;
use App\Domains\Pitching\Services\PitchWriterSessionService;
use App\Http\Requests\ImportPitchWriterDraftRequest;
use App\Http\Requests\PitchWriterChatRequest;
use App\Http\Requests\UpdatePitchWriterDraftRequest;
use Generator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class PitchWriterController extends Controller
{
    public function __construct(
        private readonly PitchWriterService $pitchWriterService,
        private readonly PitchWriterSessionService $sessionService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $payload = $this->sessionService->payloadForUser($user);

        return Inertia::render('PitchWriter/Index', [
            ...$payload,
            'limits' => $this->pitchWriterService->limitsPayload($user->id),
        ]);
    }

    public function chat(PitchWriterChatRequest $request): StreamedResponse
    {
        $user = $request->user();
        $content = $request->validated('content');

        try {
            $this->pitchWriterService->assertDailyLimitNotExceeded($user->id);
        } catch (PitchWriterDailyLimitExceededException $exception) {
            abort(429, $exception->getMessage());
        }

        return response()->stream(function () use ($user, $content): Generator {
            try {
                foreach ($this->pitchWriterService->streamTurn($user, $content) as $chunk) {
                    if (connection_aborted()) {
                        break;
                    }

                    yield $chunk;
                }
            } catch (PitchWriterStreamBusyException|PitchWriterDailyLimitExceededException|PitchWriterTokenBudgetExceededException $exception) {
                yield 'event: error'."\n".'data: '.json_encode([
                    'message' => $exception->getMessage(),
                ], JSON_UNESCAPED_UNICODE)."\n\n";
            } catch (Throwable $exception) {
                Log::error('Pitch Writer stream failed', [
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);

                yield 'event: error'."\n".'data: '.json_encode([
                    'message' => 'Не удалось получить ответ. Попробуйте позже.',
                ], JSON_UNESCAPED_UNICODE)."\n\n";
            }
        }, 200, [
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Content-Type' => 'text/event-stream; charset=utf-8',
        ]);
    }

    public function updateDraft(UpdatePitchWriterDraftRequest $request): JsonResponse
    {
        $session = $this->sessionService->updateDraft(
            $request->user(),
            $request->validated('blocks'),
            $request->validated('updated_at'),
        );

        return response()->json([
            'session' => $session,
            'can_undo' => true,
        ]);
    }

    public function importDraft(ImportPitchWriterDraftRequest $request): JsonResponse
    {
        $session = $this->sessionService->importDraftIfEmpty(
            $request->user(),
            $request->validated('blocks'),
        );

        return response()->json([
            'session' => $session,
        ]);
    }

    public function undoDraft(Request $request): JsonResponse
    {
        $session = $this->sessionService->undoDraft($request->user());

        return response()->json([
            'session' => $session,
            'can_undo' => $this->sessionService->payloadForUser($request->user())['can_undo'],
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $clearDraft = (bool) $request->boolean('clear_draft');
        $payload = $this->sessionService->resetSession($request->user(), $clearDraft);

        return response()->json([
            ...$payload,
            'limits' => $this->pitchWriterService->limitsPayload($request->user()->id),
        ]);
    }
}
