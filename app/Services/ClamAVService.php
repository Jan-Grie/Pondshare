<?php

namespace App\Services;

use RuntimeException;

final class ClamAVService
{
    private string $host;
    private int $port;
    private int $timeout;

    public function __construct()
    {
        $this->host    = config('clamav.host', '127.0.0.1');
        $this->port    = config('clamav.port', 3310);
        $this->timeout = config('clamav.timeout', 10);
    }

    public function scan(string $filePath): array
    {
        if (! is_readable($filePath)) {
            throw new RuntimeException('File not readable');
        }

        $socket = fsockopen(
            $this->host,
            $this->port,
            $errno,
            $errstr,
            $this->timeout
        );

        if (! $socket) {
            throw new RuntimeException("ClamAV connection failed: $errstr");
        }

        // ✅ RICHTIGER INSTREAM COMMAND
        fwrite($socket, "INSTREAM\n");

        $file = fopen($filePath, 'rb');

        while (! feof($file)) {
            $chunk = fread($file, 8192);

            if ($chunk === false || $chunk === '') {
                break;
            }

            fwrite($socket, pack('N', strlen($chunk)));
            fwrite($socket, $chunk);
        }

        // Stream-Ende
        fwrite($socket, pack('N', 0));

        fclose($file);

        $response = fgets($socket);
        fclose($socket);

        if ($response === false) {
            throw new RuntimeException('No response from ClamAV');
        }

        return [
            'clean' => str_contains($response, 'OK'),
            'raw'   => trim($response),
        ];
    }
}
