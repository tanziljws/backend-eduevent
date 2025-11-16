<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'password',
        'is_verified',
        'otp_code',
        'otp_expires_at',
        'profile_photo_path',
        // Note: is_verified, otp_code, otp_expires_at may not exist in all database schemas
        // They are handled conditionally in AuthController
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        $casts = [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
        
        // Only add OTP and is_verified casts if columns exist
        // Use try-catch to handle cases where table doesn't exist yet or during migrations
        try {
            if (Schema::hasColumn('users', 'otp_expires_at')) {
                $casts['otp_expires_at'] = 'datetime';
            }
            if (Schema::hasColumn('users', 'is_verified')) {
                $casts['is_verified'] = 'boolean';
            }
        } catch (\Exception $e) {
            // If schema check fails, just return base casts
            // This can happen during migrations or if table doesn't exist yet
        }
        
        return $casts;
    }

    // Relationships
    public function registrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }
}
