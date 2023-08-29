<?php
require __DIR__ . "/vendor/autoload.php";

use Bramus\Router\Router;
use Logto\Sdk\LogtoClient;
use Logto\Sdk\LogtoConfig;
use Logto\Sdk\LogtoException;

$router = new Router();
$client = new LogtoClient(
  new LogtoConfig(
    endpoint: "https://auth.fyralabs.com",
    appId: "eewbfi2u6pziz9cu46bat",
    appSecret: "XXX",
  )
);

$router->get('/sign-in', function() use ($router, $client) {
    header("Location: " . $client->signIn("http://localhost:8080/callback"));
});

$router->get('/callback', function () use ($client) {
  try {
    $client->handleSignInCallback();
  } catch (LogtoException $exception) {
    return $exception;
  }
  header("Location: /"); // Redirect the user to the home page after a successful sign-in
});

$router->get('/', function () use ($client) {
  if ($client->isAuthenticated() === false) {
    echo "Not authenticated <a href='/sign-in'>Sign in</a>";
  }

  echo (
    // Get local ID token claims
    var_dump($client->getIdTokenClaims())
    . "<br>" .
    // Fetch user info from Logto userinfo endpoint
    var_dump($client->fetchUserInfo())
    . "</pre><br><a href='/sign-out'>Sign out</a>"
  );
});

$router->run();
