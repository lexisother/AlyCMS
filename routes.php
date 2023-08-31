<?php

use Illuminate\Routing\Router;
use Logto\Sdk\LogtoClient;
use Logto\Sdk\LogtoConfig;

/** @var Router $router */

$client = new LogtoClient(
    new LogtoConfig(
        endpoint: "https://auth.fyralabs.com",
        appId: "57lcee92bwg727ezooxdj",
        appSecret: getenv('LOGTO_APP_SECRET', true),
    )
);

$router->get('/', function() {
   echo file_get_contents("views/index.html");
});
$router->get('/cms', function() use ($client) {
    if (!$client->isAuthenticated()) {
        header('Location: /sign-in');
    }
    echo file_get_contents("views/cms.html");
});

$router->get('/sign-in', function() use ($client) {
    header("Location: {$client->signIn("https://{$_SERVER["SERVER_NAME"]}/callback")}");
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
