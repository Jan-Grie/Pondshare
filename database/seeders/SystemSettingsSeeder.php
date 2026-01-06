<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key'   => 'app_name',
                'value' => 'Pondshare', //Default Value
            ],
            [
                'key'   => 'force_password_for_all_links',
                'value' => '1',
            ],
            [
                'key'   => 'link_password_min_length',
                'value' => '8',
            ],
            [
                'key'   => 'default_link_expiration_days',
                'value' => '30',
            ],
            [
                'key'   => 'max_links_expiration_days',
                'value' => '360',
            ],
            [
                'key'   => 'default_quota_bytes',
                'value' => '5368709120',
            ],
            [
                'key'   => 'quota_email_warning_threshold',
                'value' => '80',
            ],
            [
                'key'   => 'registration_enabled',
                'value' => '0',
            ],
            [
                'key'   => 'restrict_registration_to_domains',
                'value' => '1',
            ],
            [
                'key'   => 'require_expiry_for_links',
                'value' => '0',
            ],

            // Virus Scan settings
            [
                'key'   => 'virus_scan.enabled',
                'value' => '1',
            ],
            [
                'key'   => 'virus_scan.action',
                'value' => 'quarantine', // options: quarantine, delete
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->insertOrIgnore([
                'key'        => $setting['key'],
                'value'      => $setting['value'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
