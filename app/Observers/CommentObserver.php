<?php

namespace App\Observers;

use App\Models\Comment;
use App\Models\Galery;

class CommentObserver
{
    public function created(Comment $comment): void
    {
        if ($comment->galery_id) {
            Galery::where('id', $comment->galery_id)->increment('total_comments');
        }
    }

    public function deleted(Comment $comment): void
    {
        if ($comment->galery_id) {
            Galery::where('id', $comment->galery_id)->where('total_comments', '>', 0)->decrement('total_comments');
        }
    }
}
