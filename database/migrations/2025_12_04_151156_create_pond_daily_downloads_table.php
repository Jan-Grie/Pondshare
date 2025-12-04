<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pond_daily_downloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pond_id')
                ->constrained('ponds')
                ->cascadeOnDelete();
            $table->date('date');
            $table->unsignedBigInteger('download_count')->default(0);
            $table->unique(['pond_id', 'date']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pond_daily_downloads');
    }
};
