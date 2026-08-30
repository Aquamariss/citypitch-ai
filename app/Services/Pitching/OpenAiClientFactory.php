<?php

namespace App\Services\Pitching;

use OpenAI;
use OpenAI\Client;

/**
 * Сборка клиента OpenAI с собственным таймаутом: у чата, разметки и анализа
 * они разные, а глобальный клиент фасада один.
 */
final class OpenAiClientFactory
{
    public function make(int $timeoutSeconds): Client
    {
        $apiKey = config('openai.api_key');
        $organization = config('openai.organization');
        $project = config('openai.project');
        $baseUri = config('openai.base_uri');

        $factory = OpenAI::factory()
            ->withApiKey(is_string($apiKey) ? $apiKey : '')
            ->withOrganization(is_string($organization) ? $organization : null)
            ->withHttpClient(new \GuzzleHttp\Client([
                'timeout' => $timeoutSeconds,
            ]));

        if (is_string($project)) {
            $factory->withProject($project);
        }

        if (is_string($baseUri)) {
            $factory->withBaseUri($baseUri);
        }

        return $factory->make();
    }
}
