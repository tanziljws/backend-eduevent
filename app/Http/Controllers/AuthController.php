<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\Admin;

class AuthController extends Controller
{
    /**
     * Show the login form
     */
    public function showLoginForm()
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }
        
        return view('auth.login');
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

        // Check if admin exists
        $admin = Admin::where('username', $credentials['username'])->first();
        
        if (!$admin) {
            return back()->withErrors([
                'username' => 'Username tidak ditemukan.'
            ])->withInput($request->only('username'));
        }

        // Check password
        if (!password_verify($credentials['password'], $admin->password)) {
            return back()->withErrors([
                'password' => 'Password salah.'
            ])->withInput($request->only('username'));
        }

        // Login successful
        Auth::guard('admin')->login($admin);
        
        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Handle logout
     */
    public function logout(Request $request)
    {
        Auth::guard('admin')->logout();
        
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return redirect()->route('login');
    }
}
