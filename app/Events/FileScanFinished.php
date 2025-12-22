<?php

namespace App\Events;

use App\Models\File;
use App\Models\FileScan;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

class FileScanFinished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public File $file,
        public FileScan $scan
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('pond.' . $this->file->pond_id);
    }

    public function broadcastAs(): string
    {
        return 'file.scan.finished';
    }

    public function broadcastWith(): array
    {
        return [
            'file_id'     => $this->file->id,
            'scan_status' => $this->file->scan_status,
            'scanned_at'  => $this->file->scanned_at,
            'message'     => $this->scan->message,
        ];
    }
}
