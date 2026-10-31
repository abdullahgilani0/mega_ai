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
        Schema::table('users', function (Blueprint $table) {
            $table->string('last_login_ip', 45)->nullable()->after('avatar_seed');
            $table->text('last_login_user_agent')->nullable()->after('last_login_ip');
            $table->dateTime('last_login_at')->nullable()->after('last_login_user_agent');
        });

        Schema::create('platform_settings', function (Blueprint $table) {
            $table->string('key', 64)->primary();
            $table->json('value');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('action', 32)->index();
            $table->string('subject_type', 64)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('payload');
            $table->string('reason');
            $table->string('status', 16)->default('pending')->index();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('decided_at')->nullable();
            $table->string('decision_note')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('access_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('reason');
            $table->boolean('break_glass')->default(false);
            $table->dateTime('expires_at');
            $table->dateTime('revoked_at')->nullable();
            $table->dateTime('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'application_id']);
        });

        Schema::create('data_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16);
            $table->string('status', 16)->default('open')->index();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('handled_at')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('lender_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lender_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 24);
            $table->string('title');
            $table->string('storage_path');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->unsignedInteger('version');
            $table->date('effective_from');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('golden_scenarios', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('loan_pack', 16)->index();
            $table->json('scenario');
            $table->json('expectations');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->dateTime('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('co_borrowers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email');
            $table->dateTime('accepted_at')->nullable();
            $table->timestamps();

            $table->unique(['application_id', 'email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('co_borrowers');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('golden_scenarios');
        Schema::dropIfExists('lender_documents');
        Schema::dropIfExists('data_requests');
        Schema::dropIfExists('access_grants');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('platform_settings');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['last_login_ip', 'last_login_user_agent', 'last_login_at']);
        });
    }
};
