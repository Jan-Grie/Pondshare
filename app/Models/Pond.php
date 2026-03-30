<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pond extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ponds';

    protected $fillable = [
        'user_id',
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function files()
    {
        return $this->hasMany(File::class);
    }

    public function shareLinks()
    {
        return $this->hasMany(ShareLink::class);
    }

    public function externalUploadLinks()
    {
        return $this->hasMany(ExternalUploadLink::class);
    }

    public function collaborators()
    {
        return $this->hasMany(PondCollaborator::class);
    }

    public function activeFileCount(): int
    {
        return $this->files()->whereNull('deleted_at')->count();
    }

    public function activeFilesSize(): int
    {
        return (int) $this->files()
            ->whereNull('deleted_at')
            ->sum('size');
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
}
