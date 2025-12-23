<?php

namespace App\Services;

use RuntimeException;
use Xenolope\Quahog\Client as QuahogClient;
use Socket\Raw\Factory as SocketFactory;

final class ClamAVService
{
    private string $socket;
    private int $timeout;

    public function __construct()
    {
        $this->socket  = config('clamav.socket', 'tcp://127.0.0.1:3310');
        $this->timeout = config('clamav.timeout', 30);
    }

    public function scan(string $filePath): array
    {
        if (!is_readable($filePath)) {
            throw new RuntimeException('File not readable');
        }

        $stream = fopen($filePath, 'rb');
        if ($stream === false) {
            throw new RuntimeException('Cannot open file');
        }

        try {
            $factory = new SocketFactory();

            // ✔ funktioniert für tcp:// UND unix://
            $socket = $factory->createClient($this->socket, 5);

            $client = new QuahogClient(
                $socket,
                $this->timeout,
                PHP_NORMAL_READ
            );

            $result = $client->scanResourceStream($stream);
        } finally {
            fclose($stream);
        }

        if ($result->isOk()) {
            return ['status' => 'clean', 'virus' => null];
        }

        if ($result->isFound()) {
            return ['status' => 'infected', 'virus' => $result->getReason()];
        }

        throw new RuntimeException('ClamAV scan error');
    }
}
