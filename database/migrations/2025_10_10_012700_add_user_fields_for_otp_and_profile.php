<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->nullable()->after('name');
            $table->string('phone')->unique()->nullable()->after('email');
            $table->boolean('is_verified')->default(false)->after('email_verified_at');
            $table->string('otp_code')->nullable()->after('is_verified');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            $table->string('profile_photo_path')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username','phone','is_verified','otp_code','otp_expires_at','profile_photo_path']);
        });
    }
};
