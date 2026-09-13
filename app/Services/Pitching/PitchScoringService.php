<?php

namespace App\Services\Pitching;

use App\DTO\PitchAnalysisResultDto;
use App\DTO\PitchEvaluationDto;
use App\DTO\PitchSegmentationResultDto;
use App\DTO\TranscriptionResultDto;

/**
 * Детерминированная часть оценки: тайминг, структура, слова-паразиты
 * и сборка итогового балла по весам методики.
 *
 * Модель сюда не вызывается — всё считается кодом, поэтому результат
 * воспроизводим и покрыт тестами.
 */
class PitchScoringService
{
    /**
     * Вес статуса блока в оценке структуры.
     */
    private const STATUS_WEIGHTS = [
        'covered' => 1.0,
        'partial' => 0.5,
        'missing' => 0.0,
    ];

    /**
     * Собирает текст каждого блока по границам разметки — вход для второго
     * этапа анализа.
     *
     * @param  list<array{start: float, end: float, text: string}>  $segments
     * @return list<array{key: string, title: string, status: string, text: string}>
     */
    public function buildBlockTexts(PitchSegmentationResultDto $segmentation, array $segments, string $fallbackText = ''): array
    {
        $labels = PitchMethodology::labels();
        $blocks = [];
        $hasBounds = false;

        foreach ($segmentation->blocks as $block) {
            $text = $this->sliceSegments($segments, $block['startSegment'], $block['endSegment']);

            if ($text !== '') {
                $hasBounds = true;
            }

            $blocks[] = [
                'key' => $block['key'],
                'title' => $labels[$block['key']] ?? $block['key'],
                'status' => $block['status'],
                'text' => $text,
            ];
        }

        // Без таймкодов границы не определить — отдаём модели расшифровку целиком.
        if (! $hasBounds && trim($fallbackText) !== '') {
            foreach ($blocks as $index => $block) {
                $blocks[$index]['text'] = $index === 0 ? trim($fallbackText) : '';
            }
        }

        return $blocks;
    }

    public function evaluate(
        PitchSegmentationResultDto $segmentation,
        PitchAnalysisResultDto $analysis,
        TranscriptionResultDto $transcription,
    ): PitchEvaluationDto {
        $actualSeconds = (int) round($transcription->duration);
        $wasCutOff = $this->wasCutOff($actualSeconds);
        $speech = $this->analyzeSpeech($transcription->text);
        $blocks = $this->buildBlocks($segmentation, $transcription->segments);

        $structureScore = $this->structureScore($segmentation);
        $timingScore = $this->timingScore($actualSeconds);
        $criteria = $this->buildCriteria(
            $analysis,
            $structureScore,
            $timingScore,
            $this->timingFeedback($actualSeconds, $wasCutOff, $blocks),
            $speech,
        );

        $score = (int) round(array_sum(array_column($criteria, 'score')));

        return new PitchEvaluationDto(
            name: $this->resolveName($analysis->name),
            score: $score,
            isPassed: $score >= PitchMethodology::passThreshold(),
            summary: $analysis->summary,
            overallFeedback: $analysis->overallFeedback,
            criteria: $criteria,
            blocks: $blocks,
            speech: $speech,
            duration: [
                'actualSeconds' => $actualSeconds,
                'recommendedSeconds' => PitchMethodology::recommendedSeconds(),
                'hardLimitSeconds' => PitchMethodology::hardLimitSeconds(),
                'wasCutOff' => $wasCutOff,
            ],
            methodologyVersion: PitchMethodology::version(),
        );
    }

    /**
     * Балл за тайминг 0–100. Штрафуется только превышение рекомендуемого
     * времени: уложиться раньше — не ошибка.
     */
    public function timingScore(int $actualSeconds): float
    {
        $recommended = PitchMethodology::recommendedSeconds();

        if ($actualSeconds <= $recommended) {
            return 100.0;
        }

        $grace = PitchMethodology::timingGraceSeconds();
        $graceScore = (float) PitchMethodology::timingGraceScore();
        $overrun = $actualSeconds - $recommended;

        if ($overrun <= $grace) {
            return 100.0 - (100.0 - $graceScore) * ($overrun / max(1, $grace));
        }

        $hardOverrun = max(1, PitchMethodology::hardLimitSeconds() - $recommended - $grace);
        $decay = ($overrun - $grace) / $hardOverrun;

        return max(0.0, $graceScore * (1 - $decay));
    }

