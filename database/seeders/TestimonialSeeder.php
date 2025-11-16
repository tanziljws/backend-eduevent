<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Testimonial;

class TestimonialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testimonials = [
            [
                'nama' => 'Ahmad Rizki',
                'email' => 'ahmad@example.com',
                'pesan' => 'SMKN 4 BOGOR sangat bagus! Fasilitas lengkap dan guru-gurunya profesional. Saya sangat puas dengan pendidikan yang diberikan.',
                'status' => 'approved'
            ],
            [
                'nama' => 'Siti Nurhaliza',
                'email' => 'siti@example.com',
                'pesan' => 'Sekolah yang sangat recommended! Kurikulum yang link and match dengan industri membuat saya siap kerja setelah lulus.',
                'status' => 'approved'
            ],
            [
                'nama' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'pesan' => 'Lingkungan belajar yang kondusif dan mendukung. Prestasi akademik dan non-akademik siswa sangat membanggakan.',
                'status' => 'approved'
            ],
            [
                'nama' => 'Maya Sari',
                'email' => 'maya@example.com',
                'pesan' => 'SMKN 4 BOGOR memberikan pengalaman belajar yang luar biasa. Saya bangga menjadi alumni sekolah ini.',
                'status' => 'approved'
            ],
            [
                'nama' => 'Rizki Pratama',
                'email' => 'rizki@example.com',
                'pesan' => 'Sekolah yang sangat baik dengan fasilitas modern dan guru-guru yang kompeten. Highly recommended!',
                'status' => 'pending'
            ],
            [
                'nama' => 'Dewi Kartika',
                'email' => 'dewi@example.com',
                'pesan' => 'Pendidikan berkualitas dengan dukungan penuh dari sekolah. Siswa dididik untuk menjadi pribadi yang berkarakter.',
                'status' => 'approved'
            ]
        ];

        foreach ($testimonials as $testimonial) {
            Testimonial::create($testimonial);
        }
    }
}
