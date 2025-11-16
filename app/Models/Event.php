<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\SoftDeletes; // Disabled - table doesn't have deleted_at column
use Illuminate\Support\Facades\Storage;

class Event extends Model
{
    use HasFactory; // SoftDeletes removed - table doesn't have deleted_at column

    protected $fillable = [
        'title',
        'description',
        'event_date',
        'start_time',
        'end_time',
        'location',
        'category',
        'is_published',
        'is_free',
        'price',
        'max_participants',
        'organizer',
        'flyer_path',
        'certificate_template_path',
        'created_by',
    ];

    protected $casts = [
        'event_date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'is_published' => 'boolean',
        'is_free' => 'boolean',
        'price' => 'decimal:2',
    ];

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

    public function creator()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    // Accessors
    public function getFlyerUrlAttribute()
    {
        // Check flyer_path first, then image_path (for old DB compatibility)
        $path = $this->flyer_path ?? $this->image_path ?? null;
        
        if (!$path) {
            return null;
        }

        // If it's already a full URL (like unsplash), return null to use fallback
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            // Skip unsplash URLs - we want to use local files instead
            if (strpos($path, 'unsplash.com') !== false || strpos($path, 'unsplash') !== false) {
                return null;
            }
            return $path;
        }

        // Return full URL using asset() with request scheme/host for dynamic port
        if (Storage::disk('public')->exists($path)) {
            // Force HTTPS in production, use request scheme in development
            $baseUrl = request() ? request()->getSchemeAndHttpHost() : (config('app.url') ?: url('/'));
            // Force HTTPS if not local
            if (app()->environment('production') && !str_contains($baseUrl, 'localhost') && !str_contains($baseUrl, '127.0.0.1')) {
                $baseUrl = str_replace('http://', 'https://', $baseUrl);
            }
            return rtrim($baseUrl, '/') . '/storage/' . ltrim($path, '/');
        }

        return null;
    }
    
    public function getImageUrlAttribute()
    {
        // Alias for flyer_url
        return $this->flyer_url;
    }

    public function getCertificateTemplateUrlAttribute()
    {
        if (!$this->certificate_template_path) {
            return null;
        }

        if (Storage::disk('public')->exists($this->certificate_template_path)) {
            return asset('storage/' . $this->certificate_template_path);
        }

        return null;
    }

    // Helper methods
    public function getRegisteredCountAttribute()
    {
        try {
            // Table name is 'registrations' not 'event_registrations' in Railway DB
            // Check if registrations table exists
            if (!\Schema::hasTable('registrations')) {
                return 0; // Return 0 if table doesn't exist
            }
            return $this->registrations()->where('status', '!=', 'cancelled')->count();
        } catch (\Exception $e) {
            // Gracefully handle any errors (table doesn't exist, connection issues, etc.)
            \Log::warning('Error getting registered count for event ' . $this->id . ': ' . $e->getMessage());
            return 0;
        }
    }

    public function isFull()
    {
        if (!$this->max_participants) {
            return false;
        }

        return $this->registered_count >= $this->max_participants;
    }

    public function canRegister()
    {
        return $this->is_published && !$this->isFull();
    }
}
