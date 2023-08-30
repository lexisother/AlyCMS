<?php
require __DIR__ . "/vendor/autoload.php";

use Illuminate\Container\Container;
use Illuminate\Events\Dispatcher;
use Illuminate\Http\Request;
use Illuminate\Routing\Router;

$app = app();
$events = new Dispatcher();
$request = Request::capture();
$app->instance('Illuminate\Http\Request', $request);
$app->singleton('Illuminate\Routing\Contracts\CallableDispatcher', function() use ($app) {
    return new Illuminate\Routing\CallableDispatcher($app);
});

$router = new Router($events, $app);
require_once 'routes.php';
$response = $router->dispatch($request);
$response->send();
