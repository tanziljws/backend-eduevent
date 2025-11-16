<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduled task: Cleanup unverified users daily at 2 AM
Schedule::command('users:cleanup-unverified --hours=24')
    ->dailyAt('02:00')
    ->name('cleanup-unverified-users')
    ->withoutOverlapping();
