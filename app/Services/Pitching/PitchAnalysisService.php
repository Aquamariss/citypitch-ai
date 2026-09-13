<?php

namespace App\Services\Pitching;

use App\DTO\PitchAnalysisResultDto;
use App\Services\Pitching\Prompts\PitchAnalysisPrompt;

/**
 * Второй этап анализа: содержательные оценки по критериям, которые
 * невозможно посчитать кодом (логика, убедительность, ясность).
 */
class PitchAnalysisService
{
    public function __construct(
        private readonly OpenAiClientFactory $clientFactory,
    ) {}

    /**
     * @param  list<array{title: string, status: string, text: string}>  $blocks
     */
    public function analyze(array $blocks, int $actualSeconds, int $fillerCount, bool $wasCutOff): PitchAnalysisResultDto
    {
        $response = $this->clientFactory
            ->make((int) config('pitching.analysis_request_timeout', 180))
            ->chat()
            ->create([
                'model' => config('pitching.analysis_model', 'gpt-4.1-mini'),
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => PitchAnalysisPrompt::getSystemPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => PitchAnalysisPrompt::getUserPrompt($blocks, $actualSeconds, $fillerCount, $wasCutOff),
                    ],
                ],
                'response_format' => PitchAnalysisPrompt::responseSchema(),
                'temperature' => 0.2,
                'max_completion_tokens' => (int) config('pitching.analysis_max_completion_tokens', 4000),
            ]);

        $content = $response->choices[0]->message->content ?? '';
        $data = json_decode((string) $content, true, 512, JSON_THROW_ON_ERROR);

        return new PitchAnalysisResultDto(
            name: trim((string) ($data['name'] ?? '')),
            summary: trim((string) ($data['summary'] ?? '')),
            overallFeedback: trim((string) ($data['overallFeedback'] ?? '')),
            structureFeedback: trim((string) ($data['structureFeedback'] ?? '')),
            criteria: $this->normalizeCriteria($data['criteria'] ?? []),
        );
    }

    /**
     * @param  array<string, mixed>  $criteria
     * @return array<string, array{score: float, feedback: string}>
     */
    private function normalizeCriteria(array $criteria): array
    {
        $normalized = [];

        foreach (array_keys(PitchMethodology::aiCriteria()) as $key) {
            $raw = $criteria[$key] ?? [];
            $score = (float) ($raw['score'] ?? 0);

            $normalized[$key] = [
                'score' => max(0.0, min(10.0, $score)),
                'feedback' => trim((string) ($raw['feedback'] ?? '')),
            ];
        }

        return $normalized;
    }
}
