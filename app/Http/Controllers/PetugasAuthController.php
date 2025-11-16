<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\Petugas;

class PetugasAuthController extends Controller
{
    /**
     * Show the login form
     */
    public function showLoginForm()
    {
        if (Auth::guard('petugas')->check()) {
            return redirect()->route('petugas.dashboard');
        }
        
        return view('petugas.auth.login');
    }

    /**
     * Handle login attempt
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'g-recaptcha-response' => 'required',
        ], [
            'g-recaptcha-response.required' => 'Verifikasi CAPTCHA wajib diisi.'
        ]);

        // Verify reCAPTCHA with Google
        try {
            $verify = Http::asForm()->post(config('services.recaptcha.verify_url'), [
                'secret' => config('services.recaptcha.secret_key'),
                'response' => $request->input('g-recaptcha-response'),
                'remoteip' => $request->ip(),
            ])->json();

            if (!($verify['success'] ?? false)) {
                return back()->withErrors([
                    'g-recaptcha-response' => 'Verifikasi CAPTCHA gagal.'
                ])->withInput($request->only('username'));
            }
        } catch (\Exception $e) {
            return back()->withErrors([
                'g-recaptcha-response' => 'Layanan CAPTCHA tidak tersedia, coba lagi.'
            ])->withInput($request->only('username'));
        }

        $credentials = $request->only('username', 'password');

        // Check if user exists and is a petugas (not admin)
        $petugas = Petugas::where('username', $credentials['username'])->first();
        
        if (!$petugas) {
            return back()->withErrors([
                'username' => 'Username tidak ditemukan.'
            ])->withInput($request->only('username'));
        }

        // Check if role is petugas (not admin)
        if ($petugas->role !== 'petugas') {
            return back()->withErrors([
                'username' => 'Akses ditolak. Silakan login melalui panel admin.'
            ])->withInput($request->only('username'));
        }

        // Check password
        if (!password_verify($credentials['password'], $petugas->password)) {
            return back()->withErrors([
                'password' => 'Password salah.'
            ])->withInput($request->only('username'));
        }

        // Login successful
        Auth::guard('petugas')->login($petugas);
        
        return redirect()->intended(route('petugas.dashboard'));
    }

    /**
     * Handle logout
     */
    public function logout(Request $request)
    {
        Auth::guard('petugas')->logout();
        
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return redirect()->route('guest.home');
    }
}
