<?php

namespace App\Bootstrap;

use App\Application;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;

class Twig {
    public function bootstrap(Application $app) {
        $app->singleton('twig', function($app) {
            $loader = new FilesystemLoader($app->joinPaths($app->basePath, 'views'));
            return new Environment($loader, [
                'cache' => $app['config']['app.env'] == 'production'
                    ? $app->joinPaths($app->basePath, '.cache')
                    : false,
            ]);
        });
    }
}
