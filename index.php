<?php
require __DIR__ . "/vendor/autoload.php";

use Illuminate\Container\Container;
use Illuminate\Events\Dispatcher;
use Illuminate\Http\Request;
use Illuminate\Routing\Router;

$container = new Container();
$events = new Dispatcher();
$request = Request::capture();
$container->instance('Illuminate\Http\Request', $request);
$container->singleton('Illuminate\Routing\Contracts\CallableDispatcher', function() use ($container) {
    return new Illuminate\Routing\CallableDispatcher($container);
});

$router = new Router($events, $container);
require_once 'routes.php';
$response = $router->dispatch($request);
$response->send();
