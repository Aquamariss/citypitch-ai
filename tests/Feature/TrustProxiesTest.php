<?php

namespace Tests\Feature;

use Tests\TestCase;

class TrustProxiesTest extends TestCase
{
    public function test_vite_assets_use_https_when_proxied_over_tls(): void
    {
        $response = $this->call('GET', '/login', server: [
            'HTTP_HOST' => 'pitch-ai.ru.tuna.am',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTPS' => 'off',
            'SERVER_PORT' => '80',
        ]);

        $response->assertOk();

        $content = $response->getContent();

        $this->assertMatchesRegularExpression(
            '#href="https://[^"]+/build/assets/app-[^"]+\.css"#',
            $content,
        );
        $this->assertDoesNotMatchRegularExpression(
            '#href="http://[^"]+/build/assets/app-[^"]+\.css"#',
            $content,
        );
    }
}
