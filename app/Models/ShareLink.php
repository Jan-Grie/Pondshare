<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ShareLink extends Model
{
    use HasFactory;

    protected $table = 'share_links';

    protected $fillable = [
        'pond_id',
        'name',
        'token',
        'password_enabled',
        'password_hash',
        'expires_at',
        'download_count',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'pond_id'          => 'integer',
        'password_enabled' => 'boolean',
        'expires_at'       => 'datetime',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
        'download_count'   => 'integer',
    ];

    public function pond()
    {
        return $this->belongsTo(Pond::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function extendExpiration(int $days): void
    {
        $newExpiry = $this->expires_at
            ? $this->expires_at->addDays($days)
            : Carbon::now()->addDays($days);

        $this->expires_at = $newExpiry;
        $this->save();
    }

    public function incrementDownloadCount(): void
    {
        $this->increment('download_count');
    }

    public function regenerateToken(): void
    {
        $this->token = (string) Str::uuid();
        $this->save();
    }

    public function checkPassword(string $plainPassword): bool
    {
        if (! $this->password_enabled || ! $this->password_hash) {
            return true;
        }

        return Hash::check($plainPassword, $this->password_hash);
    }

    public function setPassword(string $plainPassword): void
    {
        $this->password_enabled = true;
        $this->password_hash = Hash::make($plainPassword);
        $this->save();
    }

    public function removePassword(): void
    {
        $this->password_enabled = false;
        $this->password_hash = null;
        $this->save();
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', Carbon::now());
        });
    }

    public function isPasswordProtected(): bool
    {
        return $this->password_enabled === true;
    }
}
