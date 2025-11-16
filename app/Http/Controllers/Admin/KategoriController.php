<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use Illuminate\Http\Request;

class KategoriController extends Controller
{
    public function index()
    {
        $kategoris = Kategori::withCount('posts')->latest()->paginate(10);
        return view('admin.kategori.index', compact('kategoris'));
    }

    public function create()
    {
        return view('admin.kategori.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255|unique:kategori,judul'
        ]);

        Kategori::create($request->all());

        return redirect()->route('admin.kategori.index')
            ->with('success', 'Kategori berhasil dibuat!');
    }

    public function show(Kategori $kategori)
    {
        $kategori->load('posts');
        return view('admin.kategori.show', compact('kategori'));
    }

    public function edit(Kategori $kategori)
    {
        return view('admin.kategori.edit', compact('kategori'));
    }

    public function update(Request $request, Kategori $kategori)
    {
        $request->validate([
            'judul' => 'required|string|max:255|unique:kategori,judul,' . $kategori->id
        ]);

        $kategori->update($request->all());

        return redirect()->route('admin.kategori.index')
            ->with('success', 'Kategori berhasil diupdate!');
    }

    public function destroy(Kategori $kategori)
    {
        // Check if kategori has posts
        if ($kategori->posts()->count() > 0) {
            return redirect()->route('admin.kategori.index')
                ->with('error', 'Tidak dapat menghapus kategori yang memiliki posts!');
        }

        $kategori->delete();

        return redirect()->route('admin.kategori.index')
            ->with('success', 'Kategori berhasil dihapus!');
    }
}
