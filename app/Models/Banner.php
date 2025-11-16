<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\SoftDeletes; // Disabled - table doesn't have deleted_at column
use Illuminate\Support\Facades\Storage;

class Banner extends Model
{
    use HasFactory; // SoftDeletes removed - table doesn't have deleted_at column

    protected $fillable = [
        'title',
        'description',
        'image_path',
        'link_url',
        'order',
        'is_active',
        // Removed start_date and end_date - columns don't exist in Railway database
    ];

    protected $casts = [
        'is_active' => 'boolean',
        // Removed start_date and end_date casts - columns don't exist in Railway database
    ];

    // Accessors
    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return null;
        }

        // Return full URL with request scheme/host for dynamic port
        if (Storage::disk('public')->exists($this->image_path)) {
            // Force HTTPS in production, use request scheme in development
            $baseUrl = request() ? request()->getSchemeAndHttpHost() : (config('app.url') ?: url('/'));
            // Force HTTPS if not local
            if (app()->environment('production') && !str_contains($baseUrl, 'localhost') && !str_contains($baseUrl, '127.0.0.1')) {
                $baseUrl = str_replace('http://', 'https://', $baseUrl);
            }
            return rtrim($baseUrl, '/') . '/storage/' . ltrim($this->image_path, '/');
        }

        return null;
    }
    
    // Get link_url (support both link_url and button_link from old DB)
    public function getLinkUrlAttribute()
    {
        return $this->attributes['link_url'] ?? $this->attributes['button_link'] ?? null;
    }
}
