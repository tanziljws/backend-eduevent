<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use App\Services\BrevoMailService;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * Register new user
     */
    public function register(Request $request)
    {
        $email = strtolower(trim($request->email));
        
        // Cleanup unverified users with the same email BEFORE validation (zombie database cleanup)
        // Check if is_verified column exists before querying
        $hasIsVerifiedColumn = Schema::hasColumn('users', 'is_verified');
        
        $existingUnverifiedUser = User::where('email', $email);
        
        // Only filter by is_verified if column exists
        if ($hasIsVerifiedColumn) {
            $existingUnverifiedUser = $existingUnverifiedUser->where('is_verified', false);
        } else {
            // If column doesn't exist, only check for email_verified_at being null
            // This handles old database schema without is_verified
            $existingUnverifiedUser = $existingUnverifiedUser->whereNull('email_verified_at');
        }
        
        $existingUnverifiedUser = $existingUnverifiedUser->first();
        
        if ($existingUnverifiedUser) {
            // Delete unverified user to allow re-registration
            // We delete regardless of OTP expiry to allow user to re-register anytime
            $logData = [
                'user_id' => $existingUnverifiedUser->id,
                'email' => $email,
                'created_at' => $existingUnverifiedUser->created_at,
            ];
            
            // Only log OTP data if columns exist
            if (Schema::hasColumn('users', 'otp_expires_at')) {
                $logData['otp_expires_at'] = $existingUnverifiedUser->otp_expires_at ?? null;
                $logData['is_expired'] = $existingUnverifiedUser->otp_expires_at 
                    ? Carbon::now()->greaterThan($existingUnverifiedUser->otp_expires_at) 
                    : true;
            }
            
            Log::info('Deleting unverified user to allow re-registration', $logData);
            $existingUnverifiedUser->delete();
        }
        
        // Validate after cleanup
        $validationRules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ];
        
        // Only validate username unique if column exists
        if (Schema::hasColumn('users', 'username')) {
            $validationRules['username'] = 'nullable|string|max:50|unique:users,username';
        }
        
        // Only validate phone if column exists
        if (Schema::hasColumn('users', 'phone')) {
            $validationRules['phone'] = 'nullable|string|max:20';
        }
        
        $request->validate($validationRules);

        try {
            
            // Prepare user data
            $userData = [
                'name' => trim($request->name),
                'email' => $email,
                'password' => $request->password,
            ];
            
            // Only add username if column exists
            if (Schema::hasColumn('users', 'username')) {
                $username = $request->username 
                    ? trim($request->username) 
                    : $this->generateUsernameFromEmail($email);
                $userData['username'] = $username;
            }
            
            // Only add phone if column exists
            if (Schema::hasColumn('users', 'phone')) {
                $userData['phone'] = $request->phone ? trim($request->phone) : null;
            }
            
            // Only add is_verified if column exists
            if (Schema::hasColumn('users', 'is_verified')) {
                $userData['is_verified'] = false;
            }
            
            $user = User::create($userData);

            // Generate OTP (only if columns exist)
            $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            if (Schema::hasColumn('users', 'otp_code')) {
                $user->otp_code = $otp;
            }
            if (Schema::hasColumn('users', 'otp_expires_at')) {
                $user->otp_expires_at = Carbon::now()->addMinutes(10);
            }
            $user->save();

            // Send OTP email
            try {
                $brevoService = new BrevoMailService();
                $sent = $brevoService->sendOtpEmail($user->email, $otp);
                if (!$sent) {
                    Log::warning('Failed to send OTP email via Brevo (returned false)', [
                        'user_id' => $user->id,
                        'email' => $user->email
                    ]);
                }
            } catch (\Exception $e) {
                // Log configuration errors separately
                if (str_contains($e->getMessage(), 'tidak dikonfigurasi') || 
                    str_contains($e->getMessage(), 'tidak valid')) {
                    Log::error('Brevo configuration error during registration', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage()
                    ]);
                } else {
                    Log::error('Failed to send OTP email during registration', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage()
                    ]);
                }
                // Continue anyway - OTP sudah tersimpan, user bisa request resend
            }

            return response()->json([
                'success' => true,
                'message' => 'Registrasi berhasil. Silakan cek email untuk kode OTP.',
                'user_id' => $user->id,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mendaftar.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Verify email with OTP
     */
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'code' => 'required|string|size:6',
        ]);

        $user = User::findOrFail($request->user_id);

        // Check if OTP columns exist
        $hasOtpColumns = Schema::hasColumn('users', 'otp_code') && Schema::hasColumn('users', 'otp_expires_at');
        
        if ($hasOtpColumns) {
            if (!$user->otp_code || !$user->otp_expires_at || Carbon::now()->greaterThan($user->otp_expires_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP kedaluwarsa. Silakan kirim ulang.',
                ], 400);
            }

            if ($request->code !== $user->otp_code) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP tidak valid.',
                ], 400);
            }
        } else {
            // If OTP columns don't exist, just verify email_verified_at
            // This handles old database schema
            if ($user->email_verified_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email sudah diverifikasi sebelumnya.',
                ], 400);
            }
        }

        // Verify user
        if (Schema::hasColumn('users', 'is_verified')) {
            $user->is_verified = true;
        }
        if (!$user->email_verified_at) {
            $user->email_verified_at = Carbon::now();
        }
        if (Schema::hasColumn('users', 'otp_code')) {
            $user->otp_code = null;
        }
        if (Schema::hasColumn('users', 'otp_expires_at')) {
            $user->otp_expires_at = null;
        }
        $user->save();

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Email berhasil diverifikasi.',
            'token' => $token,
            'user' => $user->makeHidden(['password', 'otp_code']),
        ]);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password tidak valid.',
            ], 401);
        }

        // Check verification status - handle both is_verified column and email_verified_at
        $hasIsVerifiedColumn = Schema::hasColumn('users', 'is_verified');
        $isVerified = $hasIsVerifiedColumn 
            ? $user->is_verified 
            : !is_null($user->email_verified_at);

        if (!$isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'Email belum diverifikasi. Silakan verifikasi email terlebih dahulu.',
            ], 403);
        }

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => $user->makeHidden(['password', 'otp_code']),
        ]);
    }

    /**
     * Request password reset
     */
    public function requestReset(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if (!$user) {
            // Don't reveal if email exists for security
            return response()->json([
                'success' => true,
                'message' => 'Jika email terdaftar, kode OTP telah dikirim.',
            ]);
        }

        // Generate OTP (only if columns exist)
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        if (Schema::hasColumn('users', 'otp_code')) {
            $user->otp_code = $otp;
        }
        if (Schema::hasColumn('users', 'otp_expires_at')) {
            $user->otp_expires_at = Carbon::now()->addMinutes(10);
        }
        $user->save();

        // Send OTP email
        try {
            $brevoService = new BrevoMailService();
            $sent = $brevoService->sendOtpEmail($user->email, $otp);
            if (!$sent) {
                Log::warning('Failed to send reset OTP email via Brevo (returned false)', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            }
        } catch (\Exception $e) {
            // Log configuration errors separately
            if (str_contains($e->getMessage(), 'tidak dikonfigurasi') || 
                str_contains($e->getMessage(), 'tidak valid')) {
                Log::error('Brevo configuration error during password reset', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage()
                ]);
            } else {
                Log::error('Failed to send reset OTP email', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage()
                ]);
            }
            // Continue anyway - OTP sudah tersimpan, user bisa request resend
        }

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, kode OTP telah dikirim.',
            'user_id' => $user->id,
        ]);
    }

    /**
     * Reset password with OTP
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::findOrFail($request->user_id);

        // Check if OTP columns exist
        $hasOtpColumns = Schema::hasColumn('users', 'otp_code') && Schema::hasColumn('users', 'otp_expires_at');
        
        if ($hasOtpColumns) {
            if (!$user->otp_code || !$user->otp_expires_at || Carbon::now()->greaterThan($user->otp_expires_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP kedaluwarsa. Silakan kirim ulang.',
                ], 400);
            }

            if ($request->code !== $user->otp_code) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP tidak valid.',
                ], 400);
            }
        }
        // If OTP columns don't exist, skip validation (old schema support)

        // Reset password
        $user->password = $request->password;
        if (Schema::hasColumn('users', 'otp_code')) {
            $user->otp_code = null;
        }
        if (Schema::hasColumn('users', 'otp_expires_at')) {
            $user->otp_expires_at = null;
        }
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset.',
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->makeHidden(['password', 'otp_code']),
        ]);
    }

    /**
     * Login admin
     */
    public function loginAdmin(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            // Check if admins table exists
            if (!Schema::hasTable('admins')) {
                Log::error('Admin login attempted but admins table does not exist');
                return response()->json([
                    'success' => false,
                    'message' => 'Admin system not configured. Please run migrations.',
                    'error' => config('app.debug') ? 'Table "admins" does not exist' : null,
                ], 500);
            }

            $email = strtolower(trim($request->email));
            
            try {
                $admin = Admin::where('email', $email)->first();
            } catch (\Exception $e) {
                Log::error('Error querying admin table', [
                    'error' => $e->getMessage(),
                    'email' => $email,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Database error. Please contact administrator.',
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 500);
            }

            if (!$admin) {
                Log::warning('Admin login attempted with non-existent email', [
                    'email' => $email,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Email atau password tidak valid.',
                ], 401);
            }

            if (!Hash::check($request->password, $admin->password)) {
                Log::warning('Admin login attempted with wrong password', [
                    'email' => $email,
                    'admin_id' => $admin->id,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Email atau password tidak valid.',
                ], 401);
            }

            // Create token
            try {
                $tokenResult = $admin->createToken('admin-auth-token');
                $token = $tokenResult->plainTextToken;
                
                // Log token creation for debugging
                Log::info('Admin token created', [
                    'admin_id' => $admin->id,
                    'email' => $admin->email,
                    'token_id' => $tokenResult->accessToken->id,
                    'tokenable_type' => $tokenResult->accessToken->tokenable_type,
                ]);
            } catch (\Exception $e) {
                Log::error('Error creating admin token', [
                    'error' => $e->getMessage(),
                    'admin_id' => $admin->id,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal membuat token. Silakan coba lagi.',
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil.',
                'token' => $token,
                'user' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => 'admin',
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Admin login error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'email' => $request->input('email'),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat login.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Generate unique username from email
     */
    protected function generateUsernameFromEmail(string $email): string
    {
        // Check if username column exists
        if (!Schema::hasColumn('users', 'username')) {
            // Return empty string if column doesn't exist
            return '';
        }
        
        // Extract username part before @
        $baseUsername = explode('@', $email)[0];
        
        // Remove special characters, keep only alphanumeric and underscore
        $baseUsername = preg_replace('/[^a-zA-Z0-9_]/', '', $baseUsername);
        
        // Limit to 45 characters (to allow for suffix if needed)
        $baseUsername = substr($baseUsername, 0, 45);
        
        // If empty after cleanup, use default
        if (empty($baseUsername)) {
            $baseUsername = 'user';
        }
        
        // Check if username exists, if yes, append number
        $username = $baseUsername;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $suffix = $counter;
            $maxLength = 50 - strlen((string)$suffix) - 1; // -1 for underscore
            $username = substr($baseUsername, 0, $maxLength) . '_' . $suffix;
            $counter++;
        }
        
        return $username;
    }
}
