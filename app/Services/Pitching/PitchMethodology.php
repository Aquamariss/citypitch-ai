<?php

namespace App\Services\Pitching;

/**
 * Доступ к методике питчинга городских проектов (config/pitch_methodology.php).
 *
 * Читает конфиг и отдаёт его промптам, скорингу и фронтенду. Ничего не хранит
 * и не изменяет: единственный источник правды — конфиг.
 */
final class PitchMethodology
{
    public static function version(): string
    {
        return (string) config('pitch_methodology.version', 'city');
    }

    public static function recommendedSeconds(): int
    {
        return (int) config('pitch_methodology.recommended_seconds', 600);
    }

    public static function hardLimitSeconds(): int
    {
        return (int) config('pitch_methodology.hard_limit_seconds', 720);
    }

    public static function timingGraceSeconds(): int
    {
        return (int) config('pitch_methodology.timing_grace_seconds', 30);
    }

    public static function timingGraceScore(): int
    {
        return (int) config('pitch_methodology.timing_grace_score', 80);
    }

    public static function passThreshold(): int
    {
        return (int) config('pitch_methodology.pass_threshold', 60);
    }

    public static function speechRateWordsPerMinute(): int
    {
        return (int) config('pitch_methodology.speech_rate_words_per_minute', 140);
    }

    /**
     * @return list<array{key: string, title: string, limit: int, icon: string, color: string, hint: string, checklist: list<string>, example: string|null}>
     */
    public static function blocks(): array
    {
        return array_values(config('pitch_methodology.blocks', []));
    }

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_map(fn (array $block): string => $block['key'], self::blocks());
    }

    /**
     * @return array<string, string>
     */
    public static function labels(): array
    {
        $labels = [];

        foreach (self::blocks() as $block) {
            $labels[$block['key']] = $block['title'];
        }

        return $labels;
    }

    /**
     * @return array<string, int>
     */
    public static function limits(): array
    {
        $limits = [];

        foreach (self::blocks() as $block) {
            $limits[$block['key']] = (int) $block['limit'];
        }

        return $limits;
    }

    public static function label(string $key): string
    {
        return self::labels()[$key] ?? $key;
    }

    /**
     * @return array<string, array{title: string, weight: int, source: string, description: string}>
     */
    public static function criteria(): array
    {
        return config('pitch_methodology.criteria', []);
    }

    /**
     * Критерии, которые оценивает модель.
     *
     * @return array<string, array{title: string, weight: int, source: string, description: string}>
     */
    public static function aiCriteria(): array
    {
        return array_filter(self::criteria(), fn (array $criterion): bool => $criterion['source'] === 'ai');
    }

    /**
     * @return list<string>
     */
    public static function fillerWords(): array
    {
        return array_values(config('pitch_methodology.filler_words', []));
    }

    public static function fillerWordsNoticeThreshold(): int
    {
        return (int) config('pitch_methodology.filler_words_notice_threshold', 10);
    }

    /**
     * @return list<string>
     */
    public static function promptRules(): array
    {
        return array_values(config('pitch_methodology.prompt_rules', []));
    }

    /**
     * Правила для ИИ в виде маркированного списка.
     */
    public static function promptRulesText(): string
    {
        return implode("\n", array_map(fn (string $rule): string => "- {$rule}", self::promptRules()));
    }

    /**
     * Структура питча для промптов: номер, название, ключ, рекомендуемое время
     * и чек-лист вопросов, на которые отвечает блок.
     */
    public static function structureOutline(): string
    {
        $lines = [];

        foreach (self::blocks() as $index => $block) {
            $number = $index + 1;
            $limit = self::formatDuration((int) $block['limit']);
            $lines[] = "{$number}. {$block['title']} (ключ: {$block['key']}, ориентир {$limit}) — {$block['hint']}";

            foreach ($block['checklist'] ?? [] as $item) {
                $lines[] = "   • {$item}";
            }

            if (! empty($block['example'])) {
                $lines[] = "   Пример: {$block['example']}";
            }
        }

        return implode("\n", $lines);
    }

    /**
     * Полное представление методики для фронтенда.
     *
     * @return array<string, mixed>
     */
    public static function toArray(): array
    {
        return [
            'version' => self::version(),
            'recommended_seconds' => self::recommendedSeconds(),
            'hard_limit_seconds' => self::hardLimitSeconds(),
            'pass_threshold' => self::passThreshold(),
            'speech_rate_words_per_minute' => self::speechRateWordsPerMinute(),
            'blocks' => self::blocks(),
            'criteria' => self::criteria(),
        ];
    }

    public static function formatDuration(int $seconds): string
    {
        $minutes = intdiv($seconds, 60);
        $rest = $seconds % 60;

        if ($minutes === 0) {
            return "{$rest} сек";
        }

        return $rest === 0 ? "{$minutes} мин" : "{$minutes} мин {$rest} сек";
    }
}
