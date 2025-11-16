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
        Schema::table('certificates', function (Blueprint $table) {
            // Add file_path field (used by SQL import)
            if (!Schema::hasColumn('certificates', 'file_path')) {
                $table->string('file_path')->nullable()->after('registration_id');
            }
        });

        // Map certificate_path to file_path if certificate_path exists
        if (Schema::hasColumn('certificates', 'certificate_path') && Schema::hasColumn('certificates', 'file_path')) {
            DB::statement('UPDATE certificates SET file_path = certificate_path WHERE file_path IS NULL AND certificate_path IS NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            if (Schema::hasColumn('certificates', 'file_path')) {
                $table->dropColumn('file_path');
            }
        });
    }
};
