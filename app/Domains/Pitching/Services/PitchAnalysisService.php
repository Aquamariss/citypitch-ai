<?php

namespace App\Domains\Pitching\Services;

use App\Domains\Pitching\DTOs\PitchAnalysisResult;
use App\Domains\Pitching\Prompts\PitchAnalysisPrompt;
use OpenAI\Laravel\Facades\OpenAI;

class PitchAnalysisService
{
    public function analyze(string $transcription, int $expectedDuration, float $actualDuration): PitchAnalysisResult
    {
        $response = OpenAI::chat()->create([
            'model' => 'gpt-5.4-mini',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => PitchAnalysisPrompt::getSystemPrompt(),
                ],
                [
                    'role' => 'user',
                    'content' => PitchAnalysisPrompt::getUserPrompt($transcription, $expectedDuration, $actualDuration),
                ],
            ],
            'response_format' => [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => 'pitch_analysis',
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'summary' => ['type' => 'string'],
                            'isPassed' => ['type' => 'boolean'],
                            'overallFeedback' => ['type' => 'string'],
                            'criteria' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'name' => ['type' => 'string'],
                                        'score' => ['type' => 'number'],
                                        'maxScore' => ['type' => 'number'],
                                        'feedback' => ['type' => 'string'],
                                    ],
                                    'required' => ['name', 'score', 'maxScore', 'feedback'],
                                    'additionalProperties' => false,
                                ],
                            ],
                        ],
                        'required' => ['name', 'summary', 'isPassed', 'overallFeedback', 'criteria'],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ],
            'temperature' => 0.2,
        ]);

        $content = $response->choices[0]->message->content;
        $data = json_decode($content, true, 512, JSON_THROW_ON_ERROR);

        return new PitchAnalysisResult(
            name: trim($data['name'] ?? ''),
            summary: $data['summary'] ?? '',
            isPassed: (bool) ($data['isPassed'] ?? false),
            criteria: $data['criteria'] ?? [],
            overallFeedback: $data['overallFeedback'] ?? '',
        );
    }
}
