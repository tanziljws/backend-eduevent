<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventRegistration;
use App\Models\Certificate;
use App\Models\Payment;
use App\Models\Event;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;

class UserController extends Controller
{
    /**
     * Get user event history with attendance, certificate, and status information
     */
    public function eventHistory(Request $request)
    {
        try {
        $user = $request->user();
            
            // Build query - check if registered_at column exists
            $query = EventRegistration::where('user_id', $user->id);
            
            // Check which columns exist for ordering
            $hasRegisteredAtColumn = Schema::hasColumn('registrations', 'registered_at');
            if ($hasRegisteredAtColumn) {
                $query->latest('registered_at');
            } else {
                // Fallback to created_at if registered_at doesn't exist
                $query->latest('created_at');
            }
            
            // Load relationships safely
            try {
                $registrations = $query->with(['event', 'attendance', 'certificate', 'payment'])->get();
            } catch (\Exception $e) {
                // If relationships fail, load without them
                Log::warning('Error loading relationships in eventHistory', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id,
                ]);
                $registrations = $query->with(['event'])->get();
            }

            $now = Carbon::now();
            $events = [];
            $statistics = [
                'total' => 0,
                'completed' => 0,
                'attended' => 0,
                'upcoming' => 0,
                'missed' => 0,
                'cancelled' => 0,
            ];

            foreach ($registrations as $reg) {
                if (!$reg->event) {
                    continue; // Skip if event is deleted
                }

                // Handle date parsing safely
                $eventDate = $reg->event->event_date ? Carbon::parse($reg->event->event_date) : null;
                if (!$eventDate) {
                    continue; // Skip if event_date is null
                }

                // Handle start_time and end_time (they're already Carbon instances from Event model)
                $startTime = $reg->event->start_time 
                    ? ($reg->event->start_time instanceof \Carbon\Carbon 
                        ? $reg->event->start_time->copy()->setDateFrom($eventDate) 
                        : ($reg->event->event_date ? Carbon::parse($reg->event->event_date . ' ' . $reg->event->start_time) : $eventDate->copy()->setTime(0, 0)))
                    : $eventDate->copy()->setTime(0, 0);
                
                $endTime = $reg->event->end_time 
                    ? ($reg->event->end_time instanceof \Carbon\Carbon 
                        ? $reg->event->end_time->copy()->setDateFrom($eventDate)
                        : ($reg->event->event_date ? Carbon::parse($reg->event->event_date . ' ' . $reg->event->end_time) : $startTime->copy()->addHours(8)))
                    : $startTime->copy()->addHours(8);

                // Determine overall status
                $overallStatus = 'upcoming';
                if ($reg->status === 'cancelled') {
                    $overallStatus = 'cancelled';
                } elseif ($reg->attendance && $reg->attendance->status === 'present') {
                    $overallStatus = 'attended';
                    if ($reg->certificate && $reg->certificate->status === 'issued') {
                        $overallStatus = 'completed';
                    }
                } elseif ($now->greaterThan($endTime)) {
                    if ($reg->attendance) {
                        $overallStatus = $reg->attendance->status === 'present' ? 'attended' : 'missed';
                    } else {
                        $overallStatus = 'missed';
                    }
                }

                // Update statistics
                $statistics['total']++;
                if (isset($statistics[$overallStatus])) {
                    $statistics[$overallStatus]++;
                }

                // Format event data
                // Get registration date safely
                $registrationDate = null;
                try {
                    if ($hasRegisteredAtColumn && $reg->registered_at) {
                        $registrationDate = $reg->registered_at instanceof \Carbon\Carbon 
                            ? $reg->registered_at->toISOString() 
                            : Carbon::parse($reg->registered_at)->toISOString();
                    } elseif ($reg->created_at) {
                        $registrationDate = $reg->created_at instanceof \Carbon\Carbon 
                            ? $reg->created_at->toISOString() 
                            : Carbon::parse($reg->created_at)->toISOString();
                    }
                } catch (\Exception $e) {
                    // If date parsing fails, use null
                    $registrationDate = null;
                }
                
                $eventData = [
                    'registration_id' => $reg->id,
                    'registration_date' => $registrationDate,
                    'token_plain' => $reg->attendance_token ?? null, // Use attendance_token from registration
                    'overall_status' => $overallStatus,
                    'event' => [
                        'id' => $reg->event->id,
                        'title' => $reg->event->title,
                        'description' => $reg->event->description,
                        'event_date' => $reg->event->event_date?->format('Y-m-d'),
                        'formatted_date' => $reg->event->event_date 
                            ? Carbon::parse($reg->event->event_date)->locale('id')->translatedFormat('l, d F Y')
                            : 'N/A',
                        'start_time' => $reg->event->start_time 
                            ? ($reg->event->start_time instanceof \Carbon\Carbon 
                                ? $reg->event->start_time->format('H:i:s') 
                                : (is_string($reg->event->start_time) ? $reg->event->start_time : null))
                            : null,
                        'formatted_time' => $reg->event->start_time 
                            ? ($reg->event->start_time instanceof \Carbon\Carbon 
                                ? $reg->event->start_time->format('H:i') 
                                : (is_string($reg->event->start_time) && strlen($reg->event->start_time) >= 5 ? substr($reg->event->start_time, 0, 5) : 'N/A'))
                            : 'N/A',
                        'end_time' => $reg->event->end_time 
                            ? ($reg->event->end_time instanceof \Carbon\Carbon 
                                ? $reg->event->end_time->format('H:i:s') 
                                : (is_string($reg->event->end_time) ? $reg->event->end_time : null))
                            : null,
                        'location' => $reg->event->location,
                        'category' => $reg->event->category,
                        'flyer_url' => $reg->event->flyer_url,
                    ],
                    'attendance' => $reg->attendance ? [
                        'id' => $reg->attendance->id ?? null,
                        'is_present' => ($reg->attendance->status ?? null) === 'present',
                        'status' => $reg->attendance->status ?? null,
                        'token_used' => $reg->attendance->check_in_token ?? null,
                        'checked_in_at' => $reg->attendance->checked_in_at 
                            ? (($reg->attendance->checked_in_at instanceof \Carbon\Carbon) 
                                ? $reg->attendance->checked_in_at->toISOString() 
                                : Carbon::parse($reg->attendance->checked_in_at)->toISOString())
                            : null,
                        'formatted_attendance_time' => $reg->attendance->checked_in_at 
                            ? (function() use ($reg) {
                                try {
                                    $checkedInAt = $reg->attendance->checked_in_at instanceof \Carbon\Carbon 
                                        ? $reg->attendance->checked_in_at 
                                        : Carbon::parse($reg->attendance->checked_in_at);
                                    return $checkedInAt->locale('id')->translatedFormat('d F Y, H:i');
                                } catch (\Exception $e) {
                                    return null;
                                }
                            })()
                            : null,
                    ] : [
                        'id' => null,
                        'is_present' => false,
                        'status' => null,
                        'token_used' => null,
                        'checked_in_at' => null,
                        'formatted_attendance_time' => null,
                    ],
                    'certificate' => $reg->certificate ? [
                        'id' => $reg->certificate->id ?? null,
                        'available' => ($reg->certificate->status ?? null) === 'issued' && ($reg->certificate->certificate_path ?? null) !== null,
                        'status' => $reg->certificate->status ?? null,
                        'certificate_number' => $reg->certificate->certificate_number ?? null,
                        'certificate_url' => $reg->certificate->certificate_url ?? null,
                        'issued_at' => $reg->certificate->issued_at 
                            ? (($reg->certificate->issued_at instanceof \Carbon\Carbon) 
                                ? $reg->certificate->issued_at->toISOString() 
                                : Carbon::parse($reg->certificate->issued_at)->toISOString())
                            : null,
                    ] : [
                        'id' => null,
                        'available' => false,
                        'status' => null,
                        'certificate_number' => null,
                        'certificate_url' => null,
                        'issued_at' => null,
                    ],
                    'payment' => $reg->payment ? [
                        'id' => $reg->payment->id ?? null,
                        'status' => $reg->payment->status ?? 'pending',
                        'amount' => (float) ($reg->payment->amount ?? 0),
                    ] : null,
                    'registration' => [
                        'id' => $reg->id,
                        'status' => $reg->status ?? 'registered',
                        'token_plain' => $reg->attendance_token ?? null,
                        'registered_at' => $registrationDate,
                    ],
                ];

                $events[] = $eventData;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'events' => $events,
                    'statistics' => $statistics,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in eventHistory: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil riwayat event.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get user transactions (alias for eventHistory)
     */
    public function transactions(Request $request)
    {
        return $this->eventHistory($request);
    }

    /**
     * Get detailed event information
     */
    public function eventDetail(Request $request, $id)
    {
        $user = $request->user();
        $registration = EventRegistration::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['event', 'payment', 'certificate', 'attendance'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'registration' => $registration,
            'event' => $registration->event,
            'payment' => $registration->payment,
            'certificate' => $registration->certificate,
            'attendance' => $registration->attendance,
        ]);
    }

    /**
     * Get my registrations
     */
    public function registrations(Request $request)
    {
        $user = $request->user();
        $registrations = EventRegistration::where('user_id', $user->id)
            ->with(['event'])
            ->latest('registered_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $registrations,
        ]);
    }

