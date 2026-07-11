<?php

use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\PitchController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [OtpController::class, 'showLogin'])->name('login');
Route::post('/auth/send-code', [OtpController::class, 'sendCode'])->name('auth.send-code')->middleware('throttle:5,1');
Route::post('/auth/verify-code', [OtpController::class, 'verifyCode'])->name('auth.verify-code')->middleware('throttle:5,1');
Route::post('/auth/logout', [OtpController::class, 'logout'])->name('auth.logout')->middleware('auth');

Route::middleware(['auth'])->group(function () {
    Route::get('/', function () {
        return redirect()->route('pitch.index');
    });

    Route::get('/pitch', [PitchController::class, 'index'])->name('pitch.index');
    Route::post('/pitch/upload', [PitchController::class, 'upload'])->name('pitch.upload');
    Route::get('/pitch/{pitchId}/status', [PitchController::class, 'status'])->name('pitch.status');
    Route::get('/pitch/{pitchId}/result', [PitchController::class, 'result'])->name('pitch.result');
    Route::get('/pitch/{pitchId}/download', [PitchController::class, 'download'])->name('pitch.download');
    Route::get('/pitch/{pitchId}/subtitles.vtt', [PitchController::class, 'subtitles'])->name('pitch.subtitles');
});
