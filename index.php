<?php
require __DIR__ . "/vendor/autoload.php";

use App\Application;
use Dotenv\Dotenv;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;

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

// Router stuff
// TODO: TURN THESE INTO ITEMS ON THE SERVICE CONTAINER AND REFERENCE THEM IN
// GLOBAL `view` FUNCTION
$loader = new FilesystemLoader($app->joinPaths($app->basePath, 'views'));
$twig = new Environment($loader, [
    'cache' => $app['config']['app.env'] == 'production'
        ? $app->joinPaths($app->basePath, '.cache')
        : false,
]);

require_once 'routes.php';

try {
    $response = $app['router']->dispatch($request);
    $response->send();
} catch (NotFoundHttpException $e) {
    echo "That route doesn't exist.";
}
