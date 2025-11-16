<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\SoftDeletes; // Disabled - table doesn't have deleted_at column

class EventRegistration extends Model
{
    use HasFactory; // SoftDeletes removed - table doesn't have deleted_at column
    
    // Specify table name if different from model name
    protected $table = 'registrations';

    protected $fillable = [
        'event_id',
        'user_id',
        'status',
        'additional_info',
        'registered_at',
        'confirmed_at',
        'cancelled_at',
        'attendance_token',
        // Old schema fields (from database import)
        'name',
        'email',
        'phone',
        'motivation',
        'token_hash',
        'token_plain',
        'token_sent_at',
        'attendance_status',
        'attended_at',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
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

    public function attendance()
    {
        return $this->hasOne(Attendance::class, 'registration_id');
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class, 'registration_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'registration_id');
    }
}
