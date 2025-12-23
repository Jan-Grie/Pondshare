<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\UpdateClamavSignatureCache;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

if (config('clamav.enabled')) {
    Schedule::command('clamav:rescan-failed')
        ->hourly()
        ->withoutOverlapping()
        ->onOneServer();

    Schedule::job(new UpdateClamavSignatureCache)
        ->everySixHours()
        ->withoutOverlapping();
}