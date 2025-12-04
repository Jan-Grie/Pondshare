<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'settings';
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public $timestamps = true;

    protected static function getValue(string $key, $default = null)
    {
        $row = static::find($key);
        return $row ? $row->value : $default;
    }

    protected static function setValue(string $key, $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    public static function forcePasswordForLinks(): bool
    {
        return (bool) static::getValue('force_password_for_all_links', false);
    }

    public static function minLinkPasswordLength(): int
    {
        return (int) static::getValue('link_password_min_length', 8);
    }

    public static function defaultLinkExpirationDays(): int
    {
        return (int) static::getValue('default_link_expiration_days', 30);
    }

    public static function maxLinkExpirationDays(): int
    {
        return (int) static::getValue('max_links_expiration_days', 365);
    }

    public static function defaultQuotaBytes(): int
    {
        return (int) static::getValue('default_quota_bytes', 5368709120);
    }

    public static function quotaWarningThresholdPercent(): int
    {
        return (int) static::getValue('quota_email_warning_threshold', 80);
    }

    public static function isRegistrationEnabled(): bool
    {
        return (bool) static::getValue('registration_enabled', false);
    }

    public static function canRegisterEmail(string $email): bool
    {
        if (! static::getValue('restrict_registration_to_domains', false)) {
            return true;
        }

        $domain = strtolower(substr(strrchr($email, '@'), 1));
        return AllowedEmailDomain::where('domain', $domain)->exists();
    }

    public static function requireExpiryForLinks(): bool
    {
        return (bool) static::getValue('require_expiry_for_links', false);
    }
}
