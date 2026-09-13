<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Тренажёр стал аудиоформатом по методике городских проектов:
     * видеорежим убран, итоговый балл сохраняется явно.
     */
    public function up(): void
    {
        Schema::table('pitches', function (Blueprint $table) {
            $table->renameColumn('video_path', 'audio_path');
        });

        Schema::table('pitches', function (Blueprint $table) {
            $table->dropColumn('media_type');
        });

        Schema::table('pitches', function (Blueprint $table) {
            $table->unsignedTinyInteger('score')->nullable()->after('step');
            $table->string('methodology_version')->nullable()->after('score');
        });
    }

    public function down(): void
    {
        Schema::table('pitches', function (Blueprint $table) {
            $table->dropColumn(['score', 'methodology_version']);
        });

        Schema::table('pitches', function (Blueprint $table) {
            $table->string('media_type')->default('audio');
        });

        Schema::table('pitches', function (Blueprint $table) {
            $table->renameColumn('audio_path', 'video_path');
        });
    }
};
