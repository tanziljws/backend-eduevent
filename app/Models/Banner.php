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
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    // Accessors
    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return null;
        }

        // Return full URL with request scheme/host for dynamic port
        if (Storage::disk('public')->exists($this->image_path)) {
            // Use request()->getSchemeAndHttpHost() if available, otherwise asset()
            $baseUrl = request() ? request()->getSchemeAndHttpHost() : (config('app.url') ?: url('/'));
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
