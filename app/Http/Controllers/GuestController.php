<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Profile;
use App\Models\Galery;
use App\Models\Foto;
use App\Models\Testimonial;
use App\Models\Kategori;
use Illuminate\Http\Request;

class GuestController extends Controller
{
    /**
     * Show the home page
     */
    public function home()
    {
        $profile = Profile::first();
        
        // Get latest Agenda posts
        $agendaKategori = Kategori::where('judul', 'Agenda')->first();
        $latestAgenda = collect();
        if ($agendaKategori) {
            $latestAgenda = Post::with(['kategori', 'petugas'])
                ->where('status', 'published')
                ->where('kategori_id', $agendaKategori->id)
                ->latest()
                ->take(4)
                ->get();
        }
        
        // Get latest Informasi posts
        $informasiKategori = Kategori::where('judul', 'Informasi Terkini')->first();
        $latestInformasi = collect();
        if ($informasiKategori) {
            $latestInformasi = Post::with(['kategori', 'petugas'])
                ->where('status', 'published')
                ->where('kategori_id', $informasiKategori->id)
                ->latest()
                ->take(3)
                ->get();
        }
        
        $testimonials = Testimonial::approved()
            ->latest()
            ->take(6)
            ->get();
            
        return view('guest.home', compact('profile', 'latestAgenda', 'latestInformasi', 'testimonials'));
    }

    /**
     * Show the profile page
     */
    public function profil()
    {
        $profile = Profile::first();
        return view('guest.profil', compact('profile'));
    }

    /**
     * Show the gallery page
     */
    public function galeri(Request $request)
    {
        $query = Galery::with(['post.kategori', 'fotos'])
            ->where('status', 1);
            
        // Filter by post_id if provided (filtering by specific gallery post title)
        if ($request->has('post') && $request->post) {
            $query->where('post_id', $request->post);
        }
        
        $galeries = $query->orderBy('position')->get();
        
        // Get posts dengan kategori "Galeri Sekolah" for filter chips
        $galeriKategori = Kategori::where('judul', 'Galeri Sekolah')->first();
        $galeriPosts = collect();
        $filterPosts = collect();
        
        if ($galeriKategori) {
            // Posts for content section - bisa dari kategori utama atau kategori tambahan
            $galeriPosts = Post::with(['kategori', 'kategoris', 'petugas'])
                ->where('status', 'published')
                ->where(function($q) use ($galeriKategori) {
                    $q->where('kategori_id', $galeriKategori->id)
                      ->orWhereHas('kategoris', function($subq) use ($galeriKategori) {
                          $subq->where('kategori_id', $galeriKategori->id);
                      });
                })
                ->latest()
                ->take(6)
                ->get();
                
            // Posts that have galleries (for filter chips) - bisa dari kategori utama atau tambahan
            $filterPosts = Post::with(['kategori', 'kategoris'])
                ->where('status', 'published')
                ->where(function($q) use ($galeriKategori) {
                    $q->where('kategori_id', $galeriKategori->id)
                      ->orWhereHas('kategoris', function($subq) use ($galeriKategori) {
                          $subq->where('kategori_id', $galeriKategori->id);
                      });
                })
                ->whereHas('galeries', function($q) {
                    $q->where('status', 1);
                })
                ->latest()
                ->get();
        }
            
        return view('guest.galeri', compact('galeries', 'galeriPosts', 'filterPosts'));
    }

    /**
     * Show gallery page with a selected item (full-detail route for hybrid UX)
     */
    public function galeriShow(Galery $galery)
    {
        // Pastikan hanya galeri aktif yang bisa ditampilkan
        abort_unless($galery->status == 1, 404);

        $galery->load(['post', 'fotos', 'likes', 'bookmarks', 'comments.user']);
        $recommendations = Galery::with('fotos')
            ->where('status', 1)
            ->where('id', '!=', $galery->id)
            ->latest('position')
            ->take(6)
            ->get();

        return view('guest.galeri_show', compact('galery', 'recommendations'));
    }

    /**
     * Show agenda page (Posts dengan kategori "Agenda")
     */
    public function agenda()
    {
        $agendaKategori = Kategori::where('judul', 'Agenda')->first();
        
        // Jika kategori belum ada, tetap tampilkan halaman kosong
        $posts = collect();
        
        if ($agendaKategori) {
            $posts = Post::with(['kategori', 'petugas'])
                ->where('status', 'published')
                ->where('kategori_id', $agendaKategori->id)
                ->latest()
                ->paginate(9);
        }
            
        return view('guest.agenda.index', compact('posts'));
    }

    /**
     * Show single agenda detail
     */
    public function agendaShow(Post $post)
    {
        // Pastikan post adalah kategori Agenda dan published
        $agendaKategori = Kategori::where('judul', 'Agenda')->first();
        abort_unless($post->status === 'published' && $post->kategori_id == $agendaKategori->id, 404);
        
        $post->load(['kategori', 'petugas']);
        
        // Get related posts (posts lain dengan kategori Agenda)
        $relatedPosts = Post::with(['kategori'])
            ->where('status', 'published')
            ->where('kategori_id', $agendaKategori->id)
            ->where('id', '!=', $post->id)
            ->latest()
            ->take(3)
            ->get();
        
        return view('guest.agenda.show', compact('post', 'relatedPosts'));
    }

    /**
     * Show informasi page (Posts dengan kategori "Informasi Terkini")
     */
    public function informasi()
    {
        $informasiKategori = Kategori::where('judul', 'Informasi Terkini')->first();
        
        // Jika kategori belum ada, tetap tampilkan halaman kosong
        $posts = collect();
        
        if ($informasiKategori) {
            $posts = Post::with(['kategori', 'petugas'])
                ->where('status', 'published')
                ->where('kategori_id', $informasiKategori->id)
                ->latest()
                ->paginate(9);
        }
            
        return view('guest.informasi.index', compact('posts'));
    }

    /**
     * Show single informasi detail
     */
    public function informasiShow(Post $post)
    {
        // Pastikan post adalah kategori Informasi Terkini dan published
        $informasiKategori = Kategori::where('judul', 'Informasi Terkini')->first();
        abort_unless($post->status === 'published' && $post->kategori_id == $informasiKategori->id, 404);
        
        $post->load(['kategori', 'petugas']);
        
        // Get related posts (posts lain dengan kategori Informasi Terkini)
        $relatedPosts = Post::with(['kategori'])
            ->where('status', 'published')
            ->where('kategori_id', $informasiKategori->id)
            ->where('id', '!=', $post->id)
            ->latest()
            ->take(3)
            ->get();
        
        return view('guest.informasi.show', compact('post', 'relatedPosts'));
    }

    /**
     * Show the contact page
     */
    public function kontak()
    {
        return view('guest.kontak');
    }
}
