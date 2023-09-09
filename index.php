<?php
require __DIR__ . "/vendor/autoload.php";

use App\Application;
use Dotenv\Dotenv;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

header("Cache-Control: no-cache, must-revalidate");
header("Pragma: no-cache");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");

// Load the config file, note that if no environment variables OR .env file is
// present, the database connection will fail.
(Dotenv::createImmutable(__DIR__))->safeLoad();

// Initial variables we're working with
$app = new Application(__DIR__);
$request = Request::capture();

// Some useful bindings (move to Application#__construct?)
$app->instance('Illuminate\Http\Request', $request);
$app->singleton('Illuminate\Routing\Contracts\CallableDispatcher', function ($app) {
    return new Illuminate\Routing\CallableDispatcher($app);
});

require_once 'tables.php';
require_once 'routes.php';

try {
    $response = $app['router']->dispatch($request);
    $response->send();
} catch (NotFoundHttpException $e) {
    echo "That route doesn't exist.";
}
