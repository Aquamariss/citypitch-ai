<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Необязательный контакт в Telegram или MAX: ник, ссылка или номер —
     * в свободной форме.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('messenger')->nullable()->after('city');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('messenger');
        });
    }
};
