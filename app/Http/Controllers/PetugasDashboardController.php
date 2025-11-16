<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\Galery;
use App\Models\Foto;

class PetugasDashboardController extends Controller
{
    /**
     * Show petugas dashboard
     */
    public function dashboard()
    {
        $totalPosts = Post::count();
        $totalGaleries = Galery::count();
        $totalFotos = Foto::count();
        
        $recentPosts = Post::with(['kategori', 'petugas'])
            ->latest()
            ->take(5)
            ->get();
        
        return view('petugas.dashboard', compact(
            'totalPosts', 
            'totalGaleries', 
            'totalFotos',
            'recentPosts'
        ));
    }
}
