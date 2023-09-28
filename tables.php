<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

$app = app();
$migrationTable = $app['config']['database.migrations'];

// Required, migrator can't migrate itself of course.
if (!Schema::hasTable($migrationTable)) {
    Schema::create($migrationTable, function (Blueprint $table) {
        // The migrations table is responsible for keeping track of which of the
        // migrations have actually run for the application. We'll create the
        // table to hold the migration file's path as well as the batch ID.
        $table->increments('id');
        $table->string('migration');
        $table->integer('batch');
    });
}

// Kickoff!
$migrator = $app['migrator'];
$migrator->run($migrator->paths());
