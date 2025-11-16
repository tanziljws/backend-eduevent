<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Kategori;
use App\Models\Petugas;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Galery;
use App\Models\Foto;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Admin
        $this->call(AdminSeeder::class);
        
        // Seed Users
        $this->call(UserSeeder::class);
        
        // Seed Kategori
        $kategoris = [
            ['judul' => 'Informasi Terkini'],
            ['judul' => 'Galery Sekolah'],
            ['judul' => 'Agenda Sekolah']
        ];
        
        foreach ($kategoris as $kategori) {
            Kategori::create($kategori);
        }

        // Seed Petugas
        $petugas = Petugas::create([
            'username' => 'admin',
            'password' => Hash::make('password123')
        ]);

        // Seed Posts
        $posts = [
            [
                'judul' => 'Selamat Datang di Sekolah Kita',
                'kategori_id' => 1,
                'isi' => 'Selamat datang di website resmi Sekolah Kita. Kami berkomitmen untuk memberikan pendidikan berkualitas.',
                'petugas_id' => 1,
                'status' => 'published'
            ],
            [
                'judul' => 'Galeri Kegiatan Sekolah',
                'kategori_id' => 2,
                'isi' => 'Berbagai kegiatan menarik yang telah dilaksanakan di sekolah kami.',
                'petugas_id' => 1,
                'status' => 'published'
            ]
        ];

        foreach ($posts as $post) {
            Post::create($post);
        }

        // Seed Profile
        $profile = Profile::create([
            'judul' => 'Profil Sekolah Kita',
            'isi' => 'Sekolah Kita adalah lembaga pendidikan yang berkomitmen untuk mengembangkan potensi siswa secara optimal.'
        ]);

        // Seed Galery
        $galeries = [
            [
                'post_id' => 1,
                'position' => 1,
                'status' => 1
            ],
            [
                'post_id' => 2,
                'position' => 1,
                'status' => 1
            ]
        ];

        foreach ($galeries as $galery) {
            Galery::create($galery);
        }

        // Seed Foto
        $fotos = [
            [
                'galery_id' => 1,
                'file' => 'welcome.jpg'
            ],
            [
                'galery_id' => 2,
                'file' => 'activity1.jpg'
            ]
        ];

        foreach ($fotos as $foto) {
            Foto::create($foto);
        }
    }
}
