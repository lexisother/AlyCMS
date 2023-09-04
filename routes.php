<?php

use App\Models\Post;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Logto\Sdk\LogtoClient;
use Logto\Sdk\LogtoConfig;
use Twig\Environment;

/** @var Environment $twig */

$client = new LogtoClient(
    new LogtoConfig(
        endpoint: "https://auth.fyralabs.com",
        appId: "57lcee92bwg727ezooxdj",
        appSecret: getenv('LOGTO_APP_SECRET', true),
    )
);

Route::get('/', function() use ($twig) {
    $posts = DB::select('select * from posts');
    return view('index.html', ['posts' => $posts]);
});
Route::get('/cms', function() use ($client) {
    if (!$client->isAuthenticated()) {
        header('Location: /sign-in');
    }
    echo file_get_contents("views/cms.html");
});

Route::get('/sign-in', function() use ($client) {
    header("Location: {$client->signIn("https://{$_SERVER["HTTP_HOST"]}/callback")}");
});

Route::get('/callback', function() use ($client) {
  // required because Logto thinks it's a good idea to check for things like
  // PATH_INFO that may not even exist
  $_SERVER['PATH_INFO'] = '/callback';
  // Don't ask. Logto blows.
  $_SERVER['SERVER_NAME'] = $_SERVER['HTTP_HOST'];
  $client->handleSignInCallback();

  $user = $client->fetchUserInfo();
  error_log("PASS!");
  if ($user->sub === "igd4qm8vr5kc") {
      header('Location: /cms');
  } else {
      header('Location: /');
  }
});

Route::get('/api/posts', function() {
    $posts = Post::all()->toArray();
    echo json_encode([
       'posts' => $posts
    ]);
});

Route::get('/api/browse', function() {
    $dir = './' . str_replace( '..', '', $_GET['dir']);
    if($dir[strlen($dir)-1] != '/') {
        $dir .= '/';
    }

    $find = '*.*';
    switch($_GET['type']) {
        case 'markdown':
            $find = '*.md';
            break;
        case 'images':
            $find = '*.{png,gif,jpg,jpeg}';
            break;
    }

    $dirs = glob( $dir.'*', GLOB_ONLYDIR);
    if( $dirs === false ) $dirs = [];

    $files = glob( $dir.$find, GLOB_BRACE);
    if( $files === false ) $files = [];

    $fileRootLength = strlen( './');
    foreach($files as $i => $f) {
        $files[$i] = substr($f, $fileRootLength);
    }
    foreach($dirs as $i => $d) {
        $dirs[$i] = substr($d, $fileRootLength);
    }

    $parent = substr($_GET['dir'], 0, strrpos($_GET['dir'], '/'));
    echo json_encode([
        'parent' => (empty($_GET['dir']) ? false : $parent),
        'dirs' => $dirs,
        'files' => $files
    ]);
});
