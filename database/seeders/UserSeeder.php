<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test user (verified)
        User::create([
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'phone' => '081234567890',
            'password' => Hash::make('password123'),
            'is_verified' => true,
            'email_verified_at' => Carbon::now(),
        ]);

        // Create another test user (unverified)
        User::create([
            'name' => 'Unverified User',
            'username' => 'unverified',
            'email' => 'unverified@example.com',
            'phone' => '081234567891',
            'password' => Hash::make('password123'),
            'is_verified' => false,
        ]);
    }
}
