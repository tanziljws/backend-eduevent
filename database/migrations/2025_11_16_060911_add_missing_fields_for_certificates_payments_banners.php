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
        // Add missing fields to certificates table
        Schema::table('certificates', function (Blueprint $table) {
            if (!Schema::hasColumn('certificates', 'serial_number')) {
                $table->string('serial_number')->nullable()->after('registration_id');
            }
            if (!Schema::hasColumn('certificates', 'issued_at')) {
                $table->timestamp('issued_at')->nullable()->after('file_path');
            }
            // Map issue_date to issued_at if exists
            if (Schema::hasColumn('certificates', 'issue_date') && !Schema::hasColumn('certificates', 'issued_at')) {
                // Will be handled by data migration
            }
        });

        // Add missing fields to payments table
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'midtrans_order_id')) {
                $table->string('midtrans_order_id')->nullable()->after('registration_id');
            }
            if (!Schema::hasColumn('payments', 'midtrans_transaction_id')) {
                $table->string('midtrans_transaction_id')->nullable()->after('midtrans_order_id');
            }
            if (!Schema::hasColumn('payments', 'midtrans_response')) {
                $table->json('midtrans_response')->nullable()->after('payment_method');
            }
            // Map existing fields if needed
            if (Schema::hasColumn('payments', 'order_id') && !Schema::hasColumn('payments', 'midtrans_order_id')) {
                // Will copy data in import
            }
            if (Schema::hasColumn('payments', 'transaction_id') && !Schema::hasColumn('payments', 'midtrans_transaction_id')) {
                // Will copy data in import
            }
        });

        // Add missing fields to banners table
        Schema::table('banners', function (Blueprint $table) {
            if (!Schema::hasColumn('banners', 'button_text')) {
                $table->string('button_text')->nullable()->after('description');
            }
            if (!Schema::hasColumn('banners', 'button_link')) {
                $table->string('button_link')->nullable()->after('button_text');
            }
            // Map link to button_link if exists
            if (Schema::hasColumn('banners', 'link') && !Schema::hasColumn('banners', 'button_link')) {
                // Will copy data in import
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            if (Schema::hasColumn('certificates', 'serial_number')) {
                $table->dropColumn('serial_number');
            }
            if (Schema::hasColumn('certificates', 'issued_at')) {
                $table->dropColumn('issued_at');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'midtrans_order_id')) {
                $table->dropColumn('midtrans_order_id');
            }
            if (Schema::hasColumn('payments', 'midtrans_transaction_id')) {
                $table->dropColumn('midtrans_transaction_id');
            }
            if (Schema::hasColumn('payments', 'midtrans_response')) {
                $table->dropColumn('midtrans_response');
            }
        });

        Schema::table('banners', function (Blueprint $table) {
            if (Schema::hasColumn('banners', 'button_text')) {
                $table->dropColumn('button_text');
            }
            if (Schema::hasColumn('banners', 'button_link')) {
                $table->dropColumn('button_link');
            }
        });
    }
};
