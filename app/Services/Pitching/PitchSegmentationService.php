<?php

namespace App\Services\Pitching;

use App\DTO\PitchSegmentationResultDto;
use App\Services\Pitching\Prompts\PitchSegmentationPrompt;

/**
 * Первый этап анализа: модель раскладывает расшифровку на блоки методики.
 *
 * Границы блоков приблизительные и нужны только для обратной связи
 * о распределении времени — на балл они не влияют.
 */
class PitchSegmentationService
{
    public function __construct(
        private readonly OpenAiClientFactory $clientFactory,
    ) {}

    /**
     * @param  list<array{start: float, end: float, text: string}>  $segments
     */
    public function segment(string $transcription, array $segments): PitchSegmentationResultDto
    {
        $response = $this->clientFactory
            ->make((int) config('pitching.analysis_request_timeout', 180))
            ->chat()
            ->create([
                'model' => config('pitching.analysis_model', 'gpt-4.1-mini'),
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => PitchSegmentationPrompt::getSystemPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => PitchSegmentationPrompt::getUserPrompt($transcription, $segments),
                    ],
                ],
                'response_format' => PitchSegmentationPrompt::responseSchema(),
                'temperature' => 0.1,
                'max_completion_tokens' => (int) config('pitching.analysis_max_completion_tokens', 4000),
            ]);

        $content = $response->choices[0]->message->content ?? '';
        $data = json_decode((string) $content, true, 512, JSON_THROW_ON_ERROR);

        return new PitchSegmentationResultDto(
            blocks: $this->normalizeBlocks($data['blocks'] ?? [], count($segments)),
        );
    }

    /**
     * Приводит ответ модели к девяти блокам методики в её порядке:
     * добивает пропущенные, чистит невалидные границы.
     *
     * @param  array<int, mixed>  $blocks
     * @return list<array{key: string, status: string, startSegment: int, endSegment: int, feedback: string}>
     */
    private function normalizeBlocks(array $blocks, int $segmentCount): array
    {
        $byKey = [];

        foreach ($blocks as $block) {
            if (! is_array($block) || ! isset($block['key'])) {
                continue;
            }

            $byKey[(string) $block['key']] = $block;
        }

        $normalized = [];

        foreach (PitchMethodology::keys() as $key) {
            $block = $byKey[$key] ?? null;
            $status = $this->normalizeStatus($block['status'] ?? 'missing');

            [$start, $end] = $this->normalizeBounds(
                (int) ($block['startSegment'] ?? -1),
                (int) ($block['endSegment'] ?? -1),
                $segmentCount,
            );

            if ($status === 'missing') {
                [$start, $end] = [-1, -1];
            }

            $normalized[] = [
                'key' => $key,
                'status' => $status,
                'startSegment' => $start,
                'endSegment' => $end,
                'feedback' => trim((string) ($block['feedback'] ?? '')),
            ];
        }

        return $normalized;
    }

    private function normalizeStatus(mixed $status): string
    {
        $status = is_string($status) ? strtolower(trim($status)) : '';

        return in_array($status, ['covered', 'partial', 'missing'], true) ? $status : 'missing';
    }

    /**
     * @return array{int, int}
     */
    private function normalizeBounds(int $start, int $end, int $segmentCount): array
    {
        if ($segmentCount === 0 || $start < 0 || $end < 0) {
            return [-1, -1];
        }

        $start = min($start, $segmentCount - 1);
        $end = min($end, $segmentCount - 1);

        if ($end < $start) {
            [$start, $end] = [$end, $start];
        }

        return [$start, $end];
    }
}
