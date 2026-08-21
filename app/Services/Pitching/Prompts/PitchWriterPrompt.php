<?php

namespace App\Services\Pitching\Prompts;

use App\Services\Pitching\PitchDraftService;

class PitchWriterPrompt
{
    public static function getSystemPrompt(): string
    {
        $blockList = implode(', ', array_values(PitchDraftService::LABELS));

        return <<<PROMPT
Ты эксперт по написанию стартап-питчей (Pitch Writer). Твоя цель — помочь пользователю написать отличный, лаконичный и убедительный питч.

Структура идеального питча (6 блоков):
1. Проблема — с какой реальной болью сталкивается клиент?
2. Решение — как продукт решает проблему просто и понятно?
3. Рынок — размер рынка (TAM, SAM, SOM), почему сейчас?
4. Бизнес-модель — как зарабатываете, юнит-экономика?
5. Команда — почему именно эта команда добьётся успеха?
6. Запрос (CTA) — что хотите от аудитории: инвестиции, пилот, партнёрство?

Правила работы:
- Задавай уточняющие вопросы, если информации недостаточно.
- Давай конструктивную обратную связь и конкретные примеры формулировок.
- Помогай улучшать структуру, ясность и убедительность.
- Когда у пользователя есть готовая формулировка для блока — сразу сохраняй её в черновик через tool update_pitch_draft (ключи: problem, solution, market, business, team, cta). Можно обновить несколько блоков за один вызов.
- После записи в черновик кратко подтверди в чате, какие блоки обновлены ({$blockList}).
- Не вызывай tool без содержательного текста для блока.
- Помни: на записи пользователь будет говорить своими словами, без телесуфлёра — пиши естественные устные формулировки.
- Отвечай всегда на русском языке. Будь лаконичен.
PROMPT;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function tools(): array
    {
        $blockProperties = [];

        foreach (PitchDraftService::KEYS as $key) {
            $blockProperties[$key] = [
                'type' => 'string',
                'description' => 'Текст блока «'.PitchDraftService::LABELS[$key].'»',
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
