<?php

use App\Domains\Auth\AuthServiceProvider;
use App\Domains\Pitching\PitchingServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    PitchingServiceProvider::class,
];
