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
        Schema::create('lenders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category', 32);
            $table->string('abn', 14)->nullable();
            $table->string('licence_ref', 32)->nullable();
            $table->string('brand_color', 7)->default('#2D7DFF');
            $table->boolean('logo_usage_approved')->default(false);
            $table->string('status', 16)->default('active')->index();
            $table->unsignedTinyInteger('turnaround_days')->default(5);
            $table->string('coverage', 16)->default('full');
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('lender_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lender_id')->constrained()->cascadeOnDelete();
            $table->string('loan_pack', 16)->index();
            $table->string('name');
            $table->json('features');
            $table->timestamps();
        });

        Schema::create('policy_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lender_id')->constrained()->cascadeOnDelete();
            $table->string('loan_pack', 16);
            $table->unsignedInteger('version');
            $table->json('rules');
            $table->string('status', 16)->default('draft');
            $table->string('source_document')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['lender_id', 'loan_pack', 'version']);
        });

        Schema::create('rate_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lender_product_id')->constrained()->cascadeOnDelete();
            $table->json('rows');
            $table->json('fees');
            $table->date('effective_from');
            $table->date('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rate_sheets');
        Schema::dropIfExists('policy_versions');
        Schema::dropIfExists('lender_products');
        Schema::dropIfExists('lenders');
    }
};
