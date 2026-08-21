<?php

namespace App\Services\Pitching;

final class PitchDraftService
{
    public const KEYS = ['problem', 'solution', 'market', 'business', 'team', 'cta'];

    public const LABELS = [
        'problem' => 'Проблема',
        'solution' => 'Решение',
        'market' => 'Рынок',
        'business' => 'Бизнес-модель',
        'team' => 'Команда',
        'cta' => 'Запрос',
    ];

    /**
     * @return array<string, string>
     */
    public function empty(): array
    {
        return array_fill_keys(self::KEYS, '');
    }

    /**
     * @param  array<string, mixed>  $blocks
     * @return array<string, string>
     */
    public function normalize(array $blocks): array
    {
        $normalized = $this->empty();

        foreach (self::KEYS as $key) {
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

        foreach (self::KEYS as $key) {
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

        foreach (self::KEYS as $key) {
            $content = trim($blocks[$key] ?? '');
            $label = self::LABELS[$key];
            $lines[] = $content === ''
                ? "{$label}: (пусто)"
                : "{$label}: {$content}";
        }

        return implode("\n", $lines);
    }
}
