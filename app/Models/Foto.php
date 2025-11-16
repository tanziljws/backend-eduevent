<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Foto extends Model
{
    use HasFactory;

    protected $table = 'foto';
    protected $fillable = ['galery_id', 'file'];

    public function galery()
    {
        return $this->belongsTo(Galery::class);
    }

    /**
     * Get the URL for the foto file (with proper URL encoding)
     */
    public function getUrlAttribute()
    {
        if (!$this->file) {
            return null;
        }

        // Check if file exists in storage
        if (Storage::disk('public')->exists($this->file)) {
            // Get base URL (APP_URL + /storage)
            $baseUrl = rtrim(config('app.url'), '/') . '/storage';
            
            // Get path parts
            $pathParts = explode('/', $this->file);
            $directory = implode('/', array_slice($pathParts, 0, -1));
            $filename = end($pathParts);
            
            // URL encode only the filename (spaces and special chars need encoding)
            $encodedFilename = rawurlencode($filename);
            
            // Build URL with encoded filename
            if ($directory) {
                return $baseUrl . '/' . $directory . '/' . $encodedFilename;
            }
            
            return $baseUrl . '/' . $encodedFilename;
        }

        // Fallback to Storage::url with encoding
        $url = Storage::url($this->file);
        
        // Parse and encode the URL properly
        $parsedUrl = parse_url($url);
        if (isset($parsedUrl['path'])) {
            $pathParts = explode('/', trim($parsedUrl['path'], '/'));
            $filename = end($pathParts);
            $directoryParts = array_slice($pathParts, 0, -1);
            
            // URL encode only the filename
            $encodedFilename = rawurlencode($filename);
            
            $scheme = ($parsedUrl['scheme'] ?? '') . '://';
            $host = $parsedUrl['host'] ?? '';
            $directory = !empty($directoryParts) ? '/' . implode('/', $directoryParts) : '';
            
            return $scheme . $host . $directory . '/' . $encodedFilename;
        }

        return $url;
    }
}
