<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id')->default(2)->after('email'); // 1=admin, 2=standard
            $table->unsignedBigInteger('quota_bytes')->default(0)->after('role_id'); 
            $table->string('avatar_url')->nullable()->after('quota_bytes');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role_id', 'quota_bytes', 'avatar_url']);
        });
    }
};
