<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProfileController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $profiles = Profile::all();
        return response()->json([
            'success' => true,
            'data' => $profiles
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'isi' => 'required|string'
        ]);

        $profile = Profile::create($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Profile berhasil dibuat',
            'data' => $profile
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Profile $profile)
    {
        return response()->json([
            'success' => true,
            'data' => $profile
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Profile $profile)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'isi' => 'required|string'
        ]);

        $profile->update($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Profile berhasil diupdate',
            'data' => $profile
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Profile $profile)
    {
        $profile->delete();
        return response()->json([
            'success' => true,
            'message' => 'Profile berhasil dihapus'
        ]);
    }
}
