<?php

namespace App\Jobs;

use App\Models\File;
use App\Models\FileScan;
use App\Services\ClamAVService;
use App\Events\FileScanFinished;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ScanFileWithClamAV implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public int $fileId,
        public int $scanId
    ) {}

    public function handle(ClamAVService $clamav): void
    {
        $scan = FileScan::findOrFail($this->scanId);
        $file = File::findOrFail($this->fileId);

        try {
            Log::info('ClamAV scan started', [
                'file_id' => $file->id,
                'scan_id' => $scan->id,
            ]);

            $result = $clamav->scan(
                storage_path('app/' . $file->path)
            );

            $status = $result['clean'] ? 'clean' : 'infected';

            // Scan Event
            $scan->update([
                'status'  => $status,
                'message' => $result['raw'],
            ]);

            // File Tabelle
            $file->update([
                'scan_status' => $status,
                'scanned_at'  => now(),
            ]);

            Log::info('File after update', [
                'scan_status' => $file->fresh()->scan_status,
            ]);

            // Optional: infizierte Datei löschen
            if ($status === 'infected') {
                @unlink(storage_path('app/' . $file->path));
            }

        } catch (\Throwable $e) {
            Log::error('ClamAV scan failed', [
                'file_id' => $file->id,
                'error'   => $e->getMessage(),
            ]);

            $scan->update([
                'status'  => 'failed',
                'message' => $e->getMessage(),
            ]);

            $file->update([
                'scan_status' => 'failed',
                'scanned_at'  => now(),
            ]);
        }

        broadcast(new FileScanFinished($file, $scan));
    }

}
