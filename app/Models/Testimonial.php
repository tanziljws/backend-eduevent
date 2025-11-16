<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    protected $fillable = [
        'nama',
        'email',
        'pesan',
        'status'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Scope untuk testimonial yang sudah disetujui
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    // Scope untuk testimonial yang pending
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // Scope untuk testimonial yang ditolak
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}
