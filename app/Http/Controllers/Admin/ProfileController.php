<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function index()
    {
        $profiles = Profile::latest()->paginate(10);
        return view('admin.profile.index', compact('profiles'));
    }

    public function create()
    {
        return view('admin.profile.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'isi' => 'required|string'
        ]);

        Profile::create($request->all());

        return redirect()->route('admin.profile.index')
            ->with('success', 'Profile berhasil dibuat!');
    }

    public function show(Profile $profile)
    {
        return view('admin.profile.show', compact('profile'));
    }

    public function edit(Profile $profile)
    {
        return view('admin.profile.edit', compact('profile'));
    }

    public function update(Request $request, Profile $profile)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'isi' => 'required|string'
        ]);

        $profile->update($request->all());

        return redirect()->route('admin.profile.index')
            ->with('success', 'Profile berhasil diupdate!');
    }

    public function destroy(Profile $profile)
    {
        $profile->delete();

        return redirect()->route('admin.profile.index')
            ->with('success', 'Profile berhasil dihapus!');
    }
}
