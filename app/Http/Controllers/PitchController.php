<?php

namespace App\Http\Controllers;

use App\Enums\PitchStatus;
use App\Http\Requests\UploadPitchRequest;
use App\Models\Pitch;
use App\Services\Pitching\AudioContainer;
use App\Services\Pitching\PitchingService;
use App\Services\Pitching\PitchWriterSessionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PitchController extends Controller
{
    public function __construct(
        private PitchingService $pitchingService,
        private PitchWriterSessionService $pitchWriterSessionService,
    ) {}

    public function index(Request $request)
    {
        $draftPayload = $this->pitchWriterSessionService->payloadForUser($request->user());

        return Inertia::render('Pitch/Index', [
            'history_pitches' => $this->pitchingService->getCompletedHistory($request->user()),
            'draft_session' => $draftPayload['session'],
        ]);
    }

    public function upload(UploadPitchRequest $request)
    {
        $user = $request->user();

        if (! $this->pitchingService->canUploadToday($user)) {
            return back()->withErrors(['audio' => 'Превышен лимит попыток на сегодня.']);
        }

        $pitchId = $this->pitchingService->initiatePitchProcessing(
            $user,
            $request->file('audio'),
            $request->validated('duration'),
        );

        return redirect()->route('pitch.status', ['pitch' => $pitchId]);
    }

    public function status(Request $request, Pitch $pitch)
    {
        if (! $request->user()->can('view', $pitch)) {
            return redirect()->route('pitch.index')->withErrors(['audio' => 'Питч не найден или удален']);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'status' => $pitch->status->value,
                'step' => $pitch->step?->value,
                'message' => $pitch->error_message,
            ]);
        }

        if ($pitch->status === PitchStatus::Completed) {
            return redirect()->route('pitch.result', ['pitch' => $pitch->id]);
        }

        return Inertia::render('Pitch/Status', [
            'pitchId' => $pitch->id,
            'initialStatus' => [
                'status' => $pitch->status->value,
                'step' => $pitch->step?->value,
                'message' => $pitch->error_message,
            ],
        ]);
    }

    public function result(Request $request, Pitch $pitch)
    {
        if (! $request->user()->can('view', $pitch)) {
            return redirect()->route('pitch.index')->withErrors(['audio' => 'Питч не найден или удален']);
        }

        if ($pitch->status !== PitchStatus::Completed) {
            return redirect()->route('pitch.index')->withErrors(['audio' => 'Питч не найден или удален']);
        }

        return Inertia::render('Pitch/Result', [
            'result' => $this->pitchingService->buildPitchResult($pitch),
            'auth_email' => $request->user()->email,
        ]);
    }

    public function download(Request $request, Pitch $pitch)
    {
        if (! $request->user()->can('view', $pitch)) {
            abort(404);
        }

        $path = $pitch->audio_path;

        if (! $path || ! file_exists($path)) {
            abort(404);
        }

        return response()->download($path, 'citypitch.'.AudioContainer::extension($path));
    }

    public function subtitles(Request $request, Pitch $pitch)
    {
        if (! $request->user()->can('view', $pitch)) {
            abort(404);
        }

        return response($this->pitchingService->buildWebVtt($pitch), 200, [
            'Content-Type' => 'text/vtt',
        ]);
    }

    public function media(Request $request, Pitch $pitch)
    {
        if (! $request->user()->can('view', $pitch)) {
            abort(404);
        }

        $path = $pitch->audio_path;

        if (! $path || ! file_exists($path)) {
            abort(404);
        }

        return response()->file($path, [
            'Content-Type' => AudioContainer::mimeType($path),
            'Accept-Ranges' => 'bytes',
        ]);
    }
}
