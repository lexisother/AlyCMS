<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

if (!Schema::hasTable('posts')) {
    Schema::create('posts', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->string('content');
        $table->timestamps();
    });
}

if (!Schema::hasTable('settings')) {
    Schema::create('settings', function (Blueprint $table) {
       $table->id();
       $table->string('key')->index();
       $table->text('value')->nullable();
       $table->timestamps();
    });
}
