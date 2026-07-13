<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pitch_writer_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('blocks');
            $table->timestamps();
        });

        Schema::create('pitch_writer_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('pitch_writer_sessions')->cascadeOnDelete();
            $table->string('role', 20);
            $table->text('content');
            $table->json('draft_patch')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['session_id', 'created_at']);
        });

        Schema::create('pitch_writer_draft_revisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('pitch_writer_sessions')->cascadeOnDelete();
            $table->json('blocks');
            $table->string('source', 20);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pitch_writer_draft_revisions');
        Schema::dropIfExists('pitch_writer_messages');
        Schema::dropIfExists('pitch_writer_sessions');
    }
};
