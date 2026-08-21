<?php

namespace App\Http\Controllers;

use App\Enums\PitchStatus;
use App\Http\Requests\UploadPitchRequest;
use App\Models\Pitch;
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
            'default_duration' => config('pitching.default_duration_seconds', 180),
            'history_pitches' => $this->pitchingService->getCompletedHistory($request->user()),
            'draft_session' => $draftPayload['session'],
        ]);
    }

    public function upload(UploadPitchRequest $request)
    {
        $user = $request->user();

        if (! $this->pitchingService->canUploadToday($user)) {
            return back()->withErrors(['video' => 'Превышен лимит попыток на сегодня.']);
        }

        $pitchId = $this->pitchingService->initiatePitchProcessing(
            $user,
            $request->file('video'),
            $request->validated('duration'),
            $request->validated('media_type'),
        );

        return redirect()->route('pitch.status', ['pitch' => $pitchId]);
    }

    public function status(Request $request, Pitch $pitch)
    {
        if (! $request->user()->can('view', $pitch)) {
            return redirect()->route('pitch.index')->withErrors(['video' => 'Питч не найден или удален']);
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
            return redirect()->route('pitch.index')->withErrors(['video' => 'Питч не найден или удален']);
        }

        if ($pitch->status !== PitchStatus::Completed) {
            return redirect()->route('pitch.index')->withErrors(['video' => 'Питч не найден или удален']);
        }

        return Inertia::render('Pitch/Result', [
            'result' => $this->pitchingService->buildPitchResult($pitch),
            'media_type' => $pitch->media_type->value,
            'auth_email' => $request->user()->email,
        ]);
    }

    public function download(Request $request, Pitch $pitch)
    {
        if (! $request->user()->can('view', $pitch)) {
            abort(404);
        }

        $path = $pitch->video_path;

        if (! $path || ! file_exists($path)) {
            abort(404);
        }

        $extension = pathinfo($path, PATHINFO_EXTENSION);

        return response()->download($path, "my-pitch.{$extension}");
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

        $path = $pitch->video_path;

        if (! $path || ! file_exists($path)) {
            abort(404);
        }

        $mime = match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'ogg' => 'audio/ogg',
            'mp3' => 'audio/mpeg',
            'wav' => 'audio/wav',
            'm4a' => 'audio/mp4',
            default => 'video/mp4',
        };

        return response()->file($path, [
            'Content-Type' => $mime,
            'Accept-Ranges' => 'bytes',
        ]);
    }
}
