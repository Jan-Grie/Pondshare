<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pond_collaborators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pond_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('permission', ['read', 'write'])->default('read');
            $table->timestamps();

            $table->unique(['pond_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pond_collaborators');
    }
};
