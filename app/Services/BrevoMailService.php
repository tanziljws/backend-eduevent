<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Http;

class BrevoMailService
{
    protected $apiKey;
    protected $apiUrl = 'https://api.brevo.com/v3/smtp/email';
    protected $maxRetries = 2;
    protected $retryDelay = 1; // seconds

    public function __construct()
    {
        $this->apiKey = config('services.brevo.key');
        if (!$this->apiKey) {
            throw new \Exception('Brevo API key not configured. Please set BREVO_API_KEY in your .env file.');
        }
    }

    /**
     * Validate email configuration before sending
     */
    protected function validateConfiguration(): array
    {
        $fromName = config('mail.from.name', 'EduEvent');
        $fromAddress = config('mail.from.address');
        
        // Validate from address
        if (!$fromAddress || empty(trim($fromAddress, '"\''))) {
            throw new \Exception('MAIL_FROM_ADDRESS tidak dikonfigurasi. Gunakan email yang sudah diverifikasi di Brevo.');
        }
        
        // Validate email format
        $fromAddress = trim($fromAddress, '"\'');
        $fromName = trim($fromName, '"\'');
        
        if (!filter_var($fromAddress, FILTER_VALIDATE_EMAIL)) {
            throw new \Exception('MAIL_FROM_ADDRESS format tidak valid.');
        }
        
        return [
            'name' => $fromName,
            'email' => $fromAddress,
        ];
    }

