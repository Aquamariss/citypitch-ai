<?php

use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\PitchController;
use App\Http\Controllers\PitchWriterController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [OtpController::class, 'showLogin'])->name('login');
Route::post('/auth/send-code', [OtpController::class, 'sendCode'])->name('auth.send-code')->middleware('throttle:5,1');
Route::post('/auth/verify-code', [OtpController::class, 'verifyCode'])->name('auth.verify-code')->middleware('throttle:5,1');
Route::post('/auth/logout', [OtpController::class, 'logout'])->name('auth.logout')->middleware('auth');

Route::middleware(['auth'])->group(function () {
    Route::get('/', function () {
        return redirect()->route('pitch.index');
    });

    Route::get('/pitch-writer', [PitchWriterController::class, 'index'])->name('pitch-writer.index');
    Route::post('/pitch-writer/chat', [PitchWriterController::class, 'chat'])
        ->middleware('throttle:10,1')
        ->name('pitch-writer.chat');
    Route::patch('/pitch-writer/draft', [PitchWriterController::class, 'updateDraft'])
        ->name('pitch-writer.draft.update');
    Route::post('/pitch-writer/draft/import', [PitchWriterController::class, 'importDraft'])
        ->name('pitch-writer.draft.import');
    Route::post('/pitch-writer/draft/undo', [PitchWriterController::class, 'undoDraft'])
        ->name('pitch-writer.draft.undo');
    Route::post('/pitch-writer/session/reset', [PitchWriterController::class, 'reset'])
        ->name('pitch-writer.session.reset');

    Route::get('/pitch', [PitchController::class, 'index'])->name('pitch.index');
    Route::post('/pitch/upload', [PitchController::class, 'upload'])->name('pitch.upload');
    Route::get('/pitch/{pitchId}/status', [PitchController::class, 'status'])->name('pitch.status');
    Route::get('/pitch/{pitchId}/result', [PitchController::class, 'result'])->name('pitch.result');
    Route::get('/pitch/{pitchId}/download', [PitchController::class, 'download'])->name('pitch.download');
    Route::get('/pitch/{pitchId}/subtitles.vtt', [PitchController::class, 'subtitles'])->name('pitch.subtitles');
});
