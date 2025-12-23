<?php

return [
    'enabled' => env('CLAMAV_ENABLED', false),
    'socket' => env('CLAMAV_SOCKET', 'tcp://127.0.0.1:3310'),
    'timeout' => env('CLAMAV_TIMEOUT', 30),
];

