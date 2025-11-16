<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('galery', function (Blueprint $table) {
            if (!Schema::hasColumn('galery', 'total_likes')) {
                $table->unsignedInteger('total_likes')->default(0)->after('status');
            }
            if (!Schema::hasColumn('galery', 'total_comments')) {
                $table->unsignedInteger('total_comments')->default(0)->after('total_likes');
            }
            if (!Schema::hasColumn('galery', 'total_bookmarks')) {
                $table->unsignedInteger('total_bookmarks')->default(0)->after('total_comments');
            }
            if (!Schema::hasColumn('galery', 'total_downloads')) {
                $table->unsignedInteger('total_downloads')->default(0)->after('total_bookmarks');
            }
        });
    }

    public function down(): void
    {
        Schema::table('galery', function (Blueprint $table) {
            if (Schema::hasColumn('galery', 'total_likes')) {
                $table->dropColumn('total_likes');
            }
            if (Schema::hasColumn('galery', 'total_comments')) {
                $table->dropColumn('total_comments');
            }
            if (Schema::hasColumn('galery', 'total_bookmarks')) {
                $table->dropColumn('total_bookmarks');
            }
            if (Schema::hasColumn('galery', 'total_downloads')) {
                $table->dropColumn('total_downloads');
            }
        });
    }
};
