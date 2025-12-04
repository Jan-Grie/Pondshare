<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pond_id')
                ->constrained('ponds')
                ->cascadeOnDelete();
            
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('uploaded_by')->nullable();

            $table->string('name');
            $table->string('extension')->nullable();
            $table->string('path');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');

            //Malware scanning
            $table->string('scan_status', 20)->default('pending')->check("scan_status IN ('pending','clean','infected','failed')");;
            $table->timestamp('scanned_at')->nullable();
            $table->boolean('quarantine_enabled')->default(false);
            $table->string('quarantine_path')->nullable();

            $table->softDeletes();


            $table->timestamps();
        });                
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
