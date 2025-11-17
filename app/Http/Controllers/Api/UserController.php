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
        $user = $request->user();
        
        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login to download certificate.',
            ], 401);
        }
        
        $certificate = Certificate::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found or you do not have access to this certificate.',
            ], 404);
        }

        // Check if certificate file exists
        if (!$certificate->certificate_path) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate file path not set. Certificate may still be processing.',
            ], 404);
        }
        
        if (!Storage::disk('public')->exists($certificate->certificate_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate file not found. Certificate may still be processing. Please try again later.',
            ], 404);
        }

        return Storage::disk('public')->download(
            $certificate->certificate_path,
            'certificate-' . $certificate->certificate_number . '.pdf'
        );
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
        $user = $request->user();
        // Check registration status - Railway DB uses 'registered'/'cancelled', new schema uses 'pending'/'confirmed'/'cancelled'/'completed'
        $registration = EventRegistration::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['event'])
            ->first();
        
        if (!$registration) {
            return response()->json([
                'success' => false,
                'message' => 'Registrasi tidak ditemukan atau Anda tidak memiliki akses.',
            ], 404);
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

        // TODO: Implement certificate generation logic (PDF generation)
        // For now, create certificate with 'issued' status so download button appears
        // Note: Actual PDF file generation will be implemented later
        $certificateNumber = 'CERT-' . date('Y') . '-' . strtoupper(substr(md5(time() . $id), 0, 8));
        $certificatePath = 'certificates/' . $certificateNumber . '.pdf';
        
        $certificate = Certificate::create([
            'event_id' => $registration->event_id,
            'user_id' => $user->id,
            'registration_id' => $id,
            'certificate_number' => $certificateNumber,
            'certificate_path' => $certificatePath, // Path will be created when PDF generation is implemented
            'status' => 'issued', // Set to 'issued' so download button appears
            'issued_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sertifikat berhasil dibuat.',
            'certificate' => [
                'id' => $certificate->id,
                'available' => true, // Set to true so download button appears
                'status' => $certificate->status,
                'certificate_number' => $certificate->certificate_number,
                'certificate_url' => $certificate->certificate_url,
            ],
        ]);
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
