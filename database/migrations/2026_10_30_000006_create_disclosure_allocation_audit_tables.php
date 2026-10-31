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
        Schema::create('disclosure_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key', 48);
            $table->string('title');
            $table->unsignedInteger('version');
            $table->text('summary');
            $table->longText('body');
            $table->unsignedTinyInteger('position')->default(0);
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique(['key', 'version']);
        });

        Schema::create('signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('disclosure_template_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->longText('rendered_body');
            $table->char('document_hash', 64);
            $table->string('signed_name');
            $table->unsignedInteger('seconds_on_page')->default(0);
            $table->dateTime('acknowledged_at');
            $table->dateTime('signed_at');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('broker_id')->constrained()->cascadeOnDelete();
            $table->string('status', 16)->index();
            $table->decimal('score', 6, 2);
            $table->json('reasons');
            $table->dateTime('offered_at');
            $table->dateTime('expires_at');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 64)->index();
            $table->string('subject_type', 64)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('reason')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();

            $table->index(['subject_type', 'subject_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('allocations');
        Schema::dropIfExists('signatures');
        Schema::dropIfExists('disclosure_templates');
    }
};
