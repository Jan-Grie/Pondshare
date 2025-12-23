<?php

namespace App\Jobs;

use App\Services\ClamAVService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class UpdateClamavSignatureCache implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(ClamAVService $clamav): void
    {
        try {
            $info = $clamav->getSignatureInfo();

            Cache::put('clamav.signature_info', [
                'engine_version'     => (string) $info['engine_version'],
                'signature_version'  => (int) $info['signature_version'],
                'signature_date'     => is_string($info['signature_date'])
                    ? $info['signature_date']
                    : $info['signature_date']->toIso8601String(),
                'signature_age_days' => (int) $info['signature_age_days'],
            ], now()->addHours(6));
        } catch (\Throwable $e) {
            Log::warning('ClamAV signature cache update failed', [
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
