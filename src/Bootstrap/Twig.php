<?php

namespace App\Bootstrap;

use App\Application;
use League\CommonMark\GithubFlavoredMarkdownConverter;
use Twig\Environment;
use Twig\Extra\Markdown\{MarkdownExtension,MarkdownInterface,MarkdownRuntime};
use Twig\Extension\DebugExtension;
use Twig\Loader\FilesystemLoader;
use Twig\RuntimeLoader\RuntimeLoaderInterface;

// Twig's Markdown package doesn't support enabling GFM when using League's package, so we'll have to wrap that ourselves.
class GFM implements MarkdownInterface
{
    private GithubFlavoredMarkdownConverter $converter;

    public function __construct()
    {
        $this->converter = new GithubFlavoredMarkdownConverter();
    }

    public function convert(string $body): string
    {
        return $this->converter->convert($body);
    }
}

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
            $env->addExtension(new MarkdownExtension());
            $env->addRuntimeLoader(new class implements RuntimeLoaderInterface {
                public function load($class) {
                    if (MarkdownRuntime::class === $class) {
                        return new MarkdownRuntime(new GFM());
                    }
                }
            });

            return $env;
        });
    }
}
