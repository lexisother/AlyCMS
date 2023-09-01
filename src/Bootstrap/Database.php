<?php

namespace App\Bootstrap;

use App\Application;
use Illuminate\Database\Capsule\Manager as Capsule;

class Database {
    public function bootstrap(Application $app) {
        $capsule = new Capsule();
        // Don't ask me why I have to do this if `config/database.php` already specifies this. The DatabaseManager just
        // completely fails to recognize it.
        $capsule->addConnection([
            'driver' => 'pgsql',
            'host' => env('DB_HOST', 'localhost'),
            'database' => env('DB_NAME', 'alycms'),
            'username' => env('DB_USER', 'root'),
            'password' => env('DB_PASS', 'root'),
            'charset' => 'utf8',
            'collation' => 'utf8_unicode_ci',
        ]);
        $capsule->setEventDispatcher($app['dispatcher']);
        $capsule->setAsGlobal();
        $capsule->bootEloquent();
    }
}