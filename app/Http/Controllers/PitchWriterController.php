<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportPitchWriterDraftRequest;
use App\Http\Requests\PitchWriterChatRequest;
use App\Http\Requests\UpdatePitchWriterDraftRequest;
use App\Services\Pitching\Exceptions\PitchWriterDailyLimitExceededException;
use App\Services\Pitching\Exceptions\PitchWriterStreamBusyException;
use App\Services\Pitching\Exceptions\PitchWriterTokenBudgetExceededException;
use App\Services\Pitching\PitchWriterQuotaService;
use App\Services\Pitching\PitchWriterService;
use App\Services\Pitching\PitchWriterSessionService;
use Generator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class PitchWriterController extends Controller
{
    public function __construct(
        private readonly PitchWriterService $pitchWriterService,
        private readonly PitchWriterSessionService $pitchWriterSessionService,
        private readonly PitchWriterQuotaService $pitchWriterQuotaService,
        private readonly LoggerInterface $logger,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $payload = $this->pitchWriterSessionService->payloadForUser($user);

        return Inertia::render('PitchWriter/Index', [
            ...$payload,
            'limits' => $this->pitchWriterQuotaService->limitsPayload($user->id),
        ]);
    }

    public function chat(PitchWriterChatRequest $request): StreamedResponse
    {
        $user = $request->user();
        $content = $request->validated('content');

        try {
            $this->pitchWriterQuotaService->assertDailyLimitNotExceeded($user->id);
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
                $this->logger->error('Pitch Writer stream failed', [
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
        $session = $this->pitchWriterSessionService->updateDraft(
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
        $session = $this->pitchWriterSessionService->importDraftIfEmpty(
            $request->user(),
            $request->validated('blocks'),
        );

        return response()->json([
            'session' => $session,
        ]);
    }

    public function undoDraft(Request $request): JsonResponse
    {
        $session = $this->pitchWriterSessionService->undoDraft($request->user());

        return response()->json([
            'session' => $session,
            'can_undo' => $this->pitchWriterSessionService->payloadForUser($request->user())['can_undo'],
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $clearDraft = (bool) $request->boolean('clear_draft');
        $payload = $this->pitchWriterSessionService->resetSession($request->user(), $clearDraft);

        return response()->json([
            ...$payload,
            'limits' => $this->pitchWriterQuotaService->limitsPayload($request->user()->id),
        ]);
    }
}
