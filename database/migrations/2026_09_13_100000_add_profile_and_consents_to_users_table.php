<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Анкета участника на входе и согласия.
     *
     * Согласия хранятся отметкой времени: когда пользователь последний раз
     * поставил галку. NULL — согласия нет.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('full_name')->nullable()->after('id');
            $table->string('phone', 32)->nullable()->after('email');
            $table->string('city')->nullable()->after('phone');
            $table->timestamp('personal_data_consent_at')->nullable()->after('email_verified_at');
            $table->timestamp('marketing_consent_at')->nullable()->after('personal_data_consent_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'full_name',
                'phone',
                'city',
                'personal_data_consent_at',
                'marketing_consent_at',
            ]);
        });
    }
};
