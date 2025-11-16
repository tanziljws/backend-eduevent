<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Kategori;
use App\Models\Petugas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with(['kategori', 'kategoris', 'petugas'])->latest()->paginate(10);
        return view('admin.posts.index', compact('posts'));
    }

    public function create()
    {
        $kategoris = Kategori::all();
        $petugas = Petugas::all();
        return view('admin.posts.create', compact('kategoris', 'petugas'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'kategori_id' => 'required|exists:kategori,id',
            'kategori_ids' => 'nullable|array',
            'kategori_ids.*' => 'exists:kategori,id',
            'isi' => 'required|string',
            'petugas_id' => 'required|exists:petugas,id',
            'status' => 'required|in:draft,published'
        ]);

        $post = Post::create($request->only(['judul', 'kategori_id', 'isi', 'petugas_id', 'status']));

        // Sync multiple kategori jika ada
        if ($request->has('kategori_ids') && is_array($request->kategori_ids)) {
            $post->kategoris()->sync($request->kategori_ids);
        }

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post berhasil dibuat!');
    }

    public function show(Post $post)
    {
        $post->load(['kategori', 'petugas']);
        return view('admin.posts.show', compact('post'));
    }

    public function edit(Post $post)
    {
        $post->load('kategoris');
        $kategoris = Kategori::all();
        $petugas = Petugas::all();
        return view('admin.posts.edit', compact('post', 'kategoris', 'petugas'));
    }

    public function update(Request $request, Post $post)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'kategori_id' => 'required|exists:kategori,id',
            'kategori_ids' => 'nullable|array',
            'kategori_ids.*' => 'exists:kategori,id',
            'isi' => 'required|string',
            'petugas_id' => 'required|exists:petugas,id',
            'status' => 'required|in:draft,published'
        ]);

        $post->update($request->only(['judul', 'kategori_id', 'isi', 'petugas_id', 'status']));

        // Sync multiple kategori jika ada
        if ($request->has('kategori_ids')) {
            $post->kategoris()->sync($request->kategori_ids ?? []);
        }

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post berhasil diupdate!');
    }

    public function destroy(Post $post)
    {
        $post->delete();

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post berhasil dihapus!');
    }
}
