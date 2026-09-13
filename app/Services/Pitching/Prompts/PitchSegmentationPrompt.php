<?php

namespace App\Services\Pitching\Prompts;

use App\Services\Pitching\PitchMethodology;

/**
 * Первый этап анализа: разложить транскрипт питча на блоки методики.
 */
class PitchSegmentationPrompt
{
    public static function getSystemPrompt(): string
    {
        $structure = PitchMethodology::structureOutline();
        $rules = PitchMethodology::promptRulesText();
        $keys = implode(', ', PitchMethodology::keys());

        return <<<PROMPT
Вы — эксперт по питчам городских и социальных проектов. Ваша задача — разложить расшифровку устного питча на блоки методики и оценить, насколько каждый блок раскрыт.

Структура питча (девять блоков):

{$structure}

Как определять статус блока:
- "covered" — блок прозвучал и содержательно закрыт. Короткий, но честный и понятный ответ — это тоже "covered". Одной фразы достаточно, если она отвечает на суть блока.
- "partial" — тема задета вскользь, но остаётся непонятной: нет конкретики, невозможно понять, что имелось в виду.
- "missing" — блок не прозвучал совсем.

Как определять границы:
- Для каждого блока укажите номера первого и последнего сегмента расшифровки, в которых он звучит.
- Если блок не прозвучал или границы определить невозможно, укажите -1 для обоих номеров.
- Блоки могут идти не в том порядке, что в методике, и могут перемежаться — размечайте по смыслу, а не по порядку.
- Разметка приблизительная и нужна только для обратной связи о распределении времени. Она не влияет на оценку, поэтому не пытайтесь подогнать границы под рекомендуемое время.

Поле feedback — одно-два предложения по блоку: что удалось и что усилить. Обращайтесь к человеку на «вы».

Верните ровно девять блоков в порядке методики, с ключами: {$keys}.

{$rules}
PROMPT;
    }

    /**
     * @param  list<array{start: float, end: float, text: string}>  $segments
     */
    public static function getUserPrompt(string $transcription, array $segments): string
    {
        if ($segments === []) {
            return <<<PROMPT
Расшифровка питча (таймкоды недоступны, укажите -1 в качестве границ всех блоков):

{$transcription}
PROMPT;
        }

        $lines = [];

        foreach ($segments as $index => $segment) {
            $start = self::formatTimecode((float) ($segment['start'] ?? 0));
            $text = trim((string) ($segment['text'] ?? ''));
            $lines[] = "[{$index}] {$start} {$text}";
        }

        $numbered = implode("\n", $lines);

        return <<<PROMPT
Расшифровка питча по сегментам. Формат строки: [номер сегмента] время начала, затем текст.

{$numbered}
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    public static function responseSchema(): array
    {
        return [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'pitch_segmentation',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'blocks' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'key' => [
                                        'type' => 'string',
                                        'enum' => PitchMethodology::keys(),
                                    ],
                                    'status' => [
                                        'type' => 'string',
                                        'enum' => ['covered', 'partial', 'missing'],
                                    ],
                                    'startSegment' => ['type' => 'integer'],
                                    'endSegment' => ['type' => 'integer'],
                                    'feedback' => ['type' => 'string'],
                                ],
                                'required' => ['key', 'status', 'startSegment', 'endSegment', 'feedback'],
                                'additionalProperties' => false,
                            ],
                        ],
                    ],
                    'required' => ['blocks'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];
    }

    private static function formatTimecode(float $seconds): string
    {
        $total = (int) round($seconds);

        return sprintf('%02d:%02d', intdiv($total, 60), $total % 60);
    }
}