    /**
     * Балл за структуру 0–100: доля содержательно закрытых блоков.
     */
    public function structureScore(PitchSegmentationResultDto $segmentation): float
    {
        $keys = PitchMethodology::keys();

        if ($keys === []) {
            return 0.0;
        }

        $sum = 0.0;

        foreach ($keys as $key) {
            $status = $segmentation->block($key)['status'] ?? 'missing';
            $sum += self::STATUS_WEIGHTS[$status] ?? 0.0;
        }

        return ($sum / count($keys)) * 100;
    }

    /**
     * Слова-паразиты и объём речи по расшифровке.
     *
     * @return array{fillerCount: int, fillerTop: list<array{word: string, count: int}>, wordCount: int}
     */
    public function analyzeSpeech(string $text): array
    {
        $words = $this->tokenize($text);
        $counts = [];

        foreach (PitchMethodology::fillerWords() as $filler) {
            $parts = $this->tokenize($filler);

            if ($parts === []) {
                continue;
            }

            $occurrences = $this->countSequence($words, $parts);

            if ($occurrences > 0) {
                $counts[$filler] = $occurrences;
            }
        }

        arsort($counts);
        $top = [];

        foreach (array_slice($counts, 0, 3, true) as $word => $count) {
            $top[] = ['word' => $word, 'count' => $count];
        }

        return [
            'fillerCount' => array_sum($counts),
            'fillerTop' => $top,
            'wordCount' => count($words),
        ];
    }

    /**
     * @param  list<array{start: float, end: float, text: string}>  $segments
     * @return list<array{key: string, title: string, status: string, actualSeconds: int|null, limitSeconds: int, feedback: string}>
     */
    private function buildBlocks(PitchSegmentationResultDto $segmentation, array $segments): array
    {
        $labels = PitchMethodology::labels();
        $limits = PitchMethodology::limits();
        $blocks = [];

        foreach ($segmentation->blocks as $block) {
            $blocks[] = [
                'key' => $block['key'],
                'title' => $labels[$block['key']] ?? $block['key'],
                'status' => $block['status'],
                'actualSeconds' => $this->blockDuration($segments, $block['startSegment'], $block['endSegment']),
                'limitSeconds' => $limits[$block['key']] ?? 0,
                'feedback' => $block['feedback'],
            ];
        }

        return $blocks;
    }

    /**
     * @param  array{fillerCount: int, fillerTop: list<array{word: string, count: int}>, wordCount: int}  $speech
     * @return list<array{key: string, name: string, score: float, maxScore: float, feedback: string}>
     */
    private function buildCriteria(
        PitchAnalysisResultDto $analysis,
        float $structureScore,
        float $timingScore,
        string $timingFeedback,
        array $speech,
    ): array {
        $criteria = [];

        foreach (PitchMethodology::criteria() as $key => $criterion) {
            $weight = (float) $criterion['weight'];

            [$percent, $feedback] = match ($key) {
                'structure' => [$structureScore, $analysis->structureFeedback],
                'timing' => [$timingScore, $timingFeedback],
                default => [
                    ($analysis->criteria[$key]['score'] ?? 0) * 10,
                    $analysis->criteria[$key]['feedback'] ?? '',
                ],
            };

            if ($key === 'delivery') {
                $feedback = $this->appendFillerNote($feedback, $speech);
            }

            $criteria[] = [
                'key' => $key,
                'name' => $criterion['title'],
                'score' => round($weight * $percent / 100, 1),
                'maxScore' => $weight,
                'feedback' => $feedback,
            ];
        }

        return $criteria;
    }

