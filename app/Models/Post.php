<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $table = 'posts';
    protected $fillable = ['judul', 'kategori_id', 'isi', 'petugas_id', 'status'];

    public function kategori()
    {
        return $this->belongsTo(Kategori::class);
    }

    public function kategoris()
    {
        return $this->belongsToMany(Kategori::class, 'kategori_post');
    }

    public function petugas()
    {
        return $this->belongsTo(Petugas::class);
    }

    public function galeries()
    {
        return $this->hasMany(Galery::class);
    }
}
