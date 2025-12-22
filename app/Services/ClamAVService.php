<?php

namespace App\Services;

use RuntimeException;
use Xenolope\Quahog\Client as QuahogClient;
use Socket\Raw\Factory as SocketFactory;

final class ClamAVService
{
    private string $socket;
    private int $connectTimeout;
    private int $readTimeout;

    public function __construct()
    {
        $this->socket = config('clamav.socket', 'tcp://127.0.0.1:3310');
        $this->connectTimeout = 5;
        $this->readTimeout = 30;
    }

public function scan(string $filePath): bool
{
    if (!is_readable($filePath)) {
        throw new RuntimeException('File not readable');
    }

    $stream = fopen($filePath, 'rb');
    if ($stream === false) {
        throw new RuntimeException('Cannot open file');
    }

    try {
        $client = (new SocketFactory())->createClient(
            config('clamav.socket', 'tcp://127.0.0.1:3310'),
            5
        );

        $scanner = new QuahogClient($client, 30, PHP_NORMAL_READ);

        $result = $scanner->scanResourceStream($stream);
    } catch (\Exception $e) {
        fclose($stream);
        return false;
    }

    fclose($stream);

    return $result->isOk();
}

}
