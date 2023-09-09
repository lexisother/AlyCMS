<?php

use Illuminate\Container\Container;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * @param $abstract
 * @param array $parameters
 * @return Closure|Container|mixed|object|null
 */
function app($abstract = null, array $parameters = [])
{
    if (is_null($abstract)) {
        return Container::getInstance();
    }

    try {
        return Container::getInstance()->make($abstract, $parameters);
    } catch (BindingResolutionException $e) {
        die("Something went horribly wrong while making an instance of the container.");
    }
}

/**
 * @throws FileNotFoundException
 */
function view($name, $variables = [])
{
    $name = Str::replace('.', '/', $name);
    $path = app()->joinPaths(app()->basePath('views'), $name);

    if (File::exists($path . '.html')) {
        return File::get($path . '.html');
    }
    if (File::exists($path . '.twig')) {
        return (app()['twig']->load($name . '.twig'))->render($variables);
    }

    throw new FileNotFoundException("Neither a .html or a .twig file was found at $path.");
}
