<?php
require __DIR__ . "/vendor/autoload.php";

use Bramus\Router\Router;
use Logto\Sdk\LogtoClient;
use Logto\Sdk\LogtoConfig;

$router = new Router();
$client = new LogtoClient(
  new LogtoConfig(
    endpoint: "https://auth.fyralabs.com",
    appId: "eewbfi2u6pziz9cu46bat",
  )
);

$router->get('/', function() {
   echo file_get_contents("views/index.html");
});
$router->get('/cms', function() use ($client) {
    if (!$client->isAuthenticated()) {
        header('Location: /');
    }
    echo file_get_contents("views/cms.html");
});

$router->get('/sign-in', function() use ($client) {
    header("Location: {$client->signIn("https://{$_SERVER["HTTP_HOST"]}/callback")}");
});

$router->get('/callback', function() use ($client) {
  // required because Logto thinks it's a good idea to check for things like
  // PATH_INFO that may not even exist
  $_SERVER['PATH_INFO'] = '/callback';
  $client->handleSignInCallback();

  $user = $client->fetchUserInfo();
  if ($user->sub === "igd4qm8vr5kc") {
      header('Location: /cms');
  } else {
      header('Location: /');
  }
});

$router->run();
