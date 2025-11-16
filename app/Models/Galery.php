<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Like;
use App\Models\Bookmark;
use App\Models\Comment;
use App\Models\Download;

class Galery extends Model
{
    use HasFactory;

    protected $table = 'galery';
    protected $fillable = ['judul', 'post_id', 'position', 'status', 'total_likes', 'total_comments', 'total_bookmarks', 'total_downloads'];
    
    protected $casts = [
        'total_likes' => 'integer',
        'total_comments' => 'integer',
        'total_bookmarks' => 'integer',
        'total_downloads' => 'integer',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function fotos()
    {
        return $this->hasMany(Foto::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function downloads()
    {
        return $this->hasMany(Download::class);
    }
}
