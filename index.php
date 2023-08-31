<?php
require __DIR__ . "/vendor/autoload.php";

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Http\Request;
use Illuminate\Routing\Router;

// Initial variables we're working with
$app = app();
$events = new Dispatcher();
$request = Request::capture();

// Load the config file, note that if no environment variables OR .env file is
// present, the database connection will fail.
(Dotenv::createImmutable(__DIR__))->safeLoad();

// Some useful bindings
$app->instance('dispatcher', $events);
$app->instance('Illuminate\Http\Request', $request);
$app->singleton('Illuminate\Routing\Contracts\CallableDispatcher', function() use ($app) {
    return new Illuminate\Routing\CallableDispatcher($app);
});

// Database stuff
$capsule = new Capsule();
$capsule->addConnection([
    'driver' => 'pgsql',
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'database' => $_ENV['DB_NAME'] ?? 'alycms',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? 'root',
    'charset' => 'utf8',
    'collation' => 'utf8_unicode_ci',
]);
$capsule->setEventDispatcher($events);
$capsule->setAsGlobal();

$Schema = $capsule->schema();
require_once 'tables.php';
$capsule->bootEloquent();

// Router stuff
$router = new Router($events, $app);
require_once 'routes.php';
$response = $router->dispatch($request);
$response->send();
