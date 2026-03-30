<?php

namespace App\Services;

use App\Models\ActivityLog;

class ActivityLogger
{
    public static function log(int $userId, string $type, string $description, array $metadata = []): void
    {
        ActivityLog::create([
            'user_id'     => $userId,
            'type'        => $type,
            'description' => $description,
            'metadata'    => !empty($metadata) ? $metadata : null,
        ]);
    }
}
