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
        Schema::create('territories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('state', 3)->index();
            $table->json('postcodes');
            $table->timestamps();
        });

        Schema::create('brokers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('licence_ref', 32);
            $table->string('business_name')->nullable();
            $table->json('loan_packs');
            $table->json('skills');
            $table->json('languages');
            $table->unsignedSmallInteger('capacity')->default(10);
            $table->string('status', 16)->default('active')->index();
            $table->decimal('acceptance_rate', 4, 3)->default(0.8);
            $table->unsignedInteger('avg_first_contact_minutes')->default(30);
            $table->decimal('conversion_rate', 4, 3)->default(0.5);
            $table->timestamp('last_allocated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('broker_territory', function (Blueprint $table) {
            $table->foreignId('broker_id')->constrained()->cascadeOnDelete();
            $table->foreignId('territory_id')->constrained()->cascadeOnDelete();
            $table->string('coverage', 16)->default('primary');

            $table->primary(['broker_id', 'territory_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broker_territory');
        Schema::dropIfExists('brokers');
        Schema::dropIfExists('territories');
    }
};
