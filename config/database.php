<?php

return [
    'default' => 'pgsql',
    'connections' => [
        'pgsql' => [
            'driver' => 'pgsql',
            'host' => env('DB_HOST', 'localhost'),
            'database' => env('DB_NAME', 'alycms'),
            'username' => env('DB_USER', 'root'),
            'password' => env('DB_PASS', 'root'),
            'charset' => 'utf8',
            'collation' => 'utf8_unicode_ci',
        ]
    ]
];
