<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Petugas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PetugasController extends Controller
{
    public function index()
    {
        $petugas = Petugas::withCount('posts')->latest()->paginate(10);
        return view('admin.petugas.index', compact('petugas'));
    }

    public function create()
    {
        return view('admin.petugas.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255|unique:petugas,username',
            'password' => 'required|string|min:6|confirmed'
        ]);

        $data = $request->except(['password_confirmation']);
        $data['password'] = Hash::make($request->password);

        Petugas::create($data);

        return redirect()->route('admin.petugas.index')
            ->with('success', 'Petugas berhasil dibuat!');
    }

    public function show($id)
    {
        try {
            $petugas = Petugas::with(['posts.kategori'])->findOrFail($id);
            return view('admin.petugas.show', compact('petugas'));
        } catch (\Exception $e) {
            return redirect()->route('admin.petugas.index')
                ->with('error', 'Petugas tidak ditemukan!');
        }
    }

    public function edit($id)
    {
        try {
            $petugas = Petugas::findOrFail($id);
            return view('admin.petugas.edit', compact('petugas'));
        } catch (\Exception $e) {
            return redirect()->route('admin.petugas.index')
                ->with('error', 'Petugas tidak ditemukan!');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $petugas = Petugas::findOrFail($id);
            
            $request->validate([
                'username' => 'required|string|max:255|unique:petugas,username,' . $petugas->id,
                'password' => 'nullable|string|min:6|confirmed'
            ]);

            $data = $request->except(['password', 'password_confirmation']);
            
            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            $petugas->update($data);

            return redirect()->route('admin.petugas.index')
                ->with('success', 'Petugas berhasil diupdate!');
        } catch (\Exception $e) {
            return redirect()->route('admin.petugas.index')
                ->with('error', 'Terjadi kesalahan saat mengupdate petugas!');
        }
    }

    public function destroy($id)
    {
        try {
            $petugas = Petugas::findOrFail($id);
            
            // Check if petugas has posts
            if ($petugas->posts()->count() > 0) {
                return redirect()->route('admin.petugas.index')
                    ->with('error', 'Tidak dapat menghapus petugas yang memiliki posts!');
            }

            $petugas->delete();

            return redirect()->route('admin.petugas.index')
                ->with('success', 'Petugas berhasil dihapus!');
        } catch (\Exception $e) {
            return redirect()->route('admin.petugas.index')
                ->with('error', 'Terjadi kesalahan saat menghapus petugas: ' . $e->getMessage());
        }
    }
}
