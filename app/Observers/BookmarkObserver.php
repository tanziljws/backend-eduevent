<?php

namespace App\Observers;

use App\Models\Bookmark;
use App\Models\Galery;

class BookmarkObserver
{
    public function created(Bookmark $bookmark): void
    {
        if ($bookmark->galery_id) {
            Galery::where('id', $bookmark->galery_id)->increment('total_bookmarks');
        }
    }

    public function deleted(Bookmark $bookmark): void
    {
        if ($bookmark->galery_id) {
            Galery::where('id', $bookmark->galery_id)->where('total_bookmarks', '>', 0)->decrement('total_bookmarks');
        }
    }
}
