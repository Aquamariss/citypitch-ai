<?php

namespace App\Http\Controllers;

use App\Domains\Pitching\Enums\PitchStatus;
use App\Domains\Pitching\Services\PitchingService;
use App\Http\Requests\UploadPitchRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PitchController extends Controller
{
    public function __construct(
        private PitchingService $pitchingService
    ) {}

    public function index(Request $request)
    {
        return Inertia::render('Pitch/Index', [
            'default_duration' => config('pitching.default_duration_seconds', 180),
            'history_pitches' => $this->pitchingService->getCompletedHistory($request->user()),
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

        return redirect()->route('pitch.status', ['pitchId' => $pitchId]);
    }

    public function status(Request $request, string $pitchId)
    {
        $pitch = $this->pitchingService->getPitchForUser($pitchId, $request->user());

        if (! $pitch) {
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
            return redirect()->route('pitch.result', ['pitchId' => $pitchId]);
        }

        return Inertia::render('Pitch/Status', [
            'pitchId' => $pitchId,
            'initialStatus' => [
                'status' => $pitch->status->value,
                'step' => $pitch->step?->value,
                'message' => $pitch->error_message,
            ],
        ]);
    }

    public function result(Request $request, string $pitchId)
    {
        $pitch = $this->pitchingService->getPitchForUser($pitchId, $request->user());

        if (! $pitch || $pitch->status !== PitchStatus::Completed) {
            return redirect()->route('pitch.index')->withErrors(['video' => 'Питч не найден или удален']);
        }

        return Inertia::render('Pitch/Result', [
            'result' => $this->pitchingService->buildPitchResult($pitch),
            'media_type' => $pitch->media_type->value,
            'auth_email' => $request->user()->email,
        ]);
    }

    public function download(Request $request, string $pitchId)
    {
        $pitch = $this->pitchingService->getPitchForUser($pitchId, $request->user());

        if (! $pitch) {
            abort(404);
        }

        $path = $pitch->video_path;

        if (! $path || ! file_exists($path)) {
            abort(404);
        }

        $extension = pathinfo($path, PATHINFO_EXTENSION);

        return response()->download($path, "my-pitch.{$extension}");
    }

    public function subtitles(Request $request, string $pitchId)
    {
        $pitch = $this->pitchingService->getPitchForUser($pitchId, $request->user());

        if (! $pitch) {
            abort(404);
        }

        return response($this->pitchingService->buildWebVtt($pitch), 200, [
            'Content-Type' => 'text/vtt',
        ]);
    }
}
