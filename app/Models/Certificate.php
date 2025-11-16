<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'user_id',
        'registration_id',
        'certificate_path',
        'certificate_number',
        'status',
        'issued_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    // Relationships
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function registration()
    {
        return $this->belongsTo(EventRegistration::class);
    }

    // Accessors
    public function getCertificateUrlAttribute()
    {
        if (!$this->certificate_path) {
            return null;
        }

        if (Storage::disk('public')->exists($this->certificate_path)) {
            return Storage::disk('public')->url($this->certificate_path);
        }

        return null;
    }
}