    /**
     * Обратная связь по таймингу: общее время плюс мягкое замечание
     * о распределении по блокам. На балл распределение не влияет.
     *
     * @param  list<array{key: string, title: string, status: string, actualSeconds: int|null, limitSeconds: int, feedback: string}>  $blocks
     */
    private function timingFeedback(int $actualSeconds, bool $wasCutOff, array $blocks): string
    {
        $recommended = PitchMethodology::recommendedSeconds();
        $sentences = [];

        if ($wasCutOff) {
            $sentences[] = sprintf(
                'Запись остановилась на технической отметке %s — питч не был завершён.',
                $this->formatClock(PitchMethodology::hardLimitSeconds()),
            );
        } elseif ($actualSeconds <= $recommended) {
            $sentences[] = sprintf(
                'Вы уложились в рекомендуемое время: питч занял %s из %s.',
                $this->formatClock($actualSeconds),
                $this->formatClock($recommended),
            );
        } else {
            $sentences[] = sprintf(
                'Питч занял %s — на %s дольше рекомендуемых %s.',
                $this->formatClock($actualSeconds),
                $this->formatClock($actualSeconds - $recommended),
                $this->formatClock($recommended),
            );
        }

        $missing = [];
        $long = [];

        foreach ($blocks as $block) {
            if ($block['status'] === 'missing') {
                $missing[] = $block['title'];

                continue;
            }

            $actual = $block['actualSeconds'];

            if ($actual !== null && $block['limitSeconds'] > 0 && $actual > $block['limitSeconds'] * 2) {
                $long[] = sprintf(
                    '%s — %s при ориентире %s',
                    $block['title'],
                    $this->formatClock($actual),
                    $this->formatClock($block['limitSeconds']),
                );
            }
        }

        if ($long !== []) {
            $sentences[] = 'Заметно дольше ориентира звучали: '.implode('; ', array_slice($long, 0, 3)).'.';
        }

        if ($missing !== []) {
            $sentences[] = 'Совсем не прозвучали блоки: '.implode(', ', $missing).'.';
        }

        if ($long !== [] || $missing !== []) {
            $sentences[] = 'Ориентиры по блокам — подсказка для подготовки, на оценку они не влияют.';
        }

        return implode(' ', $sentences);
    }

    /**
     * @param  array{fillerCount: int, fillerTop: list<array{word: string, count: int}>, wordCount: int}  $speech
     */
    private function appendFillerNote(string $feedback, array $speech): string
    {
        if ($speech['fillerCount'] < PitchMethodology::fillerWordsNoticeThreshold()) {
            return $feedback;
        }

        $top = array_map(
            fn (array $item): string => "«{$item['word']}» — {$item['count']}",
            $speech['fillerTop'],
        );

        $note = sprintf('Слов-паразитов за питч: %d', $speech['fillerCount']);

        if ($top !== []) {
            $note .= ' ('.implode(', ', $top).')';
        }

        return trim($feedback.' '.$note.'.');
    }

    /**
     * @param  list<array{start: float, end: float, text: string}>  $segments
     */
    private function blockDuration(array $segments, int $startSegment, int $endSegment): ?int
    {
        if ($startSegment < 0 || $endSegment < 0 || ! isset($segments[$startSegment], $segments[$endSegment])) {
            return null;
        }

        $start = (float) ($segments[$startSegment]['start'] ?? 0);
        $end = (float) ($segments[$endSegment]['end'] ?? 0);

        return max(0, (int) round($end - $start));
    }

    /**
     * @param  list<array{start: float, end: float, text: string}>  $segments
     */
    private function sliceSegments(array $segments, int $startSegment, int $endSegment): string
    {
        if ($startSegment < 0 || $endSegment < 0 || $segments === []) {
            return '';
        }

        $slice = array_slice($segments, $startSegment, $endSegment - $startSegment + 1);
        $text = implode(' ', array_map(fn (array $segment): string => trim((string) ($segment['text'] ?? '')), $slice));

        return trim(preg_replace('/\s+/u', ' ', $text) ?? '');
    }

    /**
     * Запись дошла до технического предела — питч не был завершён.
     */
    public function wasCutOff(int $actualSeconds): bool
    {
        return $actualSeconds >= PitchMethodology::hardLimitSeconds() - 5;
    }

    private function resolveName(string $name): string
    {
        $name = trim($name);

        return $name !== '' ? $name : 'Питч городского проекта';
    }

    /**
     * @return list<string>
     */
    private function tokenize(string $text): array
    {
        $lowered = mb_strtolower($text);
        $parts = preg_split('/[^\p{L}\p{N}]+/u', $lowered, -1, PREG_SPLIT_NO_EMPTY);

        return $parts === false ? [] : array_values($parts);
    }

    /**
     * Сколько раз последовательность слов встречается в тексте.
     *
     * @param  list<string>  $words
     * @param  list<string>  $sequence
     */
    private function countSequence(array $words, array $sequence): int
    {
        $length = count($sequence);
        $total = count($words);
        $count = 0;

        for ($i = 0; $i + $length <= $total; $i++) {
            if (array_slice($words, $i, $length) === $sequence) {
                $count++;
            }
        }

        return $count;
    }

    private function formatClock(int $seconds): string
    {
        return sprintf('%d:%02d', intdiv($seconds, 60), $seconds % 60);
    }
}
