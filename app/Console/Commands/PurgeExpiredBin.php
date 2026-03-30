<?php

namespace App\Console\Commands;

use App\Jobs\DeletePondFiles;
use App\Models\File;
use App\Models\Pond;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredBin extends Command
{
    protected $signature = 'bin:purge {--days=30 : Days after which trashed items are permanently deleted}';
    protected $description = 'Permanently delete ponds and files that have been in the bin for longer than the configured period';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = Carbon::now()->subDays($days);

        // Purge expired trashed ponds
        $ponds = Pond::onlyTrashed()
            ->where('deleted_at', '<', $cutoff)
            ->with(['files' => fn ($q) => $q->withTrashed()])
            ->get();

        foreach ($ponds as $pond) {
            $filePaths = $pond->files->pluck('path')->toArray();
            if (!empty($filePaths)) {
                DeletePondFiles::dispatch($filePaths, $pond->id);
            }
            $pond->files()->withTrashed()->forceDelete();
            $pond->forceDelete();
        }

        $this->info("Purged {$ponds->count()} expired pond(s) from bin.");

        // Purge expired trashed files from non-trashed ponds
        $files = File::onlyTrashed()
            ->where('deleted_at', '<', $cutoff)
            ->whereHas('pond', fn ($q) => $q->whereNull('deleted_at'))
            ->get();

        foreach ($files as $file) {
            Storage::delete($file->path);
            $file->forceDelete();
        }

        $this->info("Purged {$files->count()} expired file(s) from bin.");

        return Command::SUCCESS;
    }
}
