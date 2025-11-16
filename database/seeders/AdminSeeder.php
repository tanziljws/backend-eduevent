<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin already exists
        $existingAdmin = Admin::where('email', 'admin@smkn4bogor.sch.id')
            ->orWhere('username', 'admin')
            ->first();
        
        if (!$existingAdmin) {
            Admin::create([
                'name' => 'Administrator',
                'username' => 'admin',
                'email' => 'admin@smkn4bogor.sch.id',
                'password' => Hash::make('admin123'),
            ]);
        }
    }
}
