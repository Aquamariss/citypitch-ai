<?php

namespace App\Domains\Pitching\Services;

use App\Domains\Pitching\DTOs\TranscriptionResult;
use Illuminate\Support\Facades\Process;
use OpenAI\Laravel\Facades\OpenAI;

class TranscriptionService
{
    /**
     * @param  string  $videoPath  Absolute path to the WebM video
     */
    public function transcribe(string $videoPath): TranscriptionResult
    {
        $extension = pathinfo($videoPath, PATHINFO_EXTENSION);
        $isAudio = in_array(strtolower($extension), ['mp3', 'ogg', 'wav', 'm4a']);

        $audioPath = $videoPath;

        if (! $isAudio) {
            // 1. Extract audio to MP3 to ensure it is under 25MB for OpenAI Whisper
            $audioPath = $videoPath.'.mp3';

            // Use ffmpeg to extract audio. -vn removes video, -ac 1 makes it mono, -b:a 64k compresses it
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

        // 2. Send to Whisper
        $response = OpenAI::audio()->transcribe([
            'model' => 'whisper-1',
            'file' => fopen($audioPath, 'r'),
            'response_format' => 'verbose_json',
            'language' => 'ru',
        ]);

        // 3. Cleanup extracted audio
        if (! $isAudio) {
            @unlink($audioPath);
        }

        $responseData = $response->toArray();

        return new TranscriptionResult(
            text: $response->text,
            duration: $response->duration,
            language: $response->language ?? 'ru',
            segments: $responseData['segments'] ?? [],
        );
    }
}
