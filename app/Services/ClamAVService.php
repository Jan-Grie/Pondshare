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

    public function getSignatureInfo(): array
    {
        $factory = new SocketFactory();
        $socket  = $factory->createClient($this->socket, 5);

        $client = new QuahogClient(
            $socket,
            $this->timeout,
            PHP_NORMAL_READ
        );

        $version = $client->version();
        // z. B.: "ClamAV 1.3.1/27001/Fri Aug 23 07:42:14 2024"

        if (!preg_match(
            '/ClamAV\s+(?<engine>[^\/]+)\/(?<sigver>\d+)\/(?<date>.+)$/',
            $version,
            $m
        )) {
            throw new RuntimeException('Unexpected ClamAV version format');
        }

        $signatureDate = new \DateTimeImmutable($m['date']);
        $now           = new \DateTimeImmutable();

        return [
            'engine_version'     => $m['engine'],
            'signature_version'  => (int) $m['sigver'],
            'signature_date' => $signatureDate->format(DATE_ATOM),
            'signature_age_days' => $signatureDate->diff($now)->days,
            'raw'                => $version,
        ];
    }    
}
