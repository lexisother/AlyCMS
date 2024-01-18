<?php

use Delight\Auth\Auth;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations
     */
    public function up(): void
    {
//        Schema::create('users', function (Blueprint $table) {
//            $table->id();
//            $table->string('username');
//            $table->string('email')->unique();
//            $table->string('password');
//            $table->smallInteger('status', false, true)->default('0');
//            $table->smallInteger('verified', false, true)->default('0');
//            $table->smallInteger('resettable', false, true)->default('1');
//            $table->integer('roles_mask', false, true)->default('0');
//            $table->integer('registered');
//            $table->integer('last_login');
//            $table->mediumInteger('force_logout', false, true)->default('0');
//            $table->timestamps();
//        });
//
//        Schema::create('users_confirmations', function (Blueprint $table) {
//            $table->id();
//            $table->integer('user_id');
//            $table->string('email');
//            $table->char('selector', 16)->unique();
//            $table->string('token');
//            $table->integer('expires');
//            $table->timestamps();
//        });
//
//        Schema::create('users_remembered', function (Blueprint $table) {
//            $table->id();
//            $table->integer('user');
//            $table->char('selector', 24)->unique();
//            $table->string('token');
//            $table->integer('expires');
//            $table->timestamps();
//        });
//
//        Schema::create('users_resets', function (Blueprint $table) {
//            $table->id();
//            $table->integer('user');
//            $table->char('selector', 20)->unique();
//            $table->string('token');
//            $table->integer('expires');
//            $table->timestamps();
//        });
//
//        Schema::create('users_throttling', function (Blueprint $table) {
//            $table->char('bucket', 44)->unique();
//            $table->integer('tokens');
//            $table->integer('replenished_at');
//            $table->integer('expires_at');
//        });

        DB::statement(<<<SQL
        CREATE TABLE IF NOT EXISTS "users" (
            "id" SERIAL PRIMARY KEY CHECK ("id" >= 0),
            "email" VARCHAR(249) UNIQUE NOT NULL,
            "password" VARCHAR(255) NOT NULL,
            "username" VARCHAR(100) DEFAULT NULL,
            "status" SMALLINT NOT NULL DEFAULT '0' CHECK ("status" >= 0),
            "verified" SMALLINT NOT NULL DEFAULT '0' CHECK ("verified" >= 0),
            "resettable" SMALLINT NOT NULL DEFAULT '1' CHECK ("resettable" >= 0),
            "roles_mask" INTEGER NOT NULL DEFAULT '0' CHECK ("roles_mask" >= 0),
            "registered" INTEGER NOT NULL CHECK ("registered" >= 0),
            "last_login" INTEGER DEFAULT NULL CHECK ("last_login" >= 0),
            "force_logout" INTEGER NOT NULL DEFAULT '0' CHECK ("force_logout" >= 0)
        );
        SQL
        );

        DB::statement(<<<SQL
        CREATE TABLE IF NOT EXISTS "users_confirmations" (
            "id" SERIAL PRIMARY KEY CHECK ("id" >= 0),
            "user_id" INTEGER NOT NULL CHECK ("user_id" >= 0),
            "email" VARCHAR(249) NOT NULL,
            "selector" VARCHAR(16) UNIQUE NOT NULL,
            "token" VARCHAR(255) NOT NULL,
            "expires" INTEGER NOT NULL CHECK ("expires" >= 0)
        );
        SQL
        );
        DB::statement(<<<SQL
        CREATE INDEX IF NOT EXISTS "email_expires" ON "users_confirmations" ("email", "expires");
        SQL
        );
        DB::statement(<<<SQL
        CREATE INDEX IF NOT EXISTS "user_id" ON "users_confirmations" ("user_id");
        SQL
        );

        DB::statement(<<<SQL
        CREATE TABLE IF NOT EXISTS "users_remembered" (
            "id" BIGSERIAL PRIMARY KEY CHECK ("id" >= 0),
            "user" INTEGER NOT NULL CHECK ("user" >= 0),
            "selector" VARCHAR(24) UNIQUE NOT NULL,
            "token" VARCHAR(255) NOT NULL,
            "expires" INTEGER NOT NULL CHECK ("expires" >= 0)
        );
        SQL
        );
        DB::statement(<<<SQL
        CREATE INDEX IF NOT EXISTS "user" ON "users_remembered" ("user");
        SQL
        );

        DB::statement(<<<SQL
        CREATE TABLE IF NOT EXISTS "users_resets" (
            "id" BIGSERIAL PRIMARY KEY CHECK ("id" >= 0),
            "user" INTEGER NOT NULL CHECK ("user" >= 0),
            "selector" VARCHAR(20) UNIQUE NOT NULL,
            "token" VARCHAR(255) NOT NULL,
            "expires" INTEGER NOT NULL CHECK ("expires" >= 0)
        );
        SQL
        );
        DB::statement(<<<SQL
        CREATE INDEX IF NOT EXISTS "user_expires" ON "users_resets" ("user", "expires");
        SQL
        );

        DB::statement(<<<SQL
        CREATE TABLE IF NOT EXISTS "users_throttling" (
            "bucket" VARCHAR(44) PRIMARY KEY,
            "tokens" REAL NOT NULL CHECK ("tokens" >= 0),
            "replenished_at" INTEGER NOT NULL CHECK ("replenished_at" >= 0),
            "expires_at" INTEGER NOT NULL CHECK ("expires_at" >= 0)
        );
        SQL
        );
        DB::statement(<<<SQL
        CREATE INDEX IF NOT EXISTS "expires_at" ON "users_throttling" ("expires_at");
        SQL
        );

        $auth = app(Auth::class);
        $auth->register(env('ADMIN_EMAIL'), env('ADMIN_PASS'), null, function ($selector, $token) use ($auth) {
            $auth->confirmEmail($selector, $token);
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
