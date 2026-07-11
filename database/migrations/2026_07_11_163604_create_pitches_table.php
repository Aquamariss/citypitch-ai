<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pitches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('status')->default('processing');
            $table->string('step')->nullable();
            $table->string('video_path')->nullable();
            $table->string('media_type')->default('video');
            $table->unsignedInteger('duration')->nullable();
            $table->json('transcription')->nullable();
            $table->json('result')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pitches');
    }
};
