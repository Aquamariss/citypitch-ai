<?php

namespace App\Services\Pitching\Prompts;

use App\Services\Pitching\PitchMethodology;

/**
 * Второй этап анализа: содержательная оценка уже размеченного питча.
 */
class PitchAnalysisPrompt
{
    public static function getSystemPrompt(): string
    {
        $rules = PitchMethodology::promptRulesText();
        $criteriaList = [];

        foreach (PitchMethodology::aiCriteria() as $key => $criterion) {
            $criteriaList[] = "- {$key} — {$criterion['title']}: {$criterion['description']}";
        }

        $criteria = implode("\n", $criteriaList);
        $recommended = PitchMethodology::formatDuration(PitchMethodology::recommendedSeconds());

        return <<<PROMPT
Вы — наставник по питчингу городских и социальных проектов в тренажёре Citypitch-AI. Питч уже разложен на блоки методики. Ваша задача — дать оценку и поддерживающую обратную связь выступающему.

Оцените по шкале от 0 до 10 каждый критерий:
{$criteria}

Структуру и тайминг оценивать не нужно — их считает система. Рекомендуемая длительность питча — {$recommended}.

Отдельно напишите:
- structureFeedback — одно-два предложения о том, как собран питч в целом: какие блоки работают друг на друга, чего не хватает слушателю, чтобы картина сложилась.
- summary — два-три предложения общего впечатления от питча.
- overallFeedback — главный совет на следующую попытку: что конкретно изменить и как это может прозвучать.
- name — короткое название проекта на основе питча: 2–5 слов на русском, до 40 символов, без кавычек и точки в конце. Если понять проект невозможно — «Питч городского проекта».

Обращайтесь к человеку на «вы». Помните, что для многих это первый в жизни питч: сначала отмечайте, что получилось, потом что усилить.

{$rules}
PROMPT;
    }

    /**
     * @param  list<array{title: string, status: string, text: string}>  $blocks
     */
    public static function getUserPrompt(array $blocks, int $actualSeconds, int $fillerCount, bool $wasCutOff): string
    {
        $statusLabels = [
            'covered' => 'раскрыт',
            'partial' => 'задет вскользь',
            'missing' => 'не прозвучал',
        ];

        $lines = [];

        foreach ($blocks as $block) {
            $status = $statusLabels[$block['status']] ?? $block['status'];
            $text = trim($block['text']) !== '' ? trim($block['text']) : '(в расшифровке не найдено)';
            $lines[] = "### {$block['title']} — {$status}\n{$text}";
        }

        $body = implode("\n\n", $lines);
        $duration = PitchMethodology::formatDuration($actualSeconds);
        $cutOffNote = $wasCutOff
            ? "\nЗапись была остановлена по техническому лимиту — питч не был завершён, учтите это в обратной связи."
            : '';
        $fillerNote = $fillerCount >= PitchMethodology::fillerWordsNoticeThreshold()
            ? "\nСлов-паразитов в речи: {$fillerCount}."
            : '';

        return <<<PROMPT
Длительность питча: {$duration}.{$cutOffNote}{$fillerNote}

Питч по блокам:

{$body}
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    public static function responseSchema(): array
    {
        $criteriaProperties = [];
        $criteriaKeys = [];

        foreach (PitchMethodology::aiCriteria() as $key => $criterion) {
            $criteriaKeys[] = $key;
            $criteriaProperties[$key] = [
                'type' => 'object',
                'properties' => [
                    'score' => [
                        'type' => 'number',
                        'description' => 'Оценка 0–10 по критерию «'.$criterion['title'].'»',
                    ],
                    'feedback' => ['type' => 'string'],
                ],
                'required' => ['score', 'feedback'],
                'additionalProperties' => false,
            ];
        }

        return [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'pitch_analysis',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => ['type' => 'string'],
                        'summary' => ['type' => 'string'],
                        'overallFeedback' => ['type' => 'string'],
                        'structureFeedback' => ['type' => 'string'],
                        'criteria' => [
                            'type' => 'object',
                            'properties' => $criteriaProperties,
                            'required' => $criteriaKeys,
                            'additionalProperties' => false,
                        ],
                    ],
                    'required' => ['name', 'summary', 'overallFeedback', 'structureFeedback', 'criteria'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];
    }
}
