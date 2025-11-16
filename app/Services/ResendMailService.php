<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Http;

class ResendMailService
{
    protected $apiKey;
    protected $apiUrl = 'https://api.resend.com/emails';

    public function __construct()
    {
        $this->apiKey = config('services.resend.key');
        if (!$this->apiKey) {
            throw new \Exception('Resend API key not configured');
        }
    }

    /**
     * Send OTP email
     */
    public function sendOtpEmail(string $to, string $otp): bool
    {
        try {
            $html = View::make('emails.otp', ['otp' => $otp])->render();
            
            $fromName = config('mail.from.name', 'SMKN 4 BOGOR');
            $fromAddress = config('mail.from.address', 'noreply@resend.dev');
            
            // Remove quotes if present
            $fromAddress = trim($fromAddress, '"\'');
            $fromName = trim($fromName, '"\'');
            
            $from = $fromName . ' <' . $fromAddress . '>';
            
            Log::info('Attempting to send OTP email via Resend API', [
                'to' => $to,
                'from' => $from,
                'api_url' => $this->apiUrl
            ]);
            
            // Send email via Resend API directly using HTTP with timeout
            $response = Http::timeout(30)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                'from' => $from,
                'to' => [$to],
                'subject' => 'Kode OTP Verifikasi Akun Anda',
                'html' => $html,
            ]);

            if ($response->successful()) {
                $result = $response->json();
                Log::info('OTP email sent successfully via Resend API', [
                    'to' => $to,
                    'resend_id' => $result['id'] ?? null,
                    'from' => $from
                ]);
                return true;
            } else {
                $errorBody = $response->json();
                $errorMessage = $errorBody['message'] ?? $response->body();
                $errorType = $errorBody['type'] ?? 'unknown';
                $statusCode = $response->status();
                
                // Handle specific error cases
                if ($statusCode === 403) {
                    // 403 Forbidden - usually means domain not verified or email not allowed
                    if (str_contains(strtolower($errorMessage), 'domain') || str_contains(strtolower($errorMessage), 'verify')) {
                        $errorMessage = 'Domain email belum diverifikasi. Silakan verifikasi domain di Resend dashboard atau hubungi admin.';
                    } elseif (str_contains(strtolower($errorMessage), 'not allowed') || str_contains(strtolower($errorMessage), 'restricted')) {
                        $errorMessage = 'Email tujuan tidak diizinkan. Dalam mode testing, Resend hanya mengizinkan email tertentu. Silakan hubungi admin untuk verifikasi domain.';
                    } else {
                        $errorMessage = 'Akses ditolak (403). Domain email mungkin belum diverifikasi atau email tidak diizinkan. Silakan hubungi admin.';
                    }
                } elseif ($statusCode === 422) {
                    // 422 Validation Error
                    $errorMessage = 'Email tidak valid atau format tidak sesuai. Silakan periksa alamat email Anda.';
                } elseif ($statusCode === 429) {
                    // 429 Rate Limit
                    $errorMessage = 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat kemudian.';
                }
                
                Log::error('Resend API returned error', [
                    'to' => $to,
                    'status' => $statusCode,
                    'error_type' => $errorType,
                    'error_message' => $errorMessage,
                    'full_response' => $errorBody,
                    'from' => $from,
                    'api_key_prefix' => substr($this->apiKey, 0, 10) . '...'
                ]);
                
                // Throw exception with detailed error for better debugging
                throw new \Exception("Resend API Error ({$statusCode}): {$errorMessage}");
            }
        } catch (\Exception $e) {
            Log::error('Failed to send OTP email via Resend API', [
                'to' => $to,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
                'api_key_set' => !empty($this->apiKey)
            ]);
            return false;
        }
    }
}

