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
        // Add missing fields to events table
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'image_path')) {
                $table->string('image_path')->nullable()->after('flyer_path');
            }
            if (!Schema::hasColumn('events', 'registration_closes_at')) {
                $table->timestamp('registration_closes_at')->nullable()->after('is_published');
            }
            if (!Schema::hasColumn('events', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Add missing fields to event_registrations table
        Schema::table('event_registrations', function (Blueprint $table) {
            if (!Schema::hasColumn('event_registrations', 'name')) {
                $table->string('name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('event_registrations', 'email')) {
                $table->string('email')->nullable()->after('name');
            }
            if (!Schema::hasColumn('event_registrations', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (!Schema::hasColumn('event_registrations', 'motivation')) {
                $table->text('motivation')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('event_registrations', 'token_hash')) {
                $table->string('token_hash')->nullable()->after('motivation');
            }
            if (!Schema::hasColumn('event_registrations', 'token_plain')) {
                $table->string('token_plain', 10)->nullable()->after('token_hash');
            }
            if (!Schema::hasColumn('event_registrations', 'token_sent_at')) {
                $table->timestamp('token_sent_at')->nullable()->after('token_plain');
            }
            if (!Schema::hasColumn('event_registrations', 'attendance_token')) {
                $table->string('attendance_token', 20)->nullable()->after('status');
            }
            if (!Schema::hasColumn('event_registrations', 'attendance_status')) {
                $table->string('attendance_status')->nullable()->after('attendance_token');
            }
            if (!Schema::hasColumn('event_registrations', 'attended_at')) {
                $table->timestamp('attended_at')->nullable()->after('attendance_status');
            }
        });

        // Add missing fields to attendances table
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'token_entered')) {
                $table->string('token_entered')->nullable()->after('registration_id');
            }
            if (!Schema::hasColumn('attendances', 'attendance_time')) {
                $table->timestamp('attendance_time')->nullable()->after('status');
            }
        });

        // Add missing fields to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'address')) {
                $table->string('address')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'education')) {
                $table->enum('education', ['SD', 'SMP', 'SMA', 'SMK', 'D3', 'S1', 'S2', 'S3'])->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['admin', 'participant'])->default('participant')->after('education');
            }
        });

        // Create registrations table as alias/view or direct table for compatibility
        if (!Schema::hasTable('registrations')) {
            Schema::create('registrations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
                $table->string('name')->nullable();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->text('motivation')->nullable();
                $table->string('token_hash')->nullable();
                $table->string('token_plain', 10)->nullable();
                $table->timestamp('token_sent_at')->nullable();
                $table->enum('status', ['registered', 'cancelled'])->default('registered');
                $table->string('attendance_token', 20)->nullable();
                $table->string('attendance_status')->nullable();
                $table->timestamp('attended_at')->nullable();
                $table->timestamps();
                
                $table->index(['event_id', 'user_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'image_path')) {
                $table->dropColumn('image_path');
            }
            if (Schema::hasColumn('events', 'registration_closes_at')) {
                $table->dropColumn('registration_closes_at');
            }
        });

        Schema::table('event_registrations', function (Blueprint $table) {
            $columns = ['name', 'email', 'phone', 'motivation', 'token_hash', 'token_plain', 'token_sent_at', 'attendance_token', 'attendance_status', 'attended_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('event_registrations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'token_entered')) {
                $table->dropColumn('token_entered');
            }
            if (Schema::hasColumn('attendances', 'attendance_time')) {
                $table->dropColumn('attendance_time');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'address')) {
                $table->dropColumn('address');
            }
            if (Schema::hasColumn('users', 'education')) {
                $table->dropColumn('education');
            }
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });

        if (Schema::hasTable('registrations')) {
            Schema::dropIfExists('registrations');
        }
    }
};
