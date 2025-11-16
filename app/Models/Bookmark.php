<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Bookmark extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'galery_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function galery()
    {
        return $this->belongsTo(Galery::class);
    }
}
