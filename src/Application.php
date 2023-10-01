<?php

namespace App;

use Illuminate\Filesystem\Filesystem;
use App\Bootstrap\{LoadConfiguration,Database,Twig};
use Illuminate\Container\Container;
use Illuminate\Events\Dispatcher;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Facade;

class Application extends Container
{
    public string $basePath;
    public bool $hasBeenBootstrapped = false;
    public array $bootstrappers = [
        LoadConfiguration::class,
        Database::class,
        Twig::class
    ];

    public function __construct(string $basePath = null) {
        Facade::setFacadeApplication($this);

        $this->basePath = $basePath;
        $this->registerBaseBindings();
        $this->bootstrapWith($this->bootstrappers);
    }

    public function registerBaseBindings(): void {
        static::setInstance($this);

        $this->instance('app', $this);
        $this->instance(Container::class, $this);

        $this->singleton('events', fn() => new Dispatcher());

        // Routing
        $this->singleton('router', function($app) {
            return new Router($app['events'], $app);
        });

        $this->singleton('files', function() {
            return new Filesystem();
        });
    }

    public function bootstrapWith(array $bootstrappers): void {
        foreach($bootstrappers as $bootstrapper) {
            $this->make($bootstrapper)->bootstrap($this);
        }

        $this->hasBeenBootstrapped = true;
    }

    public function configPath(string $path = ''): string
    {
        return $this->joinPaths($this->basePath('config'), $path);
    }

    public function basePath(string $path = ''): string
    {
        return $this->joinPaths($this->basePath, $path);
    }

    /**
     * Join the given paths together.
     *
     * @param string $basePath
     * @param string $path
     * @return string
     */
    public function joinPaths(string $basePath, string $path = '')
    {
        return $basePath.($path != '' ? DIRECTORY_SEPARATOR.ltrim($path, DIRECTORY_SEPARATOR) : '');
    }
}
