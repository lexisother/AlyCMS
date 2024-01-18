<?php

namespace App\Bootstrap;

use App\Application;

class Auth
{
    public function bootstrap(Application $app)
    {
        $db = $app['db']->getPdo();
        $auth = new \Delight\Auth\Auth($db);
        $app->instance('Delight\Auth\Auth', $auth);
    }
}
