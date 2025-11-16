<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\Kategori;
use App\Models\Galery;
use App\Models\Foto;
use App\Models\Petugas;
use App\Models\Profile;

class AdminController extends Controller
{
    /**
     * Show admin dashboard
     */
    public function dashboard()
    {
        $totalPosts = Post::count();
        $totalGaleries = Galery::count();
        $totalFotos = Foto::count();
        $totalPetugas = Petugas::count();
        
        $recentPosts = Post::with(['kategori', 'petugas'])
            ->latest()
            ->take(5)
            ->get();
            
        $recentActivities = collect(); // Placeholder for activities
        
        return view('admin.dashboard', compact(
            'totalPosts', 
            'totalGaleries', 
            'totalFotos', 
            'totalPetugas',
            'recentPosts',
            'recentActivities'
        ));
    }

    /**
     * Show posts management page
     */
    public function posts()
    {
        $posts = Post::with(['kategori', 'petugas'])->latest()->paginate(10);
        return view('admin.posts.index', compact('posts'));
    }

    /**
     * Show create post form
     */
    public function createPost()
    {
        $kategoris = Kategori::all();
        $petugas = Petugas::all();
        return view('admin.posts.create', compact('kategoris', 'petugas'));
    }

    /**
     * Store new post
     */
    public function storePost(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'kategori_id' => 'required|exists:kategori,id',
            'isi' => 'required|string',
            'petugas_id' => 'required|exists:petugas,id',
            'status' => 'required|in:draft,published,archived'
        ]);

        Post::create($request->all());
        
        return redirect()->route('admin.posts')->with('success', 'Post berhasil dibuat!');
    }

    /**
     * Show edit post form
     */
    public function editPost(Post $post)
    {
        $kategoris = Kategori::all();
        $petugas = Petugas::all();
        return view('admin.posts.edit', compact('post', 'kategoris', 'petugas'));
    }

    /**
     * Update post
     */
    public function updatePost(Request $request, Post $post)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'kategori_id' => 'required|exists:kategori,id',
            'isi' => 'required|string',
            'petugas_id' => 'required|exists:petugas,id',
            'status' => 'required|in:draft,published,archived'
        ]);

        $post->update($request->all());
        
        return redirect()->route('admin.posts')->with('success', 'Post berhasil diupdate!');
    }

    /**
     * Delete post
     */
    public function deletePost(Post $post)
    {
        $post->delete();
        return redirect()->route('admin.posts')->with('success', 'Post berhasil dihapus!');
    }

    /**
     * Show kategori management page
     */
    public function kategori()
    {
        $kategoris = Kategori::withCount('posts')->paginate(10);
        return view('admin.kategori.index', compact('kategoris'));
    }

    /**
     * Show create kategori form
     */
    public function createKategori()
    {
        return view('admin.kategori.create');
    }

    /**
     * Store new kategori
     */
    public function storeKategori(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255'
        ]);

        Kategori::create($request->all());
        
        return redirect()->route('admin.kategori')->with('success', 'Kategori berhasil dibuat!');
    }

    /**
     * Show edit kategori form
     */
    public function editKategori(Kategori $kategori)
    {
        return view('admin.kategori.edit', compact('kategori'));
    }

    /**
     * Update kategori
     */
    public function updateKategori(Request $request, Kategori $kategori)
    {
        $request->validate([
            'judul' => 'required|string|max:255'
        ]);

        $kategori->update($request->all());
        
        return redirect()->route('admin.kategori')->with('success', 'Kategori berhasil diupdate!');
    }

    /**
     * Delete kategori
     */
    public function deleteKategori(Kategori $kategori)
    {
        $kategori->delete();
        return redirect()->route('admin.kategori')->with('success', 'Kategori berhasil dihapus!');
    }

    /**
     * Show galeri management page
     */
    public function galeri()
    {
        $galeries = Galery::with(['post', 'fotos'])->paginate(10);
        return view('admin.galeri.index', compact('galeries'));
    }

    /**
     * Show create galeri form
     */
    public function createGalery()
    {
        $posts = Post::all();
        return view('admin.galeri.create', compact('posts'));
    }

    /**
     * Store new galeri
     */
    public function storeGalery(Request $request)
    {
        $request->validate([
            'post_id' => 'required|exists:posts,id',
            'position' => 'required|integer|min:1',
            'status' => 'required|in:0,1'
        ]);

        Galery::create($request->all());
        
        return redirect()->route('admin.galeri')->with('success', 'Galeri berhasil dibuat!');
    }

    /**
     * Show edit galeri form
     */
    public function editGalery(Galery $galery)
    {
        $posts = Post::all();
        return view('admin.galeri.edit', compact('galery', 'posts'));
    }

    /**
     * Update galeri
     */
    public function updateGalery(Request $request, Galery $galery)
    {
        $request->validate([
            'post_id' => 'required|exists:posts,id',
            'position' => 'required|integer|min:1',
            'status' => 'required|in:0,1'
        ]);

        $galery->update($request->all());
        
        return redirect()->route('admin.galeri')->with('success', 'Galeri berhasil diupdate!');
    }

    /**
     * Delete galeri
     */
    public function deleteGalery(Galery $galery)
    {
        $galery->delete();
        return redirect()->route('admin.galeri')->with('success', 'Galeri berhasil dihapus!');
    }

    /**
     * Show foto management page
     */
    public function foto()
    {
        $fotos = Foto::with(['galery'])->paginate(10);
        return view('admin.foto.index', compact('fotos'));
    }

    /**
     * Show create foto form
     */
    public function createFoto()
    {
        $galeries = Galery::all();
        return view('admin.foto.create', compact('galeries'));
    }

    /**
     * Store new foto
     */
    public function storeFoto(Request $request)
    {
        $request->validate([
            'galery_id' => 'required|exists:galery,id',
            'file' => 'required|string|max:255',
            'judul' => 'required|string|max:255'
        ]);

        Foto::create($request->all());
        
        return redirect()->route('admin.foto')->with('success', 'Foto berhasil dibuat!');
    }

    /**
     * Show edit foto form
     */
    public function editFoto(Foto $foto)
    {
        $galeries = Galery::all();
        return view('admin.foto.edit', compact('foto', 'galeries'));
    }

    /**
     * Update foto
     */
    public function updateFoto(Request $request, Foto $foto)
    {
        $request->validate([
            'galery_id' => 'required|exists:galery,id',
            'file' => 'required|string|max:255',
            'judul' => 'required|string|max:255'
        ]);

        $foto->update($request->all());
        
        return redirect()->route('admin.foto')->with('success', 'Foto berhasil diupdate!');
    }

    /**
     * Delete foto
     */
    public function deleteFoto(Foto $foto)
    {
        $foto->delete();
        return redirect()->route('admin.foto')->with('success', 'Foto berhasil dihapus!');
    }

    /**
     * Show petugas management page
     */
    public function petugas()
    {
        $petugas = Petugas::withCount('posts')->paginate(10);
        return view('admin.petugas.index', compact('petugas'));
    }

    /**
     * Show create petugas form
     */
    public function createPetugas()
    {
        return view('admin.petugas.create');
    }

    /**
     * Store new petugas
     */
    public function storePetugas(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255|unique:petugas',
            'password' => 'required|string|min:6'
        ]);

        Petugas::create([
            'username' => $request->username,
            'password' => bcrypt($request->password)
        ]);
        
        return redirect()->route('admin.petugas')->with('success', 'Petugas berhasil dibuat!');
    }

    /**
     * Show edit petugas form
     */
    public function editPetugas(Petugas $petugas)
    {
        return view('admin.petugas.edit', compact('petugas'));
    }

    /**
     * Update petugas
     */
    public function updatePetugas(Request $request, Petugas $petugas)
    {
        $request->validate([
            'username' => 'required|string|max:255|unique:petugas,username,' . $petugas->id,
            'password' => 'nullable|string|min:6'
        ]);

        $data = ['username' => $request->username];
        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->password);
        }

        $petugas->update($data);
        
        return redirect()->route('admin.petugas')->with('success', 'Petugas berhasil diupdate!');
    }

    /**
     * Delete petugas
     */
    public function deletePetugas(Petugas $petugas)
    {
        $petugas->delete();
        return redirect()->route('admin.petugas')->with('success', 'Petugas berhasil dihapus!');
    }

    /**
     * Show profile management page
     */
    public function profil()
    {
        $profile = Profile::first();
        return view('admin.profil.index', compact('profile'));
    }

    /**
     * Show edit profile form
     */
    public function editProfil()
    {
        $profile = Profile::first();
        return view('admin.profil.edit', compact('profile'));
    }

    /**
     * Update profile
     */
    public function updateProfil(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'isi' => 'required|string'
        ]);

        $profile = Profile::first();
        if ($profile) {
            $profile->update($request->all());
        } else {
            Profile::create($request->all());
        }
        
        return redirect()->route('admin.profil')->with('success', 'Profil berhasil diupdate!');
    }
}
