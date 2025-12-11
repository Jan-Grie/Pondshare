<?php
namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use App\Models\File;

class FileUploaded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $uploadedFileId,
        public int $pondId,
        public string $uploaderType
    ) {}

    public function broadcastOn(): array
    {
        return [ new PrivateChannel("pond.{$this->pondId}") ];
    }

    public function broadcastWith(): array
    {
        $file = File::findOrFail($this->uploadedFileId);

        return [
            "file" => [
                "id"         => $file->id,
                "name"       => $file->name . "." . $file->extension,
                "size"       => $file->size,
                "uploaded_at"=> $file->created_at,
                "extension"  => $file->extension,
                "mime_type"  => $file->mime_type,
                "scan_status"=> $file->scan_status,
            ],
            "uploader_type" => $this->uploaderType,
        ];
    }

    public function broadcastAs(): string
    {
        return "file.uploaded";
    }
}
