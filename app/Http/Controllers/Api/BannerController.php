<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BannerController extends Controller
{
    /**
     * Get all banners
     */
    public function index(Request $request)
    {
        // If admin, return all banners (including inactive)
        $query = Banner::query();
        
        // If not admin, only return active banners
        if (!$request->user() || !($request->user() instanceof \App\Models\Admin)) {
            $query->where('is_active', true)
                ->where(function($q) {
                    $q->whereNull('start_date')
                        ->orWhere('start_date', '<=', now());
                })
                ->where(function($q) {
                    $q->whereNull('end_date')
                        ->orWhere('end_date', '>=', now());
                });
        }
        
        $banners = $query->orderBy('order', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $banners->map(function ($banner) {
                return [
                    'id' => $banner->id,
                    'title' => $banner->title ?? '',
                    'description' => $banner->description ?? '',
                    'image_url' => $banner->image_url, // Full URL via asset()
                    'image_path' => $banner->image_path,
                    'link_url' => $banner->link_url ?? $banner->button_link ?? null,
                    'button_text' => $banner->button_text ?? null,
                    'button_link' => $banner->button_link ?? null,
                    'order' => $banner->order ?? 0,
                    'is_active' => $banner->is_active ?? true,
                ];
            }),
        ]);
    }

    /**
     * Store new banner
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'link_url' => 'nullable|url|max:255',
            'order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $data = $request->except(['image']);
        $data['is_active'] = $request->boolean('is_active', true);
        $data['order'] = $request->get('order', 0);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
            $data['image_path'] = $path;
        }

        $banner = Banner::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil dibuat.',
            'banner' => $banner,
        ], 201);
    }

    /**
     * Update banner
     */
    public function update(Request $request, $id)
    {
        $banner = Banner::findOrFail($id);

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'link_url' => 'nullable|url|max:255',
            'order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $data = $request->except(['image']);

        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        if ($request->hasFile('image')) {
            // Delete old image
            if ($banner->image_path) {
                Storage::disk('public')->delete($banner->image_path);
            }
            $path = $request->file('image')->store('banners', 'public');
            $data['image_path'] = $path;
        }

        $banner->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil diupdate.',
            'banner' => $banner,
        ]);
    }

    /**
     * Delete banner
     */
    public function destroy($id)
    {
        $banner = Banner::findOrFail($id);

        // Delete image
        if ($banner->image_path) {
            Storage::disk('public')->delete($banner->image_path);
        }

        $banner->delete();

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil dihapus.',
        ]);
    }

    /**
     * Toggle banner active status
     */
    public function toggle($id)
    {
        $banner = Banner::findOrFail($id);
        $banner->update([
            'is_active' => !$banner->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => $banner->is_active ? 'Banner diaktifkan.' : 'Banner dinonaktifkan.',
            'is_active' => $banner->is_active,
        ]);
    }
}
