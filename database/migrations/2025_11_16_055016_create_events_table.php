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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('event_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->enum('category', ['teknologi', 'seni_budaya', 'olahraga', 'akademik', 'sosial'])->default('teknologi');
            $table->boolean('is_published')->default(false);
            $table->boolean('is_free')->default(true);
            $table->decimal('price', 15, 2)->default(0);
            $table->integer('max_participants')->nullable();
            $table->string('organizer')->nullable();
            $table->string('flyer_path')->nullable();
            $table->string('certificate_template_path')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('admins')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['category', 'is_published']);
            $table->index('event_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
