<?php

return [
    'host' => env('CLAMAV_HOST', '127.0.0.1'),
    'port' => (int) env('CLAMAV_PORT', 3310),
    'timeout' => (int) env('CLAMAV_TIMEOUT', 10),
];
