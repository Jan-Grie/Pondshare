<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesSeeder::class,
            SystemSettingsSeeder::class,
        ]);

        // If there are no users yet, create a default admin user
        if (User::count() === 0) {
            User::create([
                'name'              => 'Admin',
                'email'             => 'admin@admin',
                'password'          => Hash::make('admin'),
                'email_verified_at' => now(),
                'locale'            => 'en',
                'active'            => true,
                'must_change_password' => true,
            ]);
        }
    }
}
