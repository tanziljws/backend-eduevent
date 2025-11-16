<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Download extends Model
{
    use HasFactory;

    protected $fillable = ['galery_id', 'user_id', 'ip', 'user_agent'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function galery()
    {
        return $this->belongsTo(Galery::class);
    }
}
