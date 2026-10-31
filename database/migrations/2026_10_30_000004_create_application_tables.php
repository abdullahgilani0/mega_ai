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
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('loan_pack', 16)->index();
            $table->string('purpose');
            $table->unsignedBigInteger('amount');
            $table->unsignedTinyInteger('term_years');
            $table->string('state', 3);
            $table->string('postcode', 4)->index();
            $table->string('employment_type', 32);
            $table->boolean('is_joint')->default(false);
            $table->string('stage', 16)->index();
            $table->string('status', 32)->default('in_progress')->index();
            $table->json('data');
            $table->json('provenance');
            $table->foreignId('broker_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('selected_match_result_id')->nullable();
            $table->timestamp('broker_reviewed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('application_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('type', 64)->index();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('payload')->nullable();
            $table->dateTime('occurred_at', 6);
        });

        Schema::create('consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('application_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->string('text_version', 16);
            $table->dateTime('granted_at');
            $table->timestamp('revoked_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('identity_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('vendor', 32);
            $table->string('document_type', 32);
            $table->string('result', 16)->default('pending');
            $table->string('liveness_result', 16)->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->string('completed_on', 16)->nullable();
            $table->json('evidence')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 32);
            $table->string('original_name');
            $table->string('storage_path');
            $table->char('sha256', 64)->index();
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->string('status', 16)->default('queued');
            $table->unsignedTinyInteger('quality_score')->nullable();
            $table->string('attention_reason')->nullable();
            $table->json('extracted')->nullable();
            $table->timestamps();
        });

        Schema::create('authenticity_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('score');
            $table->json('reason_codes');
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('decision', 24)->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('credit_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('bureau', 32);
            $table->unsignedSmallInteger('score');
            $table->json('summary');
            $table->foreignId('consent_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('advisor_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('role', 16);
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('advisor_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('advisor_message_id')->nullable()->constrained()->nullOnDelete();
            $table->string('field', 48)->nullable();
            $table->string('value')->nullable();
            $table->string('fact');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advisor_notes');
        Schema::dropIfExists('advisor_messages');
        Schema::dropIfExists('credit_reports');
        Schema::dropIfExists('authenticity_reports');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('identity_checks');
        Schema::dropIfExists('consents');
        Schema::dropIfExists('application_events');
        Schema::dropIfExists('applications');
    }
};
