<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        // Internal role keys
        $roles = [
            'admin',
            'default_user',
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role], // unique identifier
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
