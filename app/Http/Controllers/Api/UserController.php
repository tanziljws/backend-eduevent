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
            $registrations = EventRegistration::where('user_id', $user->id)
                ->with(['event', 'attendance', 'certificate', 'payment'])
                ->latest('registered_at')
                ->get();

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
                $eventData = [
                    'registration_id' => $reg->id,
                    'registration_date' => $reg->registered_at?->toISOString(),
                    'token_plain' => $reg->attendance_token, // Use attendance_token from registration
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
                        'id' => $reg->attendance->id,
                        'is_present' => $reg->attendance->status === 'present',
                        'status' => $reg->attendance->status,
                        'token_used' => $reg->attendance->check_in_token,
                        'checked_in_at' => $reg->attendance->checked_in_at?->toISOString(),
                        'formatted_attendance_time' => $reg->attendance->checked_in_at 
                            ? Carbon::parse($reg->attendance->checked_in_at)->locale('id')->translatedFormat('d F Y, H:i')
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
                        'id' => $reg->certificate->id,
                        'available' => $reg->certificate->status === 'issued' && $reg->certificate->certificate_path !== null,
                        'status' => $reg->certificate->status,
                        'certificate_number' => $reg->certificate->certificate_number,
                        'certificate_url' => $reg->certificate->certificate_url,
                        'issued_at' => $reg->certificate->issued_at?->toISOString(),
                    ] : [
                        'id' => null,
                        'available' => false,
                        'status' => null,
                        'certificate_number' => null,
                        'certificate_url' => null,
                        'issued_at' => null,
                    ],
                    'payment' => $reg->payment ? [
                        'id' => $reg->payment->id,
                        'status' => $reg->payment->status,
                        'amount' => $reg->payment->amount,
                    ] : null,
                    'registration' => [
                        'id' => $reg->id,
                        'status' => $reg->status,
                        'token_plain' => $reg->attendance_token,
                        'registered_at' => $reg->registered_at?->toISOString(),
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
        $certificate = Certificate::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if (!$certificate->certificate_path || !Storage::disk('public')->exists($certificate->certificate_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate file not found.',
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
        $registration = EventRegistration::where('id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'confirmed')
            ->with(['event'])
            ->firstOrFail();

        // Check if certificate already exists
        $certificate = Certificate::where('registration_id', $id)->first();
        if ($certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate already exists.',
            ], 400);
        }

        // TODO: Implement certificate generation logic
        // For now, create placeholder
        $certificate = Certificate::create([
            'event_id' => $registration->event_id,
            'user_id' => $user->id,
            'registration_id' => $id,
            'certificate_number' => 'CERT-' . time() . '-' . $id,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Certificate generation started.',
            'certificate' => $certificate,
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
