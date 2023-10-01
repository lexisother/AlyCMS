<?php

namespace App\Bootstrap;

use App\Application;
use App\Helper\MastodonAPI;

class Mastodon {
    public function bootstrap(Application $app) {
        $client = new MastodonAPI(env('MASTODON_API_KEY'), env('MASTODON_INSTANCE_URL'));
        $app->instance('App\Helper\MastodonAPI', $client);
    }
}
