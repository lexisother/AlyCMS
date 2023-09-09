<?php

namespace App\Bootstrap;

use App\Application;
use Twig\Environment;
use Twig\Extension\DebugExtension;
use Twig\Loader\FilesystemLoader;

class Twig {
    public function bootstrap(Application $app) {
        $app->singleton('twig', function($app) {
            $loader = new FilesystemLoader($app->joinPaths($app->basePath, 'views'));
            $env = new Environment($loader, [
                'debug' => $app['config']['app.env'] != 'production',
                'cache' => $app['config']['app.env'] == 'production'
                    ? $app->joinPaths($app->basePath, '.cache')
                    : false,
            ]);

            $env->addExtension(new DebugExtension());

            return $env;
        });
    }
}