    /**
     * Get my history (alias for eventHistory)
     */
    public function history(Request $request)
    {
        return $this->eventHistory($request);
    }

    /**
     * Get user certificates
     */
    public function certificates(Request $request)
    {
        $user = $request->user();
        $certificates = Certificate::where('user_id', $user->id)
            ->with(['event'])
            ->latest('issued_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $certificates->map(function ($cert) {
                return [
                    'id' => $cert->id,
                    'certificate_number' => $cert->certificate_number,
                    'certificate_url' => $cert->certificate_url,
                    'status' => $cert->status,
                    'issued_at' => $cert->issued_at?->toISOString(),
                    'event' => $cert->event ? [
                        'id' => $cert->event->id,
                        'title' => $cert->event->title,
                        'event_date' => $cert->event->event_date?->format('Y-m-d'),
                    ] : null,
                ];
            }),
        ]);
    }

    /**
     * Download certificate
     */
    public function downloadCertificate(Request $request, $id)
    {
        try {
            Log::info('Certificate download request', [
                'certificate_id' => $id,
                'has_auth_header' => $request->hasHeader('Authorization'),
                'bearer_token' => $request->bearerToken() ? 'present' : 'missing',
            ]);
            
        $user = $request->user();
            
            // If user is not authenticated via header, try to authenticate via query parameter token
            if (!$user && $request->has('token')) {
                $token = $request->query('token');
                if ($token) {
                    // Find the personal access token
                    $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                    if ($personalAccessToken) {
                        $user = $personalAccessToken->tokenable;
                    }
                }
            }
            
            // Check if user is authenticated
            if (!$user) {
                Log::warning('Certificate download failed: User not authenticated', [
                    'certificate_id' => $id,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please login to download certificate.',
                ], 401);
            }
            
            Log::info('User authenticated for certificate download', [
                'certificate_id' => $id,
                'user_id' => $user->id,
            ]);
            
        $certificate = Certificate::where('id', $id)
            ->where('user_id', $user->id)
                ->with(['registration', 'event', 'user'])
                ->first();

            if (!$certificate) {
                Log::warning('Certificate not found', [
                    'certificate_id' => $id,
                    'user_id' => $user->id,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate not found or you do not have access to this certificate.',
                ], 404);
            }
            
            Log::info('Certificate found', [
                'certificate_id' => $certificate->id,
                'certificate_path' => $certificate->certificate_path,
                'status' => $certificate->status,
            ]);

        // Helper function to generate PDF for certificate
        $generatePdfForCertificate = function($cert) use ($user) {
            try {
                Log::info('Starting PDF generation for certificate', ['certificate_id' => $cert->id]);
                
                // Reload certificate with relationships if not loaded
                if (!$cert->relationLoaded('registration') || !$cert->relationLoaded('event') || !$cert->relationLoaded('user')) {
                    Log::info('Loading certificate relationships', ['certificate_id' => $cert->id]);
                    $cert->load(['registration', 'event', 'user']);
                }
                
                $registration = $cert->registration;
                $event = $cert->event;
                $userData = $cert->user;
                
                Log::info('Certificate relationships loaded', [
                    'certificate_id' => $cert->id,
                    'has_registration' => $registration ? 'yes' : 'no',
                    'has_event' => $event ? 'yes' : 'no',
                    'has_user' => $userData ? 'yes' : 'no',
                ]);
                
                if (!$registration || !$event || !$userData) {
                    throw new \Exception('Certificate relationships not found. Registration: ' . ($registration ? 'yes' : 'no') . ', Event: ' . ($event ? 'yes' : 'no') . ', User: ' . ($userData ? 'yes' : 'no'));
                }
                
                $certificateNumber = $cert->certificate_number ?: 'CERT-' . date('Y') . '-' . strtoupper(substr(md5(time() . $cert->id), 0, 8));
                $certificatePath = 'certificates/' . $certificateNumber . '.pdf';
                
                Log::info('Generating PDF', [
                    'certificate_id' => $cert->id,
                    'certificate_number' => $certificateNumber,
                    'certificate_path' => $certificatePath,
                ]);
                
                $pdf = $this->generateCertificatePdf($userData, $event, $certificateNumber, $registration);
                
                Log::info('PDF generated successfully', [
                    'certificate_id' => $cert->id,
                    'pdf_size' => strlen($pdf),
                ]);
                
                // Ensure certificates directory exists
                $certificatesDir = storage_path('app/public/certificates');
                if (!file_exists($certificatesDir)) {
                    Log::info('Creating certificates directory', ['path' => $certificatesDir]);
                    if (!mkdir($certificatesDir, 0755, true)) {
                        throw new \Exception('Failed to create certificates directory: ' . $certificatesDir);
                    }
                }
                
                Log::info('Saving PDF to storage', [
                    'certificate_id' => $cert->id,
                    'path' => $certificatePath,
                ]);
                
                if (!Storage::disk('public')->put($certificatePath, $pdf)) {
                    throw new \Exception('Failed to save PDF file to storage: ' . $certificatePath);
                }
                
                Log::info('PDF saved successfully', [
                    'certificate_id' => $cert->id,
                    'path' => $certificatePath,
                ]);
                
                // Update certificate with path
                $cert->certificate_path = $certificatePath;
                if (!$cert->certificate_number) {
                    $cert->certificate_number = $certificateNumber;
                }
                $cert->save();
                
                return $certificatePath;
            } catch (\Exception $e) {
                Log::error('Generate PDF for certificate failed', [
                    'certificate_id' => $cert->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }
        };
        
        try {
            // Check if certificate file exists, if not, try to generate it
            if (!$certificate->certificate_path) {
                try {
                    $generatePdfForCertificate($certificate);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Certificate file not found and generation failed: ' . $e->getMessage() . '. Please try generating again.',
                    ], 500);
                }
            }
            
            // Check if file exists, if not try to regenerate
            if (!Storage::disk('public')->exists($certificate->certificate_path)) {
                try {
                    $generatePdfForCertificate($certificate);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Certificate file not found and regeneration failed: ' . $e->getMessage() . '. Please try generating again.',
                    ], 500);
                }
            }

            // Download the file
            Log::info('Preparing to download certificate file', [
                'certificate_id' => $certificate->id,
                'certificate_path' => $certificate->certificate_path,
            ]);
            
            $filePath = Storage::disk('public')->path($certificate->certificate_path);
            
            Log::info('File path resolved', [
                'certificate_id' => $certificate->id,
                'file_path' => $filePath,
                'file_exists' => file_exists($filePath),
            ]);
            
            if (!file_exists($filePath)) {
                Log::error('Certificate file not found on disk', [
                    'certificate_id' => $certificate->id,
                    'certificate_path' => $certificate->certificate_path,
                    'resolved_path' => $filePath,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate file not found at path: ' . $certificate->certificate_path,
                ], 404);
            }
            
            $filename = 'certificate-' . ($certificate->certificate_number ?: 'certificate-' . $certificate->id) . '.pdf';
            
            Log::info('Returning certificate file for download', [
                'certificate_id' => $certificate->id,
                'filename' => $filename,
                'file_size' => filesize($filePath),
            ]);
            
            // Use response()->download() instead of response()->file() for better reliability
            return response()->download($filePath, $filename, [
                'Content-Type' => 'application/pdf',
            ]);
            
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Certificate download error', [
                'certificate_id' => $id ?? null,
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Return JSON error instead of throwing exception
            return response()->json([
                'success' => false,
                'message' => 'Error downloading certificate: ' . $e->getMessage() . '. Please try again or contact support.',
            ], 500);
        }
    }

    /**
     * Cancel registration
     */
    public function cancelRegistration(Request $request, $id)
    {
        $user = $request->user();
        $registration = EventRegistration::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($registration->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Registrasi sudah dibatalkan.',
            ], 400);
        }

        $registration->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil dibatalkan.',
        ]);
    }

    /**
     * Generate certificate
     */
    public function generateCertificate(Request $request, $id)
    {
        // Log request for debugging
        Log::info('Certificate generation request', [
            'registration_id' => $id,
            'has_auth_header' => $request->hasHeader('Authorization'),
            'bearer_token' => $request->bearerToken() ? 'present' : 'missing',
        ]);
        
        $user = $request->user();
        
        if (!$user) {
            Log::warning('Certificate generation failed: User not authenticated', [
                'registration_id' => $id,
                'has_auth_header' => $request->hasHeader('Authorization'),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login.',
            ], 401);
        }
        
        Log::info('User authenticated for certificate generation', [
            'registration_id' => $id,
            'user_id' => $user->id,
        ]);
        
        // Check registration status - Railway DB uses 'registered'/'cancelled', new schema uses 'pending'/'confirmed'/'cancelled'/'completed'
        $registration = EventRegistration::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['event', 'attendance'])
            ->first();
        
        if (!$registration) {
            return response()->json([
                'success' => false,
                'message' => 'Registrasi tidak ditemukan atau Anda tidak memiliki akses.',
            ], 404);
        }
        
        if (!$registration->event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan.',
            ], 404);
        }
        
        // Check if user has attended the event
        if (!$registration->attendance || $registration->attendance->status !== 'present') {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum hadir di event ini. Sertifikat hanya dapat dibuat untuk peserta yang sudah hadir.',
            ], 400);
        }
        
        if (!in_array($registration->status, ['confirmed', 'registered', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Registrasi belum dikonfirmasi atau sudah dibatalkan.',
            ], 400);
        }

        // Check if certificate already exists
        $certificate = Certificate::where('registration_id', $id)->first();
        if ($certificate) {
            // If certificate already exists and is issued, return it
            if ($certificate->status === 'issued' && $certificate->certificate_path) {
                return response()->json([
                    'success' => true,
                    'message' => 'Certificate sudah tersedia.',
                    'certificate' => [
                        'id' => $certificate->id,
                        'available' => true,
                        'status' => $certificate->status,
                        'certificate_number' => $certificate->certificate_number,
                        'certificate_url' => $certificate->certificate_url,
                    ],
                ]);
            }
            // If certificate exists but is pending, return it (still processing)
            return response()->json([
                'success' => true,
                'message' => 'Sertifikat sedang diproses.',
                'certificate' => [
                    'id' => $certificate->id,
                    'available' => false,
                    'status' => $certificate->status,
                    'certificate_number' => $certificate->certificate_number,
                ],
            ]);
        }

        // Generate certificate number
        $certificateNumber = 'CERT-' . date('Y') . '-' . strtoupper(substr(md5(time() . $id), 0, 8));
        $certificatePath = 'certificates/' . $certificateNumber . '.pdf';
        
        // Load event and user data
        $event = $registration->event;
        $userData = $user;
        
        // Generate PDF certificate
        try {
            Log::info('Starting certificate generation', [
                'registration_id' => $id,
                'user_id' => $user->id,
                'event_id' => $event->id,
            ]);
            
            $pdf = $this->generateCertificatePdf($userData, $event, $certificateNumber, $registration);
            
            Log::info('PDF generated successfully', [
                'registration_id' => $id,
                'pdf_size' => strlen($pdf),
            ]);
            
            // Ensure certificates directory exists
            $certificatesDir = storage_path('app/public/certificates');
            if (!file_exists($certificatesDir)) {
                if (!mkdir($certificatesDir, 0755, true)) {
                    throw new \Exception('Failed to create certificates directory: ' . $certificatesDir);
                }
                Log::info('Created certificates directory', ['path' => $certificatesDir]);
            }
            
            // Save PDF to storage
            if (!Storage::disk('public')->put($certificatePath, $pdf)) {
                throw new \Exception('Failed to save PDF file to storage: ' . $certificatePath);
            }
            
            Log::info('PDF saved to storage', [
                'registration_id' => $id,
                'path' => $certificatePath,
            ]);
            
            // Create certificate record
        $certificate = Certificate::create([
            'event_id' => $registration->event_id,
            'user_id' => $user->id,
            'registration_id' => $id,
                'certificate_number' => $certificateNumber,
                'certificate_path' => $certificatePath,
                'status' => 'issued',
                'issued_at' => now(),
            ]);

            Log::info('Certificate record created', [
                'registration_id' => $id,
                'certificate_id' => $certificate->id,
        ]);

        return response()->json([
            'success' => true,
                'message' => 'Sertifikat berhasil dibuat.',
                'certificate' => [
                    'id' => $certificate->id,
                    'available' => true,
                    'status' => $certificate->status,
                    'certificate_number' => $certificate->certificate_number,
                    'certificate_url' => $certificate->certificate_url,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate PDF generation failed', [
                'registration_id' => $id,
                'user_id' => $user->id,
                'event_id' => $event->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat sertifikat: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate PDF certificate
     */
    private function generateCertificatePdf($user, $event, $certificateNumber, $registration)
    {
        // Validate required data
        if (!$user || !$event) {
            throw new \Exception('User or Event data is missing');
        }
        
        // Format event date
        $eventDate = $event->event_date 
            ? Carbon::parse($event->event_date)->locale('id')->translatedFormat('d F Y')
            : 'N/A';
        
        // Format issued date
        $issuedDate = now()->locale('id')->translatedFormat('d F Y');
        
        // HTML template for certificate
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page {
                    margin: 0;
                    size: A4 landscape;
                }
                body {
                    margin: 0;
                    padding: 0;
                    font-family: "Times New Roman", serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .certificate-container {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    box-sizing: border-box;
                }
                .certificate {
                    width: 100%;
                    max-width: 900px;
                    background: white;
                    border: 20px solid #d4af37;
                    padding: 60px;
                    box-shadow: 0 10px 50px rgba(0,0,0,0.3);
                    text-align: center;
                    position: relative;
                }
                .certificate::before {
                    content: "";
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    bottom: 20px;
                    border: 3px solid #d4af37;
                }
                .certificate-header {
                    font-size: 48px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                }
                .certificate-subtitle {
                    font-size: 24px;
                    color: #7f8c8d;
                    margin-bottom: 40px;
                    font-style: italic;
                }
                .certificate-body {
                    margin: 40px 0;
                }
                .certificate-text {
                    font-size: 20px;
                    color: #34495e;
                    line-height: 1.8;
                    margin-bottom: 30px;
                }
                .certificate-name {
                    font-size: 36px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin: 30px 0;
                    text-decoration: underline;
                    text-decoration-color: #d4af37;
                    text-decoration-thickness: 3px;
                }
                .certificate-event {
                    font-size: 24px;
                    color: #2c3e50;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .certificate-details {
                    font-size: 18px;
                    color: #7f8c8d;
                    margin: 20px 0;
                    line-height: 1.6;
                }
                .certificate-footer {
                    margin-top: 60px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .certificate-signature {
                    text-align: center;
                    width: 200px;
                }
                .signature-line {
                    border-top: 2px solid #2c3e50;
                    margin-top: 60px;
                    padding-top: 10px;
                    font-size: 16px;
                    color: #7f8c8d;
                }
                .certificate-number {
                    position: absolute;
                    bottom: 20px;
                    right: 40px;
                    font-size: 12px;
                    color: #95a5a6;
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                <div class="certificate">
                    <div class="certificate-header">Sertifikat</div>
                    <div class="certificate-subtitle">Certificate of Participation</div>
                    
                    <div class="certificate-body">
                        <div class="certificate-text">
                            Dengan ini menyatakan bahwa
                        </div>
                        <div class="certificate-name">' . htmlspecialchars($user->name) . '</div>
                        <div class="certificate-text">
                            telah berpartisipasi dalam
                        </div>
                        <div class="certificate-event">' . htmlspecialchars($event->title) . '</div>
                        <div class="certificate-details">
                            Tanggal: ' . htmlspecialchars($eventDate) . '<br>
                            Lokasi: ' . htmlspecialchars($event->location ?? 'N/A') . '
                        </div>
                    </div>
                    
                    <div class="certificate-footer">
                        <div class="certificate-signature">
                            <div class="signature-line">Ketua Panitia</div>
                        </div>
                        <div class="certificate-signature">
                            <div class="signature-line">Direktur</div>
                        </div>
                    </div>
                    
                    <div class="certificate-number">
                        No. ' . htmlspecialchars($certificateNumber) . '<br>
                        Diterbitkan: ' . htmlspecialchars($issuedDate) . '
                    </div>
                </div>
            </div>
        </body>
        </html>';
        
        // Check if Dompdf is available
        if (!class_exists('Dompdf\Dompdf')) {
            Log::error('Dompdf class not found', [
                'available_classes' => class_exists('Dompdf\Dompdf') ? 'yes' : 'no',
            ]);
            throw new \Exception('PDF generation library (Dompdf) is not installed. Please run: composer require dompdf/dompdf');
        }
        
        try {
            // Configure Dompdf
            $options = new Options();
            $options->set('isHtml5ParserEnabled', true);
            $options->set('isRemoteEnabled', false); // Disable remote for security
            $options->set('defaultFont', 'Times New Roman');
            $options->set('chroot', base_path());
            $options->set('tempDir', storage_path('app/temp'));
            
            $dompdf = new Dompdf($options);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'landscape');
            
            $dompdf->render();
            
            return $dompdf->output();
        } catch (\Exception $e) {
            Log::error('Dompdf render error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \Exception('Failed to render PDF: ' . $e->getMessage());
        }
    }

    /**
     * Check certificate status
     */
    public function certificateStatus(Request $request, $id)
    {
        $user = $request->user();
        $certificate = Certificate::where('registration_id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'certificate' => $certificate,
        ]);
    }

    /**
     * Get payment status
     */
    public function paymentStatus(Request $request, $id)
    {
        $user = $request->user();
        $payment = Payment::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'payment' => $payment,
        ]);
    }

    /**
     * Get user wishlist
     */
    public function wishlist(Request $request)
    {
        $user = $request->user();
        $wishlists = \App\Models\Wishlist::where('user_id', $user->id)
            ->with(['event'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $wishlists->map(function ($wishlist) {
                if (!$wishlist->event) {
                    return null; // Skip if event is deleted
                }
                return [
                    'id' => $wishlist->id,
                    'event_id' => $wishlist->event_id,
                    'event' => [
                        'id' => $wishlist->event->id,
                        'title' => $wishlist->event->title,
                        'description' => $wishlist->event->description,
                        'event_date' => $wishlist->event->event_date?->format('Y-m-d'),
                        'start_time' => $wishlist->event->start_time?->format('H:i:s'),
                        'location' => $wishlist->event->location,
                        'category' => $wishlist->event->category,
                        'is_published' => $wishlist->event->is_published,
                        'is_free' => $wishlist->event->is_free,
                        'price' => (float) $wishlist->event->price,
                        'flyer_url' => $wishlist->event->flyer_url,
                        'registered_count' => $wishlist->event->registered_count,
                    ],
                    'created_at' => $wishlist->created_at?->toISOString(),
                ];
            })->filter(), // Remove null entries
        ]);
    }

    /**
     * Check if event is in wishlist
     */
    public function checkWishlist(Request $request, $eventId)
    {
        $user = $request->user();
        
        $wishlist = \App\Models\Wishlist::where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->exists();

        return response()->json([
            'success' => true,
            'is_wishlisted' => $wishlist,
        ]);
    }

    /**
     * Toggle wishlist (add/remove event from wishlist)
     */
    public function toggleWishlist(Request $request, $eventId)
    {
        $user = $request->user();
        $event = Event::findOrFail($eventId);

        $wishlist = \App\Models\Wishlist::where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->first();

        if ($wishlist) {
            $wishlist->delete();
            return response()->json([
                'success' => true,
                'message' => 'Event dihapus dari wishlist.',
                'is_wishlisted' => false,
            ]);
        } else {
            \App\Models\Wishlist::create([
                'user_id' => $user->id,
                'event_id' => $eventId,
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Event ditambahkan ke wishlist.',
                'is_wishlisted' => true,
            ]);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!\Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password saat ini tidak valid.',
            ], 400);
        }

        $user->update([
            'password' => $request->new_password,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah.',
        ]);
    }
}
