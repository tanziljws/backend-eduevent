<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $posts = Post::with(['kategori', 'petugas'])->get();
        return response()->json([
            'success' => true,
            'data' => $posts
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'kategori_id' => 'required|exists:kategori,id',
            'isi' => 'required|string',
            'petugas_id' => 'required|exists:petugas,id',
            'status' => 'required|string|in:draft,published,archived'
        ]);

        $post = Post::create($request->all());
        $post->load(['kategori', 'petugas']);

        return response()->json([
            'success' => true,
            'message' => 'Post berhasil dibuat',
            'data' => $post
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post)
    {
        $post->load(['kategori', 'petugas']);
        return response()->json([
            'success' => true,
            'data' => $post
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Post $post)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'kategori_id' => 'required|exists:kategori,id',
            'isi' => 'required|string',
            'petugas_id' => 'required|exists:petugas,id',
            'status' => 'required|string|in:draft,published,archived'
        ]);

        $post->update($request->all());
        $post->load(['kategori', 'petugas']);

        return response()->json([
            'success' => true,
            'message' => 'Post berhasil diupdate',
            'data' => $post
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        $post->delete();
        return response()->json([
            'success' => true,
            'message' => 'Post berhasil dihapus'
        ]);
    }
}
