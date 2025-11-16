<?php

namespace App\Http\Controllers\Petugas;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $posts = Post::with(['kategori', 'petugas'])->latest()->paginate(10);
        return view('petugas.posts.index', compact('posts'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $kategoris = Kategori::all();
        return view('petugas.posts.create', compact('kategoris'));
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
            'status' => 'required|in:draft,published,archived'
        ]);

        Post::create([
            'judul' => $request->judul,
            'kategori_id' => $request->kategori_id,
            'isi' => $request->isi,
            'petugas_id' => Auth::guard('petugas')->id(),
            'status' => $request->status
        ]);
        
        return redirect()->route('petugas.posts.index')->with('success', 'Post berhasil dibuat!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post)
    {
        return view('petugas.posts.show', compact('post'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Post $post)
    {
        $kategoris = Kategori::all();
        return view('petugas.posts.edit', compact('post', 'kategoris'));
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
            'status' => 'required|in:draft,published,archived'
        ]);

        $post->update($request->all());
        
        return redirect()->route('petugas.posts.index')->with('success', 'Post berhasil diupdate!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        $post->delete();
        return redirect()->route('petugas.posts.index')->with('success', 'Post berhasil dihapus!');
    }
}
