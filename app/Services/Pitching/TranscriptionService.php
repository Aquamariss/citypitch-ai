<?php

namespace App\Services\Pitching;

use App\DTO\TranscriptionResultDto;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TranscriptionService
{
    /**
     * @param  string  $audioPath  Абсолютный путь к аудиозаписи питча
     */
    public function transcribe(string $audioPath): TranscriptionResultDto
    {
        $responseData = $this->requestTranscription($audioPath);

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

        if ($baseUri === '') {
            $baseUri = 'https://api.openai.com/v1';
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout(120)
                ->attach('file', fopen($audioPath, 'r'), 'pitch.'.AudioContainer::extension($audioPath))
                ->post("{$baseUri}/audio/transcriptions", [
                    'model' => config('pitching.transcription_model', 'whisper-1'),
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
