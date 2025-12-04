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
        Schema::create('file_scan_events', function (Blueprint $table) {
            $table->id();

            //File reference
            $table->foreignId('file_id')
                ->constrained('files')
                ->cascadeOnDelete();
            
            //The scran result for this event
            $table->string('status', 20);

            $table->string('message')->nullable();

            $table->timestamps();            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_scan_events');
    }
};
