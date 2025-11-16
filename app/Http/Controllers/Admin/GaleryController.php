<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Galery;
use App\Models\Post;
use App\Models\Foto;
use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GaleryController extends Controller
{
    public function index()
    {
        $galeries = Galery::with(['post', 'fotos'])->latest()->paginate(10);
        return view('admin.galery.index', compact('galeries'));
    }

    public function create()
    {
        $posts = Post::with('kategori')->where('status', 'published')->get();
        $categories = Kategori::all();
        $maxPosition = Galery::max('position') ?? 0;
        return view('admin.galery.create', compact('posts', 'categories', 'maxPosition'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'post_id' => 'required|exists:posts,id',
            'position' => 'required|integer|min:1',
            'status' => 'required|in:0,1',
            'files' => 'nullable',
            'files.*' => 'image|mimes:jpeg,png,jpg,gif'
        ]);

        $galery = Galery::create([
            'judul' => $validated['judul'],
            'post_id' => $validated['post_id'],
            'position' => $validated['position'],
            'status' => $validated['status'],
        ]);

        // Simpan foto-foto jika ada
        $uploaded = 0;
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $idx => $file) {
                if (!$file->isValid()) continue;
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('fotos', $filename, 'public');
                Foto::create([
                    'galery_id' => $galery->id,
                    'file' => $path,
                ]);
                $uploaded++;
            }
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Galeri berhasil dibuat' . ($uploaded ? " dan {$uploaded} foto diupload" : ''),
                'redirect' => route('admin.galery.index'),
            ]);
        }

        return redirect()->route('admin.galery.index')
            ->with('success', 'Galeri berhasil dibuat' . ($uploaded ? " dan {$uploaded} foto diupload!" : '!'));
    }

    public function show(Galery $galery)
    {
        $galery->load(['post', 'fotos']);
        return view('admin.galery.show', compact('galery'));
    }

    public function edit(Galery $galery)
    {
        $posts = Post::with('kategori')->where('status', 'published')->get();
        $categories = Kategori::all();
        $maxPosition = Galery::max('position') ?? 0;
        return view('admin.galery.edit', compact('galery', 'posts', 'categories', 'maxPosition'));
    }

    public function update(Request $request, Galery $galery)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'post_id' => 'required|exists:posts,id',
            'position' => 'required|integer|min:1',
            'status' => 'required|in:0,1'
        ]);

        $galery->update($validated);

        return redirect()->route('admin.galery.index')
            ->with('success', 'Galeri berhasil diupdate!');
    }

    public function destroy(Galery $galery)
    {
        // Delete all related photos first
        foreach ($galery->fotos as $foto) {
            if ($foto->file && Storage::disk('public')->exists($foto->file)) {
                Storage::disk('public')->delete($foto->file);
            }
        }

        $galery->delete();

        return redirect()->route('admin.galery.index')
            ->with('success', 'Galeri berhasil dihapus!');
    }
}
