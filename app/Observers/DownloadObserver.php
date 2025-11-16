<?php

namespace App\Observers;

use App\Models\Download;
use App\Models\Galery;

class DownloadObserver
{
    public function created(Download $download): void
    {
        if ($download->galery_id) {
            Galery::where('id', $download->galery_id)->increment('total_downloads');
        }
    }

    public function deleted(Download $download): void
    {
        if ($download->galery_id) {
            Galery::where('id', $download->galery_id)->where('total_downloads', '>', 0)->decrement('total_downloads');
        }
    }
}
