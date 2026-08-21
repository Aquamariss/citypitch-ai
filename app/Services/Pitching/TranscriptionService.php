<?php

namespace App\Services\Pitching;

use App\DTO\TranscriptionResultDto;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class TranscriptionService
{
    /**
     * @param  string  $videoPath  Absolute path to the WebM video
     */
    public function transcribe(string $videoPath): TranscriptionResultDto
    {
        $extension = pathinfo($videoPath, PATHINFO_EXTENSION);
        $isAudio = in_array(strtolower($extension), ['mp3', 'ogg', 'wav', 'm4a']);

        $audioPath = $videoPath;

        if (! $isAudio) {
            // 1. Extract audio to MP3 to ensure it is under 25MB for Whisper
            $audioPath = $videoPath.'.mp3';

            $result = Process::run([
                'ffmpeg',
                '-i', $videoPath,
                '-vn',
                '-ac', '1',
                '-b:a', '64k',
                $audioPath,
            ]);

            if ($result->failed()) {
                throw new \RuntimeException('Failed to extract audio: '.$result->errorOutput());
            }
        }

        try {
            $responseData = $this->requestTranscription($audioPath);
        } finally {
            if (! $isAudio) {
                @unlink($audioPath);
            }
        }

        return new TranscriptionResultDto(
            text: $responseData['text'] ?? '',
            duration: (float) ($responseData['duration'] ?? 0),
            language: $responseData['language'] ?? 'ru',
            segments: $responseData['segments'] ?? [],
        );
    }

    /**
     * Raw HTTP call — the typed SDK response crashes when the transcription
     * backend omits `words` entries (word is null), which we don't use anyway.
     *
     * @return array<string, mixed>
     */
    private function requestTranscription(string $audioPath): array
    {
        $baseUri = rtrim((string) config('openai.base_uri'), '/');
        $apiKey = (string) config('openai.api_key');

        try {
            $response = Http::withToken($apiKey)
                ->timeout(120)
                ->attach('file', fopen($audioPath, 'r'), basename($audioPath))
                ->post("{$baseUri}/audio/transcriptions", [
                    'model' => 'gigaam-v3',
                    'response_format' => 'verbose_json',
                    'language' => 'ru',
                ]);
        } catch (ConnectionException $e) {
            Log::error('Transcription connection failed', ['error' => $e->getMessage()]);

            throw new \RuntimeException('Transcription service unreachable', previous: $e);
        }

        if ($response->failed()) {
            Log::error('Transcription request failed', [
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 500),
            ]);

            throw new \RuntimeException('Transcription request failed with status '.$response->status());
        }

        return $response->json() ?? [];
    }
}
