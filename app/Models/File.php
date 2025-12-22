<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class File extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'files';

    protected $fillable = [
        'pond_id',
        'user_id',
        'uploaded_by',
        'name',
        'extension',
        'path',
        'mime_type',
        'size',
        'scan_status',
        'scanned_at',
        'quarantine_enabled',
        'quarantine_path',
    ];

    protected $casts = [
        'pond_id'             => 'integer',
        'user_id'             => 'integer',
        'size'                => 'integer',
        'scanned_at'          => 'datetime',
        'quarantine_enabled'  => 'boolean',
        'created_at'          => 'datetime',
        'updated_at'          => 'datetime',
        'deleted_at'          => 'datetime',
    ];

    public function pond()
    {
        return $this->belongsTo(Pond::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isTrashed(): bool
    {
        return $this->trashed();
    }

    public function moveToTrash(): bool
    {
        return $this->delete();
    }

    public function restoreFromTrash(): bool
    {
        return $this->restore();
    }

    public function sizeInKilobytes(): float
    {
        return round($this->size / 1024, 2);
    }

    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;

        if ($bytes >= 1024 * 1024 * 1024) {
            return number_format($bytes / (1024 * 1024 * 1024), 2, ',', '.') . ' GB';
        }
        if ($bytes >= 1024 * 1024) {
            return number_format($bytes / (1024 * 1024), 1, ',', '.') . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 1, ',', '.') . ' KB';
        }

        return $bytes . ' B';
    }

    protected static array $previewableMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'audio/mpeg',
    ];

    public function isPreviewable(): bool
    {
        return in_array($this->mime_type, self::$previewableMimeTypes, true);
    }

    public function scans()
    {
        return $this->hasMany(FileScan::class);
    }

    public function latestScan()
    {
        return $this->hasOne(FileScan::class)->latestOfMany();
    }

}
