<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\Galery;

class UserProfileController extends Controller
{
    /**
     * Show user profile with liked and saved galleries
     */
    public function show()
    {
        // Refresh user data dari database untuk mendapatkan data terbaru
        $user = Auth::guard('user')->user()->fresh();
        
        // Galeri yang di-like oleh user
        $likedGaleries = Galery::whereHas('likes', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('fotos')->latest()->get();
        
        // Galeri yang di-bookmark oleh user
        $savedGaleries = Galery::whereHas('bookmarks', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('fotos')->latest()->get();
        
        return view('user.profile', compact('user', 'likedGaleries', 'savedGaleries'));
    }

    /**
     * Show edit profile form
     */
    public function edit()
    {
        $user = Auth::guard('user')->user();
        return view('user.edit_profile', compact('user'));
    }

    /**
     * Update user profile
     */
    public function update(Request $request)
    {
        try {
            $user = Auth::guard('user')->user();

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'username' => [
                    'required',
                    'string',
                    'max:50',
                    'regex:/^[a-z0-9_]+$/',
                    Rule::unique('users','username')->ignore($user->id)
                ],
                'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            ], [
                'username.regex' => 'Username hanya boleh menggunakan huruf kecil, angka, dan underscore.',
                'username.unique' => 'Username sudah digunakan oleh pengguna lain.',
                'profile_photo.image' => 'File harus berupa gambar.',
                'profile_photo.mimes' => 'Format gambar harus JPG, JPEG, PNG, atau GIF.',
                'profile_photo.max' => 'Ukuran gambar maksimal 5MB.',
            ]);

            // Update data user
            $user->name = $validated['name'];
            $user->username = $validated['username'];

            // Handle upload foto
            if ($request->hasFile('profile_photo')) {
                $file = $request->file('profile_photo');
                
                // Validasi file valid
                if ($file->isValid()) {
                    try {
                        // Hapus foto lama jika ada
                        if ($user->profile_photo_path) {
                            $oldPath = $user->profile_photo_path;
                            if (Storage::disk('public')->exists($oldPath)) {
                                Storage::disk('public')->delete($oldPath);
                            }
                        }
                        
                        // Pastikan folder profiles ada
                        $profilesPath = storage_path('app/public/profiles');
                        if (!file_exists($profilesPath)) {
                            mkdir($profilesPath, 0755, true);
                        }
                        
                        // Simpan foto baru dengan nama unik
                        $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                        $path = $file->storeAs('profiles', $filename, 'public');
                        
                        if ($path) {
                            $user->profile_photo_path = $path;
                        } else {
                            throw new \Exception('Failed to store file');
                        }
                        
                    } catch (\Exception $e) {
                        \Log::error('Upload foto error: ' . $e->getMessage());
                        session()->flash('error', 'Gagal upload foto: ' . $e->getMessage());
                        return back()->withInput();
                    }
                } else {
                    session()->flash('error', 'File tidak valid. Error: ' . $file->getError());
                    return back()->withInput();
                }
            }

            // Force update timestamp sebelum save untuk memastikan updated_at berubah
            $user->updated_at = now();
            $user->save();
            
            // Refresh user dari database
            $freshUser = $user->fresh();
            
            // Update session dengan data user terbaru
            Auth::guard('user')->setUser($freshUser);
            
            // Re-login user untuk memastikan session terupdate
            Auth::guard('user')->login($freshUser, true);

            session()->flash('success', 'Profil berhasil diperbarui!');
            return redirect()->route('user.profile');
            
        } catch (\Exception $e) {
            \Log::error('Profile update error: ' . $e->getMessage());
            session()->flash('error', 'Terjadi kesalahan: ' . $e->getMessage());
            return back()->withInput();
        }
    }
}
