<?php

namespace App\Services\Pitching;

/**
 * Определение аудиоконтейнера по содержимому файла.
 *
 * Запись из браузера сохраняется с расширением .ogg, но внутри обычно
 * webm/opus, поэтому и MIME-тип для отдачи, и имя файла для сервиса
 * распознавания берём по «магическим» байтам, а не по расширению.
 */
final class AudioContainer
{
    /**
     * @var array<string, array{extension: string, mime: string}>
     */
    private const SIGNATURES = [
        "\x1A\x45\xDF\xA3" => ['extension' => 'webm', 'mime' => 'audio/webm'],
        'OggS' => ['extension' => 'ogg', 'mime' => 'audio/ogg'],
        'RIFF' => ['extension' => 'wav', 'mime' => 'audio/wav'],
        'fLaC' => ['extension' => 'flac', 'mime' => 'audio/flac'],
        'ID3' => ['extension' => 'mp3', 'mime' => 'audio/mpeg'],
    ];

    private const FALLBACK = ['extension' => 'ogg', 'mime' => 'audio/ogg'];

    public static function extension(string $path): string
    {
        return self::detect($path)['extension'];
    }

    public static function mimeType(string $path): string
    {
        return self::detect($path)['mime'];
    }

    /**
     * @return array{extension: string, mime: string}
     */
    private static function detect(string $path): array
    {
        $handle = @fopen($path, 'r');

        if ($handle === false) {
            return self::FALLBACK;
        }

        $header = (string) fread($handle, 12);
        fclose($handle);

        foreach (self::SIGNATURES as $signature => $format) {
            if (str_starts_with($header, $signature)) {
                return $format;
            }
        }

        // ISO Base Media (m4a/mp4): сигнатура ftyp начинается с пятого байта.
        if (str_starts_with(substr($header, 4), 'ftyp')) {
            return ['extension' => 'm4a', 'mime' => 'audio/mp4'];
        }

        return self::FALLBACK;
    }
}
