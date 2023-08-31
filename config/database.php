<?php

return [
    'default' => 'pgsql',
    'connections' => [
        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DATABASE_URL'),
            'host' => $_ENV['DB_HOST'] ?: 'localhost',
            'port' => env('DB_PORT', '5432'),
            'database' => $_ENV['DB_NAME'] ?: 'alycms',
            'username' => $_ENV['DB_USER'] ?: 'root',
            'password' => $_ENV['DB_PASS'] ?: 'root',
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ]
    ]
];
