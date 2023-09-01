<?php

use Illuminate\Container\Container;
use Illuminate\Contracts\Container\BindingResolutionException;

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

function view($name, $variables = [])
{
    return (app()['twig']->load($name))->render($variables);
}
