<?php
require __DIR__ . "/vendor/autoload.php";

use App\Application;
use App\Models\Post;
use Dotenv\Dotenv;
use Illuminate\Database\Connectors\ConnectionFactory;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Request;
use Illuminate\Routing\Router;
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
$app->singleton('Illuminate\Routing\Contracts\CallableDispatcher', function () use ($app) {
    return new Illuminate\Routing\CallableDispatcher($app);
});
$app->singleton('db.factory', function ($app) {
    return new ConnectionFactory($app);
});
$app->singleton('db', function ($app) {
    return new DatabaseManager($app, $app['db.factory']);
});

$Schema = DB::getSchemaBuilder();
require_once 'tables.php';

// This works!
// var_dump(DB::select('select * from posts'));
// var_dump(Post::all());

// Router stuff
// TODO: TURN THESE INTO ITEMS ON THE SERVICE CONTAINER AND REFERENCE THEM IN
// GLOBAL `view` FUNCTION
$loader = new FilesystemLoader($app->joinPaths($app->basePath, 'views'));
$twig = new Environment($loader, [
    'cache' => $app['config']['app.env'] == 'production'
        ? $app->joinPaths($app->basePath, '.cache')
        : false,
]);
// TODO: MOVE TO Application OR A BOOTSTRAPPER SO WE CAN USE THE FACADE!
$router = new Router($app['dispatcher'], $app);
require_once 'routes.php';

try {
    $response = $router->dispatch($request);
    $response->send();
} catch (NotFoundHttpException $e) {
    echo "That route doesn't exist.";
}
