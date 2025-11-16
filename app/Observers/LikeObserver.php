<?php

namespace App\Observers;

use App\Models\Like;
use App\Models\Galery;

class LikeObserver
{
    public function created(Like $like): void
    {
        if ($like->galery_id) {
            Galery::where('id', $like->galery_id)->increment('total_likes');
        }
    }

    public function deleted(Like $like): void
    {
        if ($like->galery_id) {
            Galery::where('id', $like->galery_id)->where('total_likes', '>', 0)->decrement('total_likes');
        }
    }
}
