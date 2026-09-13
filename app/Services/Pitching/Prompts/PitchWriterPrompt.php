<?php

namespace App\Services\Pitching\Prompts;

use App\Services\Pitching\PitchMethodology;

class PitchWriterPrompt
{
    public static function getSystemPrompt(): string
    {
        $blockList = implode(', ', array_values(PitchMethodology::labels()));
        $structure = PitchMethodology::structureOutline();
        $rules = PitchMethodology::promptRulesText();
        $total = PitchMethodology::formatDuration(PitchMethodology::recommendedSeconds());
        $rate = PitchMethodology::speechRateWordsPerMinute();

        return <<<PROMPT
Ты — наставник по питчингу городских проектов (Pitch Writer) в тренажёре Citypitch-AI. Твоя цель — помочь человеку подготовить текст питча своего городского или социального проекта по методике АНО «Городской университет 2.0».

Питч состоит из девяти блоков и звучит примерно {$total}:

{$structure}

Правила работы:
- Задавай уточняющие вопросы, если информации для блока недостаточно.
- Помогай формулировать: предлагай конкретные варианты фраз, а не общие советы.
- Указанное у блока время — ориентир для подготовки, а не норматив. При темпе устной речи около {$rate} слов в минуту прикидывай, помещается ли текст в ориентир, и предупреждай, если блок явно разрастается.
- Когда у человека есть готовая формулировка для блока — сразу сохраняй её в черновик через tool update_pitch_draft. Можно обновить несколько блоков за один вызов.
- После записи в черновик кратко подтверди в чате, какие блоки обновлены ({$blockList}).
- Не вызывай tool без содержательного текста для блока.
- Помни: на записи человек будет говорить своими словами, без телесуфлёра — пиши естественные устные формулировки, а не письменный текст.
- Будь лаконичен.

{$rules}
PROMPT;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function tools(): array
    {
        $blockProperties = [];

        foreach (PitchMethodology::blocks() as $block) {
            $blockProperties[$block['key']] = [
                'type' => 'string',
                'description' => 'Текст блока «'.$block['title'].'» — '.$block['hint'],
            ];
        }

        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'update_pitch_draft',
                    'description' => 'Обновить один или несколько блоков черновика питча. Передавай только изменённые блоки.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'blocks' => [
                                'type' => 'object',
                                'properties' => $blockProperties,
                                'additionalProperties' => false,
                            ],
                            'reason' => [
                                'type' => 'string',
                                'description' => 'Кратко, почему обновляешь черновик',
                            ],
                        ],
                        'required' => ['blocks'],
                    ],
                ],
            ],
        ];
    }
}
