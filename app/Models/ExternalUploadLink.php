<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AllowedEmailDomain extends Model
{
    use HasFactory;

    protected $table = 'allowed_email_domains';

    protected $fillable = [
        'domain',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeForEmail($query, string $email)
    {
        if (! str_contains($email, '@')) {
            return $query->whereRaw('1 = 0');
        }

        $domain = strtolower(substr(strrchr($email, '@'), 1));
        return $query->where('domain', $domain);
    }

    public function matches(string $emailOrDomain): bool
    {
        if (str_contains($emailOrDomain, '@')) {
            $domain = strtolower(substr(strrchr($emailOrDomain, '@'), 1));
        } else {
            $domain = strtolower($emailOrDomain);
        }

        return $this->domain === $domain;
    }

    public static function isAllowed(string $email): bool
    {
        $domain = substr(strrchr($email, "@"), 1);
        return static::where('domain', $domain)->exists();
    }
}
