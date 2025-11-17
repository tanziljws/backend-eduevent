<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Services\BrevoMailService;

class ContactController extends Controller
{
    /**
     * Handle contact form submission
     */
    public function store(Request $request)
    {
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'subject' => 'required|string|max:255',
                'message' => 'required|string|max:5000',
            ], [
                'name.required' => 'Nama lengkap wajib diisi.',
                'name.max' => 'Nama lengkap maksimal 255 karakter.',
                'email.required' => 'Email wajib diisi.',
                'email.email' => 'Format email tidak valid.',
                'email.max' => 'Email maksimal 255 karakter.',
                'subject.required' => 'Subjek wajib diisi.',
                'subject.max' => 'Subjek maksimal 255 karakter.',
                'message.required' => 'Pesan wajib diisi.',
                'message.max' => 'Pesan maksimal 5000 karakter.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $name = $request->input('name');
            $email = $request->input('email');
            $subject = $request->input('subject');
            $message = $request->input('message');

            // Get admin email from config or use default
            $adminEmail = config('mail.admin_email') ?? config('mail.from.address') ?? 'support@edufest.app';
            
            // Send email to admin using BrevoMailService
            try {
                $brevoService = new BrevoMailService();
                
                // Prepare email content
                $emailContent = "
                    <h2>Pesan Kontak Baru dari EduFest</h2>
                    <p><strong>Nama:</strong> {$name}</p>
                    <p><strong>Email:</strong> {$email}</p>
                    <p><strong>Subjek:</strong> {$subject}</p>
                    <hr>
                    <p><strong>Pesan:</strong></p>
                    <p>" . nl2br(e($message)) . "</p>
                    <hr>
                    <p><small>Dikirim pada: " . now()->format('d F Y, H:i:s') . " WIB</small></p>
                ";

                // Send email using Brevo API directly
                $brevoApiKey = config('services.brevo.key');
                $fromEmail = config('mail.from.address');
                $fromName = config('mail.from.name', 'EduFest');

                if (!$brevoApiKey || !$fromEmail) {
                    Log::error('Brevo configuration missing for contact form', [
                        'has_api_key' => !empty($brevoApiKey),
                        'has_from_email' => !empty($fromEmail),
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Konfigurasi email belum lengkap. Silakan hubungi admin.',
                    ], 500);
                }

                // Use Brevo API directly
                $response = \Illuminate\Support\Facades\Http::timeout(30)
                    ->withHeaders([
                        'api-key' => $brevoApiKey,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ])
                    ->post('https://api.brevo.com/v3/smtp/email', [
                        'sender' => [
                            'name' => $fromName,
                            'email' => $fromEmail,
                        ],
                        'to' => [
                            [
                                'email' => $adminEmail,
                                'name' => 'Admin EduFest',
                            ]
                        ],
                        'subject' => '[EduFest] ' . $subject,
                        'htmlContent' => $emailContent,
                        'replyTo' => [
                            'email' => $email,
                            'name' => $name,
                        ],
                    ]);

                if ($response->successful()) {
                    Log::info('Contact form email sent successfully', [
                        'from' => $email,
                        'to' => $adminEmail,
                        'subject' => $subject,
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Pesan berhasil dikirim. Kami akan menghubungi Anda segera.',
                    ], 200);
                } else {
                    Log::error('Failed to send contact form email', [
                        'status' => $response->status(),
                        'response' => $response->body(),
                        'from' => $email,
                        'to' => $adminEmail,
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Gagal mengirim pesan. Silakan coba lagi nanti.',
                    ], 500);
                }
            } catch (\Exception $e) {
                Log::error('Exception sending contact form email', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'from' => $email,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Exception in contact form submission', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan. Silakan coba lagi nanti.',
            ], 500);
        }
    }
}