    /**
     * Validate recipient email
     */
    protected function validateRecipient(string $email): string
    {
        $email = trim($email);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \Exception('Email penerima tidak valid: ' . $email);
        }
        return $email;
    }

    /**
     * Send email with retry logic
     */
    protected function sendEmailRequest(array $payload, int $attempt = 1): \Illuminate\Http\Client\Response
    {
        try {
            $response = Http::timeout(30)
                ->retry($this->maxRetries, $this->retryDelay * 1000)
                ->withHeaders([
                    'api-key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($this->apiUrl, $payload);

            return $response;
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::warning('Brevo API connection error', [
                'attempt' => $attempt,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Send OTP email via Brevo API
     * 
     * @param string $to Recipient email address
     * @param string $otp OTP code (6 digits)
     * @return bool True on success, false on failure
     * @throws \Exception On configuration errors
     */
    public function sendOtpEmail(string $to, string $otp): bool
    {
        try {
            // Validate OTP format
            if (empty($otp) || strlen($otp) !== 6 || !ctype_digit($otp)) {
                throw new \Exception('OTP harus 6 digit angka');
            }

            // Validate recipient
            $to = $this->validateRecipient($to);
            
            // Validate configuration
            $sender = $this->validateConfiguration();
            
            // Render email template
            $html = View::make('emails.otp', ['otp' => $otp])->render();
            
            if (empty($html)) {
                throw new \Exception('Email template tidak dapat dirender');
            }

            // Prepare payload
            $payload = [
                'sender' => [
                    'name' => $sender['name'],
                    'email' => $sender['email'],
                ],
                'to' => [
                    [
                        'email' => $to,
                    ]
                ],
                'subject' => 'Kode OTP Verifikasi Akun Anda - EduEvent',
                'htmlContent' => $html,
            ];

            Log::info('Attempting to send OTP email via Brevo API', [
                'to' => $to,
                'from' => $sender['email'],
                'from_name' => $sender['name'],
            ]);

            // Send email with retry
            $response = $this->sendEmailRequest($payload);

            if ($response->successful()) {
                $result = $response->json();
                $messageId = $result['messageId'] ?? null;
                
                Log::info('OTP email sent successfully via Brevo API', [
                    'to' => $to,
                    'message_id' => $messageId,
                    'from' => $sender['email'],
                ]);
                
                return true;
            } else {
                // Handle specific error codes
                $statusCode = $response->status();
                $errorBody = $response->json();
                $errorMessage = $errorBody['message'] ?? $response->body();
                
                // Parse error details if available
                $errorDetails = [];
                if (isset($errorBody['code'])) {
                    $errorDetails['code'] = $errorBody['code'];
                }
                if (isset($errorBody['error'])) {
                    $errorDetails['error'] = $errorBody['error'];
                }
                
                Log::error('Brevo API returned error', [
                    'to' => $to,
                    'status' => $statusCode,
                    'error_message' => $errorMessage,
                    'error_details' => $errorDetails,
                    'full_response' => $errorBody,
                    'from' => $sender['email'],
                ]);
                
                // Handle specific error cases
                if ($statusCode === 401) {
                    throw new \Exception('Brevo API key tidak valid atau tidak memiliki akses.');
                } elseif ($statusCode === 403) {
                    throw new \Exception('Akses ditolak. Pastikan email pengirim sudah diverifikasi di Brevo.');
                } elseif ($statusCode === 400) {
                    throw new \Exception("Brevo API Error: {$errorMessage}");
                } else {
                    throw new \Exception("Brevo API Error ({$statusCode}): {$errorMessage}");
                }
            }
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Connection error when sending OTP email via Brevo API', [
                'to' => $to,
                'error' => $e->getMessage(),
                'api_url' => $this->apiUrl,
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('Failed to send OTP email via Brevo API', [
                'to' => $to ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
                'api_key_set' => !empty($this->apiKey),
            ]);
            
            // Re-throw configuration errors
            if (str_contains($e->getMessage(), 'tidak dikonfigurasi') || 
                str_contains($e->getMessage(), 'tidak valid')) {
                throw $e;
            }
            
            return false;
        }
    }

    /**
     * Send event registration token email via Brevo API
     * 
     * @param string $to Recipient email address
     * @param array $data Event registration data (user_name, event_title, event_date, event_time, event_location, attendance_token)
     * @return bool True on success, false on failure
     * @throws \Exception On configuration errors
     */
    public function sendEventRegistrationToken(string $to, array $data): bool
    {
        try {
            // Validate recipient
            $to = $this->validateRecipient($to);
            
            // Validate required data
            if (empty($data['attendance_token']) || strlen($data['attendance_token']) !== 10) {
                throw new \Exception('Attendance token harus 10 karakter');
            }
            
            // Validate configuration
            $sender = $this->validateConfiguration();
            
            // Render email template
            $html = View::make('emails.event-registration', $data)->render();
            
            if (empty($html)) {
                throw new \Exception('Email template tidak dapat dirender');
            }

            // Prepare payload
            $payload = [
                'sender' => [
                    'name' => $sender['name'],
                    'email' => $sender['email'],
                ],
                'to' => [
                    [
                        'email' => $to,
                    ]
                ],
                'subject' => 'Konfirmasi Registrasi Event - ' . ($data['event_title'] ?? 'EduEvent'),
                'htmlContent' => $html,
            ];

            Log::info('Attempting to send event registration token email via Brevo API', [
                'to' => $to,
                'from' => $sender['email'],
                'event_title' => $data['event_title'] ?? null,
            ]);

            // Send email with retry
            $response = $this->sendEmailRequest($payload);

            if ($response->successful()) {
                $result = $response->json();
                $messageId = $result['messageId'] ?? null;
                
                Log::info('Event registration token email sent successfully via Brevo API', [
                    'to' => $to,
                    'message_id' => $messageId,
                    'from' => $sender['email'],
                    'event_title' => $data['event_title'] ?? null,
                ]);
                
                return true;
            } else {
                // Handle specific error codes
                $statusCode = $response->status();
                $errorBody = $response->json();
                $errorMessage = $errorBody['message'] ?? $response->body();
                
                Log::error('Brevo API returned error for event registration token email', [
                    'to' => $to,
                    'status' => $statusCode,
                    'error_message' => $errorMessage,
                    'full_response' => $errorBody,
                    'from' => $sender['email'],
                ]);
                
                // Handle specific error cases
                if ($statusCode === 401) {
                    throw new \Exception('Brevo API key tidak valid atau tidak memiliki akses.');
                } elseif ($statusCode === 403) {
                    throw new \Exception('Akses ditolak. Pastikan email pengirim sudah diverifikasi di Brevo.');
                } elseif ($statusCode === 400) {
                    throw new \Exception("Brevo API Error: {$errorMessage}");
                } else {
                    throw new \Exception("Brevo API Error ({$statusCode}): {$errorMessage}");
                }
            }
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Connection error when sending event registration token email via Brevo API', [
                'to' => $to,
                'error' => $e->getMessage(),
                'api_url' => $this->apiUrl,
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('Failed to send event registration token email via Brevo API', [
                'to' => $to ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
                'api_key_set' => !empty($this->apiKey),
            ]);
            
            // Re-throw configuration errors
            if (str_contains($e->getMessage(), 'tidak dikonfigurasi') || 
                str_contains($e->getMessage(), 'tidak valid')) {
                throw $e;
            }
            
            return false;
        }
    }

    /**
     * Test Brevo configuration
     * 
     * @return array Test result with status and message
     */
    public function testConfiguration(): array
    {
        try {
            // Check API key
            if (!$this->apiKey) {
                return [
                    'status' => 'error',
                    'message' => 'BREVO_API_KEY tidak dikonfigurasi',
                ];
            }

            // Validate sender configuration
            $sender = $this->validateConfiguration();
            
            return [
                'status' => 'success',
                'message' => 'Konfigurasi Brevo valid',
                'from_email' => $sender['email'],
                'from_name' => $sender['name'],
                'api_key_length' => strlen($this->apiKey),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }
}

