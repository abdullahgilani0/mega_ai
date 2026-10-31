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
            $table->string('role', 32)->default('borrower')->after('email')->index();
            $table->string('mobile', 20)->nullable()->unique()->after('role');
            $table->timestamp('mobile_verified_at')->nullable()->after('mobile');
            $table->string('status', 16)->default('active')->after('mobile_verified_at');
            $table->unsignedSmallInteger('avatar_seed')->nullable()->after('status');
        });

        Schema::create('mobile_verification_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('mobile', 20);
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->dateTime('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mobile_verification_codes');

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropUnique(['mobile']);
            $table->dropColumn(['role', 'mobile', 'mobile_verified_at', 'status', 'avatar_seed']);
        });
    }
};
