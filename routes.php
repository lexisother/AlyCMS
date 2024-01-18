<?php

use App\Models\{Post, Setting};
use App\Settings\SettingManager;
use Delight\Auth\Auth;
use Delight\Auth\InvalidEmailException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

$auth = app(Auth::class);

// TODO: Investigate setting the namespace globally
Route::group(['namespace' => 'App\Controllers'], function () use ($auth) {
    Route::get('/', function () {
        $posts = DB::select('select * from posts');
        return view('index', ['posts' => $posts]);
    });
    Route::get('/posts/{id}', function (Request $request, int $id) {
        $post = Post::where('id', $id);
        if ($post->exists()) {
            return view('post', ['post' => $post->first()]);
        }
        return view('_errors/404');
    });

    Route::get('/cms', function () use ($auth) {
        if (!$auth->isLoggedIn()) {
            header("Location: /sign-in");
        }
        echo file_get_contents("views/cms.html");
    });

    Route::get('/sign-in', function () use ($auth) {
        // jfc.
        if ((!isset($_SERVER['PHP_AUTH_USER']) || empty($_SERVER['PHP_AUTH_USER'])) ||
            (!isset($_SERVER['PHP_AUTH_PW']) || empty($_SERVER['PHP_AUTH_PW']))
        ) {

            header('WWW-Authenticate: Basic realm="AlyCMS"');
            header("HTTP/2.0 401 Unauthorized");
            die("auth failed!");
        }

        try {
            $auth->login($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'], null);
        } catch (InvalidEmailException $e) {
            header("Location: /");
        }

        if ($auth->isLoggedIn()) {
            header("Location: /cms");
        } else {
            header("Location: /");
        }
    });

    Route::get('/api/posts', function () {
        $posts = Post::all()->toArray();
        echo json_encode([
            'posts' => $posts
        ]);
    });
    Route::patch('/api/posts/{id}', 'PostController@handlePost');

    Route::get('/api/settings', function () {
        return Setting::all();
    });
    Route::patch('/api/settings', function (Request $request) {
        $data = $request->all();
        array_walk($data, function ($value, $key) {
            SettingManager::set($key, json_encode($value));
        });
    });

    Route::get('/api/browse', function () {
        $dir = './' . str_replace('..', '', $_GET['dir']);
        if ($dir[strlen($dir) - 1] != '/') {
            $dir .= '/';
        }

        $find = '*.*';
        switch ($_GET['type']) {
            case 'markdown':
                $find = '*.md';
                break;
            case 'images':
                $find = '*.{png,gif,jpg,jpeg}';
                break;
        }

        $dirs = glob($dir . '*', GLOB_ONLYDIR);
        if ($dirs === false) $dirs = [];

        $files = glob($dir . $find, GLOB_BRACE);
        if ($files === false) $files = [];

        $fileRootLength = strlen('./');
        foreach ($files as $i => $f) {
            $files[$i] = substr($f, $fileRootLength);
        }
        foreach ($dirs as $i => $d) {
            $dirs[$i] = substr($d, $fileRootLength);
        }

        $parent = substr($_GET['dir'], 0, strrpos($_GET['dir'], '/'));
        echo json_encode([
            'parent' => (empty($_GET['dir']) ? false : $parent),
            'dirs' => $dirs,
            'files' => $files
        ]);
    });
});
