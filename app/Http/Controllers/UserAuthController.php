<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\BrevoMailService;
use Carbon\Carbon;

class UserAuthController extends Controller
{
    public function showRegisterForm()
    {
        // Check if user is already logged in
        if (Auth::guard('user')->check()) {
            return redirect()->route('guest.home');
        }
        
        return view('user.register');
    }

    public function register(Request $request)
    {
        // Validate first
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50',
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'username.required' => 'Username wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        // Normalize input: trim whitespace and lowercase email
        $email = strtolower(trim($request->email));
        $username = trim($request->username);
        
        // Check uniqueness with normalized values
        if (User::where('username', $username)->exists()) {
            return back()->withErrors(['username' => 'Username sudah digunakan.'])->withInput();
        }
        
        if (User::where('email', $email)->exists()) {
            return back()->withErrors(['email' => 'Email sudah terdaftar.'])->withInput();
        }

        try {
            $user = User::create([
                'name' => trim($request->name),
                'username' => $username,
                'email' => $email,
                'phone' => $request->phone ? trim($request->phone) : null,
                'password' => $request->password, // hashed by model cast
                'is_verified' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('User registration error: ' . $e->getMessage());
            return back()->withErrors(['email' => 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.'])->withInput();
        }

        // Generate OTP
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp_code = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // Simpan sesi untuk verifikasi OTP
        session(['otp_user_id' => $user->id]);

        // Kirim OTP via email menggunakan Brevo
        if ($user->email) {
            try {
                $brevoService = new BrevoMailService();
                $sent = $brevoService->sendOtpEmail($user->email, $otp);
                if (!$sent) {
                    Log::warning('BrevoMailService returned false for register OTP', [
                        'user_id' => $user->id,
                        'email' => $user->email
                    ]);
                    // Continue anyway - OTP sudah tersimpan di database, user bisa request resend
                }
            } catch (\Exception $e) {
                Log::error('Exception when sending register OTP email', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                // Continue anyway - OTP sudah tersimpan di database, user bisa request resend
            }
        }

        return redirect()->route('user.otp')->with('status', 'Kode OTP telah dikirim. Silakan cek email Anda.');
    }

    public function showOtpForm(Request $request)
    {
        if (!session('otp_user_id')) {
            return redirect()->route('user.register');
        }
        return view('user.otp');
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'otp' => 'required|string|size:6',
        ]);

        $userId = session('otp_user_id');
        $user = $userId ? User::find($userId) : null;
        if (!$user) {
            return redirect()->route('user.register')->withErrors(['otp' => 'Sesi OTP berakhir. Silakan daftar ulang.']);
        }

        if (!$user->otp_code || !$user->otp_expires_at || Carbon::now()->greaterThan($user->otp_expires_at)) {
            return back()->withErrors(['otp' => 'OTP kedaluwarsa. Silakan kirim ulang.']);
        }

        if ($request->otp !== $user->otp_code) {
            return back()->withErrors(['otp' => 'OTP tidak valid.']);
        }

        // Verifikasi berhasil
        $user->is_verified = true;
        if ($user->email && !$user->email_verified_at) {
            $user->email_verified_at = Carbon::now();
        }
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        // Bersihkan sesi OTP dan login user
        session()->forget('otp_user_id');
        Auth::guard('user')->login($user);

        return redirect()->route('guest.home')->with('status', 'Akun berhasil diverifikasi.');
    }

    public function resendOtp(Request $request)
    {
        $userId = session('otp_user_id');
        $user = $userId ? User::find($userId) : null;
        if (!$user) {
            return redirect()->route('user.register');
        }

        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp_code = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        if ($user->email) {
            // Send OTP via email menggunakan Brevo
            try {
                $brevoService = new BrevoMailService();
                $sent = $brevoService->sendOtpEmail($user->email, $otp);
                if (!$sent) {
                    Log::warning('BrevoMailService returned false for resend OTP', [
                        'user_id' => $user->id,
                        'email' => $user->email
                    ]);
                    return back()->withErrors(['otp' => 'Gagal mengirim email. Silakan coba lagi atau hubungi admin.']);
                }
            } catch (\Exception $e) {
                Log::error('Exception when resending OTP email', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                return back()->withErrors(['otp' => 'Gagal mengirim email. Silakan coba lagi atau hubungi admin.']);
            }
        }

        return back()->with('status', 'OTP baru telah dikirim.');
    }

    public function showLoginForm()
    {
        if (Auth::guard('user')->check()) {
            return redirect()->route('guest.home');
        }
        return view('user.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'identity' => 'required|string',
            'password' => 'required|string',
            'g-recaptcha-response' => 'required',
        ], [
            'g-recaptcha-response.required' => 'Verifikasi CAPTCHA wajib diisi.'
        ]);

        // Verify reCAPTCHA
        try {
            $verify = Http::asForm()->post(config('services.recaptcha.verify_url'), [
                'secret' => config('services.recaptcha.secret_key'),
                'response' => $request->input('g-recaptcha-response'),
                'remoteip' => $request->ip(),
            ])->json();

            if (!($verify['success'] ?? false)) {
                return back()
                    ->withErrors(['g-recaptcha-response' => 'Verifikasi CAPTCHA gagal.'])
                    ->withInput();
            }
        } catch (\Exception $e) {
            return back()
                ->withErrors(['g-recaptcha-response' => 'Tidak dapat memverifikasi CAPTCHA.'])
                ->withInput();
        }

        // Normalize identity input
        $identity = trim($request->identity);
        if (empty($identity)) {
            return back()->withErrors(['identity' => 'Email, username, atau nomor HP wajib diisi.'])->withInput();
        }
        
        $identityLower = strtolower($identity);
        
        // Check if identity looks like an email
        $isEmail = filter_var($identityLower, FILTER_VALIDATE_EMAIL);
        
        // Query user based on identity type
        if ($isEmail) {
            $user = User::where('email', $identityLower)->first();
        } else {
            // Try username first, then phone
            $user = User::where('username', $identity)->first();
            if (!$user && !empty($identity)) {
                $user = User::where('phone', $identity)->first();
            }
        }

        if (!$user) {
            return back()->withErrors(['identity' => 'Akun tidak ditemukan.'])->withInput();
        }

        if (!Hash::check($request->password, $user->password)) {
            return back()->withErrors(['password' => 'Password salah.'])->withInput();
        }

        if (!$user->is_verified) {
            session(['otp_user_id' => $user->id]);
            return redirect()->route('user.otp')->withErrors(['otp' => 'Akun belum diverifikasi. Silakan masukkan OTP.']);
        }

        Auth::guard('user')->login($user);
        return redirect()->intended(route('guest.home'));
    }

    public function logout(Request $request)
    {
        Auth::guard('user')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('guest.home');
    }

    public function showForgotPasswordForm()
    {
        return view('user.forgot-password');
    }

    public function sendResetOtp(Request $request)
    {
        // Normalize email input
        $email = strtolower(trim($request->email));
        $request->merge(['email' => $email]);
        
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.exists' => 'Email tidak terdaftar.',
        ]);

        $user = User::where('email', $email)->first();
        
        // Generate OTP
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp_code = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // Simpan session dulu
        session(['reset_password_user_id' => $user->id]);

        // Send OTP via email menggunakan Brevo
        try {
            $brevoService = new BrevoMailService();
            $sent = $brevoService->sendOtpEmail($user->email, $otp);
            if (!$sent) {
                Log::warning('BrevoMailService returned false for reset password OTP', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
                return back()->withErrors(['email' => 'Gagal mengirim email. Silakan coba lagi atau hubungi admin.'])->withInput();
            }
        } catch (\Exception $e) {
            Log::error('Exception when sending reset password OTP email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['email' => 'Gagal mengirim email. Silakan coba lagi atau hubungi admin.'])->withInput();
        }

        return redirect()->route('user.reset-password-otp')->with('status', 'Kode OTP telah dikirim ke email Anda.');
    }

    public function showResetPasswordOtpForm()
    {
        if (!session('reset_password_user_id')) {
            return redirect()->route('user.forgot-password');
        }
        return view('user.reset-password-otp');
    }

    public function verifyResetOtp(Request $request)
    {
        $request->validate([
            'otp' => 'required|string|size:6',
        ]);

        $userId = session('reset_password_user_id');
        $user = $userId ? User::find($userId) : null;
        
        if (!$user) {
            return redirect()->route('user.forgot-password')->withErrors(['otp' => 'Sesi berakhir. Silakan kirim ulang OTP.']);
        }

        if (!$user->otp_code || !$user->otp_expires_at || Carbon::now()->greaterThan($user->otp_expires_at)) {
            return back()->withErrors(['otp' => 'OTP kedaluwarsa. Silakan kirim ulang.']);
        }

        if ($request->otp !== $user->otp_code) {
            return back()->withErrors(['otp' => 'OTP tidak valid.']);
        }

        // OTP valid, redirect to reset password form
        session(['reset_password_verified' => true]);
        return redirect()->route('user.reset-password-form');
    }

    public function showResetPasswordForm()
    {
        if (!session('reset_password_verified') || !session('reset_password_user_id')) {
            return redirect()->route('user.forgot-password');
        }
        return view('user.reset-password');
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ], [
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $userId = session('reset_password_user_id');
        $user = $userId ? User::find($userId) : null;
        
        if (!$user || !session('reset_password_verified')) {
            return redirect()->route('user.forgot-password');
        }

        // Update password
        $user->password = $request->password; // Will be hashed by model
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        // Clear session
        session()->forget(['reset_password_user_id', 'reset_password_verified']);

        return redirect()->route('user.login')->with('status', 'Password berhasil diubah. Silakan login dengan password baru.');
    }

    public function resendResetOtp()
    {
        $userId = session('reset_password_user_id');
        $user = $userId ? User::find($userId) : null;
        
        if (!$user) {
            return redirect()->route('user.forgot-password');
        }

        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp_code = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // Send OTP via email menggunakan Brevo
        try {
            $brevoService = new BrevoMailService();
            $sent = $brevoService->sendOtpEmail($user->email, $otp);
            if (!$sent) {
                Log::warning('BrevoMailService returned false for resend reset password OTP', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
                return back()->withErrors(['otp' => 'Gagal mengirim email. Silakan coba lagi atau hubungi admin.']);
            }
        } catch (\Exception $e) {
            Log::error('Exception when resending reset password OTP email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['otp' => 'Gagal mengirim email. Silakan coba lagi atau hubungi admin.']);
        }

        return back()->with('status', 'OTP baru telah dikirim.');
    }
}
