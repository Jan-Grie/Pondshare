<?php

namespace App\Console\Commands;

use App\Models\File;
use App\Models\FileScan;
use App\Jobs\ScanFileWithClamAV;
use Illuminate\Console\Command;

class RescanFailedFiles extends Command
{
    protected $signature = 'clamav:rescan-failed';
    protected $description = 'Retry failed ClamAV scans';

    public function handle(): int
    {
        File::query()
            ->where('scan_status', 'failed')
            ->whereHas('scans', fn ($q) => $q->where('status', 'failed'))
            ->withCount([
                'scans as failed_scans' => fn ($q) =>
                    $q->where('status', 'failed'),
            ])
            ->having('failed_scans', '<', 5)
            ->each(function (File $file) {

                if ($file->scans()->where('status', 'pending')->exists()) {
                    return;
                }

                $scan = FileScan::create([
                    'file_id' => $file->id,
                    'status'  => 'pending',
                ]);

                ScanFileWithClamAV::dispatch(
                    $file->id,
                    $scan->id
                );
            });

        return self::SUCCESS;
    }
}
