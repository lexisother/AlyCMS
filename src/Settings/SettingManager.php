<?php

namespace App\Settings;

use App\Models\Setting;

class SettingManager {
    public static function get($key) {
        return Setting::where('key', $key)->first()->value;
    }
    public static function set($key, $value) {
        $setting = Setting::where('key', $key)->firstOr(function() use ($key) {
            return new Setting(['key' => $key]);
        });
        $setting->value = $value;
        $setting->save();
    }
}
