<?php

namespace App\Services\Pitching;

final class PitchDraftService
{
    /**
     * Ключи блоков черновика. Совпадают с блоками методики.
     *
     * @return list<string>
     */
    public static function keys(): array
    {
        return PitchMethodology::keys();
    }

    /**
     * @return array<string, string>
     */
    public static function labels(): array
    {
        return PitchMethodology::labels();
    }

    public static function label(string $key): string
    {
        return PitchMethodology::label($key);
    }

    /**
     * @return array<string, string>
     */
    public function empty(): array
    {
        return array_fill_keys(self::keys(), '');
    }

    /**
     * @param  array<string, mixed>  $blocks
     * @return array<string, string>
     */
    public function normalize(array $blocks): array
    {
        $normalized = $this->empty();

        foreach (self::keys() as $key) {
            $normalized[$key] = isset($blocks[$key]) ? (string) $blocks[$key] : '';
        }

        return $normalized;
    }

    /**
     * @param  array<string, string>  $blocks
     * @param  array<string, mixed>  $patch
     * @return array{blocks: array<string, string>, changed: list<string>}
     */
    public function applyPatch(array $blocks, array $patch): array
    {
        $next = $this->normalize($blocks);
        $changed = [];
        $maxLength = (int) config('pitching.writer_max_block_length', 1500);

        foreach (self::keys() as $key) {
            if (! array_key_exists($key, $patch)) {
                continue;
            }

            $value = mb_substr((string) $patch[$key], 0, $maxLength);
            $next[$key] = $value;
            $changed[] = $key;
        }

        return [
            'blocks' => $next,
            'changed' => $changed,
        ];
    }

    /**
     * @param  array<string, string>  $blocks
     */
    public function hasContent(array $blocks): bool
    {
        foreach ($blocks as $value) {
            if (trim((string) $value) !== '') {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, string>  $blocks
     */
    public function toPromptSnapshot(array $blocks): string
    {
        $lines = [];
        $labels = self::labels();

        foreach (self::keys() as $key) {
            $content = trim($blocks[$key] ?? '');
            $label = $labels[$key];
            $lines[] = $content === ''
                ? "{$label}: (пусто)"
                : "{$label}: {$content}";
        }

        return implode("\n", $lines);
    }
}
