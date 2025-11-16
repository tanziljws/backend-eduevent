<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Kategori;
use Illuminate\Support\Str;

class KategoriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Agenda',
            'Informasi Terkini',
            'Galeri Sekolah',
        ];

        foreach ($categories as $judul) {
            Kategori::firstOrCreate(
                ['judul' => $judul]
            );
        }
    }
}
