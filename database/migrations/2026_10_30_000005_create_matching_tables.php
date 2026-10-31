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
        Schema::create('match_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->char('scenario_hash', 64)->index();
            $table->json('scenario');
            $table->json('policy_versions');
            $table->unsignedSmallInteger('lenders_total');
            $table->unsignedSmallInteger('lenders_passed')->default(0);
            $table->dateTime('started_at', 6);
            $table->timestamp('completed_at', 6)->nullable();
            $table->timestamps();
        });

        Schema::create('match_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lender_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lender_product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('policy_version_id')->nullable()->constrained()->nullOnDelete();
            $table->string('outcome', 8)->index();
            $table->json('rule_results');
            $table->json('serviceability')->nullable();
            $table->decimal('approval_confidence', 5, 2)->nullable();
            $table->decimal('score', 6, 2)->nullable();
            $table->unsignedTinyInteger('rank')->nullable();
            $table->string('intent', 24)->nullable();
            $table->decimal('rate_min', 5, 2)->nullable();
            $table->decimal('rate_max', 5, 2)->nullable();
            $table->date('rate_effective_from')->nullable();
            $table->json('fees')->nullable();
            $table->text('explanation')->nullable();
            $table->timestamps();
        });

        Schema::create('application_gaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('match_run_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kind', 24);
            $table->string('field', 48)->nullable();
            $table->string('prompt');
            $table->string('status', 16)->default('open')->index();
            $table->unsignedTinyInteger('priority')->default(50);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_gaps');
        Schema::dropIfExists('match_results');
        Schema::dropIfExists('match_runs');
    }
};
