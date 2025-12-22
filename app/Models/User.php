<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Support\Str;


class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'email_verified_at',
        'must_change_password',
        'quota_bytes',
        'active',
        'locale',
        'app_layout',
        'provider',
        'provider_id',
        'provider_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'must_change_password' => 'boolean',
            'active' => 'boolean',
            'quota_bytes' => 'integer',            
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function ponds(){
        return $this->hasMany(Pond::class);
    }

    public function files(){
        return $this->hasMany(File::class);        
    }

    public function usedQuota(): int
    {
        return $this->files()->withTrashed()->sum('size');
    }

    public function QuotaRemaining(): int
    {
        $remaining = $this->quota_bytes - $this->usedQuota();
        return max(0, $remaining);
    }

    public function hasRole(string $roleName): bool
    {
        return $this->role && strtolower($this->role->name) === strtolower($roleName);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function adjustQuota(int $bytesDelta): void
    {
        $this->quota_bytes = max(0, $this->quota_bytes + $bytesDelta);
        $this->save();
    }

        public function getQuotaBytes(): int
    {
        return (int) $this->quota_bytes;
    }

    public function getUsedBytes(): int
    {
        return $this->usedQuota();
    }

        public function quotaPercent(): float
    {
        $max = $this->getQuotaBytes();
        if ($max <= 0) {
            return 0.0;
        }

        return round(($this->usedQuota() / $max) * 100, 2);
    }

    
    protected $appends = ['avatar'];

    public function getAvatarAttribute(): string
    {
        if ($this->avatar_url) {
            return route('avatar.show', [
                'path' => Str::after($this->avatar_url, 'avatars/'),
            ]);
        }

        $hash = md5(strtolower(trim($this->email)));

        return "https://www.gravatar.com/avatar/{$hash}?s=200&d=404";
    }
}
