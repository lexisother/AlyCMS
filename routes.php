<?php

use Illuminate\Routing\Router;
use Illuminate\Support\Facades\DB;
use Logto\Sdk\LogtoClient;
use Logto\Sdk\LogtoConfig;
use Twig\Environment;

/** @var Router $router */
/** @var Environment $twig */

$client = new LogtoClient(
    new LogtoConfig(
        endpoint: "https://auth.fyralabs.com",
        appId: "57lcee92bwg727ezooxdj",
        appSecret: getenv('LOGTO_APP_SECRET', true),
    )
);

$router->get('/', function() use ($twig) {
    $posts = DB::select('select * from posts');
    echo ($twig->load('index.html'))->render(['posts' => $posts]);
});
$router->get('/cms', function() use ($client) {
    if (!$client->isAuthenticated()) {
        header('Location: /sign-in');
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
  // Don't ask. Logto blows.
  $_SERVER["SERVER_NAME"] = $_SERVER["HTTP_HOST"];
  $client->handleSignInCallback();

  $user = $client->fetchUserInfo();
  if ($user->sub === "igd4qm8vr5kc") {
      header('Location: /cms');
  } else {
      header('Location: /');
  }
});
