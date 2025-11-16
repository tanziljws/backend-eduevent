<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Attendance;
use App\Models\Payment;
use App\Models\Wishlist;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use App\Services\BrevoMailService;
use Carbon\Carbon;

class EventController extends Controller
{
    /**
     * Get all events (public or admin)
     */
    public function index(Request $request)
    {
        $query = Event::query();

        // Admin can see all events, public only published
        if (!$request->boolean('admin')) {
            $query->where('is_published', true);
        }

        // Search
        if ($request->has('q') && $request->q) {
            $searchTerm = $request->q;
            $query->where(function($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhere('location', 'like', "%{$searchTerm}%");
            });
        }

        // Category filter
        if ($request->has('category') && $request->category && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Sort
        $sort = $request->get('sort', 'soonest');
        switch ($sort) {
            case 'newest':
                $query->latest();
                break;
            case 'oldest':
                $query->oldest();
                break;
            case 'soonest':
            default:
                $query->orderBy('event_date', 'asc')->orderBy('start_time', 'asc');
                break;
        }

        // Paginate - default to 50 to show more events
        $perPage = min($request->get('per_page', 50), 100); // Max 100 per page
        // Remove creator eager loading if admins table doesn't exist
        // $events = $query->with(['creator'])->paginate($perPage);
        $events = $query->paginate($perPage);

        // Format response
        $events->getCollection()->transform(function ($event) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'event_date' => $event->event_date?->format('Y-m-d'),
                'start_time' => $event->start_time?->format('H:i:s'),
                'end_time' => $event->end_time?->format('H:i:s'),
                'location' => $event->location,
                'category' => $event->category,
                'is_published' => $event->is_published,
                'is_free' => $event->is_free,
                'price' => (float) $event->price,
                'max_participants' => $event->max_participants,
                'organizer' => $event->organizer,
                'flyer_url' => $event->flyer_url,
                'flyer_path' => $event->flyer_path,
                'image_url' => $event->flyer_url, // Alias for compatibility
                'image_path' => $event->flyer_path, // Alias for compatibility
                'registered_count' => $event->registered_count,
                'created_at' => $event->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $events->items(),
            'current_page' => $events->currentPage(),
            'last_page' => $events->lastPage(),
            'per_page' => $events->perPage(),
            'total' => $events->total(),
        ]);
    }

    /**
     * Get single event detail
     */
    public function show($id)
    {
        // Remove creator eager loading if admins table doesn't exist
        // $event = Event::with(['creator'])->findOrFail($id);
        $event = Event::findOrFail($id);

        // Public can only see published events
        if (!$event->is_published && !auth('sanctum')->check()) {
            abort(404);
        }

        return response()->json([
            'success' => true,
            'id' => $event->id,
            'title' => $event->title,
            'description' => $event->description,
            'event_date' => $event->event_date?->format('Y-m-d'),
            'start_time' => $event->start_time?->format('H:i:s'),
            'end_time' => $event->end_time?->format('H:i:s'),
            'location' => $event->location,
            'category' => $event->category,
            'is_published' => $event->is_published,
            'is_free' => $event->is_free,
            'price' => (float) $event->price,
            'max_participants' => $event->max_participants,
            'organizer' => $event->organizer,
            'flyer_url' => $event->flyer_url,
            'flyer_path' => $event->flyer_path,
            'image_url' => $event->flyer_url,
            'image_path' => $event->flyer_path,
            'registered_count' => $event->registered_count,
            'can_register' => $event->canRegister(),
            'created_at' => $event->created_at?->toISOString(),
        ]);
    }

    /**
     * Register for event
     */
    public function register(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $event = Event::findOrFail($id);

        if (!$event->canRegister()) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak dapat didaftar atau sudah penuh.',
            ], 400);
        }

        // Check if already registered
        $existing = EventRegistration::where('event_id', $id)
            ->where('user_id', $user->id)
            ->whereNotIn('status', ['cancelled'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah terdaftar pada event ini.',
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Generate 10-digit attendance token
            $attendanceToken = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 10));
            
            // Prepare registration data based on table schema
            $registrationData = [
                'event_id' => $id,
                'user_id' => $user->id,
                'attendance_token' => $attendanceToken,
            ];
            
            // Check which columns exist in the registrations table
            $hasNameColumn = Schema::hasColumn('registrations', 'name');
            $hasEmailColumn = Schema::hasColumn('registrations', 'email');
            $hasPhoneColumn = Schema::hasColumn('registrations', 'phone');
            $hasTokenHashColumn = Schema::hasColumn('registrations', 'token_hash');
            $hasTokenPlainColumn = Schema::hasColumn('registrations', 'token_plain');
            $hasTokenSentAtColumn = Schema::hasColumn('registrations', 'token_sent_at');
            $hasMotivationColumn = Schema::hasColumn('registrations', 'motivation');
            $hasAdditionalInfoColumn = Schema::hasColumn('registrations', 'additional_info');
            $hasRegisteredAtColumn = Schema::hasColumn('registrations', 'registered_at');
            $hasConfirmedAtColumn = Schema::hasColumn('registrations', 'confirmed_at');
            
            // Set name, email, phone if columns exist (required by old schema - these are NOT NULL)
            if ($hasNameColumn) {
                $registrationData['name'] = $user->name ?? '';
            }
            if ($hasEmailColumn) {
                $registrationData['email'] = $user->email ?? '';
            }
            if ($hasPhoneColumn) {
                // Phone is NOT NULL in old schema, so provide default value
                $registrationData['phone'] = !empty($user->phone) ? $user->phone : '-';
            }
            
            // Set token_hash and token_plain if columns exist (required by old schema)
            if ($hasTokenHashColumn) {
                $registrationData['token_hash'] = Hash::make($attendanceToken);
            }
            if ($hasTokenPlainColumn) {
                $registrationData['token_plain'] = $attendanceToken;
            }
            if ($hasTokenSentAtColumn) {
                $registrationData['token_sent_at'] = now();
            }
            
            // Set motivation/additional_info if column exists
            if ($hasMotivationColumn) {
                $registrationData['motivation'] = $request->input('additional_info') ?? $request->input('motivation');
            } elseif ($hasAdditionalInfoColumn) {
                $registrationData['additional_info'] = $request->input('additional_info');
            }
            
            // Map status: Railway DB uses enum('registered','cancelled'), new schema uses enum('pending','confirmed','cancelled','completed')
            // Always use 'registered' for Railway DB compatibility (it's in the enum)
            // If status column doesn't exist or uses new enum, try 'confirmed' or 'pending'
            $hasStatusColumn = Schema::hasColumn('registrations', 'status');
            if ($hasStatusColumn) {
                // Try to use 'registered' first (old schema), fallback to new schema values
                // Railway DB uses 'registered'/'cancelled' enum
                $registrationData['status'] = 'registered'; // Works for Railway DB
            } else {
                // Status column doesn't exist (unlikely but handle it)
                $registrationData['status'] = $event->is_free ? 'confirmed' : 'pending';
            }
            
            // Set registered_at and confirmed_at if columns exist (new schema)
            if ($hasRegisteredAtColumn) {
                $registrationData['registered_at'] = now();
            }
            if ($hasConfirmedAtColumn) {
                $registrationData['confirmed_at'] = $event->is_free ? now() : null;
            }
            
            $registration = EventRegistration::create($registrationData);

            // If paid event, create pending payment
            if (!$event->is_free) {
                Payment::create([
                    'event_id' => $id,
                    'user_id' => $user->id,
                    'registration_id' => $registration->id,
                    'amount' => $event->price,
                    'status' => 'pending',
                ]);
            }

            // Send registration confirmation email with attendance token
            try {
                $brevoService = new BrevoMailService();
                $sent = $brevoService->sendEventRegistrationToken($user->email, [
                    'user_name' => $user->name,
                    'event_title' => $event->title,
                    'event_date' => $event->event_date?->format('d F Y'),
                    'event_time' => $event->start_time?->format('H:i'),
                    'event_location' => $event->location,
                    'attendance_token' => $attendanceToken,
                ]);
                
                if (!$sent) {
                    Log::warning('Failed to send event registration token email', [
                        'user_id' => $user->id,
                        'event_id' => $id,
                        'email' => $user->email
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Exception when sending event registration token email', [
                    'user_id' => $user->id,
                    'event_id' => $id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
                // Continue anyway - token sudah tersimpan di database
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Berhasil mendaftar event. Token kehadiran telah dikirim ke email Anda.',
                'registration' => $registration,
                'registration_id' => $registration->id,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendaftar event.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Submit attendance
     */
    public function attendance(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $event = Event::findOrFail($id);
        $registration = EventRegistration::where('event_id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'confirmed')
            ->first();

        if (!$registration) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum terdaftar atau belum dikonfirmasi untuk event ini.',
            ], 400);
        }

        // Check if already attended
        $existing = Attendance::where('event_id', $id)
            ->where('user_id', $user->id)
            ->where('registration_id', $registration->id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah melakukan absensi.',
            ], 400);
        }

        // Validate attendance token
        $request->validate([
            'token' => 'required|string|size:10',
        ]);

        $inputToken = strtoupper(trim($request->input('token')));
        
        // Check if token matches registration attendance_token
        if (!$registration->attendance_token || strtoupper($registration->attendance_token) !== $inputToken) {
            return response()->json([
                'success' => false,
                'message' => 'Token kehadiran tidak valid. Pastikan token yang Anda masukkan sesuai dengan yang dikirim ke email Anda.',
            ], 400);
        }

        // Check attendance window (30 minutes before event start until event ends)
        $now = Carbon::now();
        $eventDate = Carbon::parse($event->event_date);
        $startTime = $event->start_time ? Carbon::parse($event->event_date . ' ' . $event->start_time) : $eventDate->copy()->setTime(0, 0);
        $endTime = $event->end_time ? Carbon::parse($event->event_date . ' ' . $event->end_time) : $startTime->copy()->addHours(8);
        
        $attendanceOpenTime = $startTime->copy()->subMinutes(30);
        $isAttendanceOpen = $now->greaterThanOrEqualTo($attendanceOpenTime) && $now->lessThanOrEqualTo($endTime);
        $isEventPassed = $now->greaterThan($endTime);

        if (!$isAttendanceOpen) {
            return response()->json([
                'success' => false,
                'message' => $isEventPassed 
                    ? 'Daftar hadir sudah ditutup. Event telah berakhir.' 
                    : 'Daftar hadir belum dibuka. Silakan datang kembali pada waktu yang ditentukan.',
            ], 400);
        }

        $attendance = Attendance::create([
            'event_id' => $id,
            'user_id' => $user->id,
            'registration_id' => $registration->id,
            'status' => $request->input('status', 'present'),
            'checked_in_at' => now(),
            'check_in_token' => $request->input('token'),
            'notes' => $request->input('notes'),
        ]);

        // Update registration status
        $registration->update(['status' => 'completed']);

        return response()->json([
            'success' => true,
            'message' => 'Absensi berhasil.',
            'attendance' => $attendance,
        ]);
    }

    /**
     * Get attendance status
     */
    public function attendanceStatus(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $event = Event::findOrFail($id);
        $registration = EventRegistration::where('event_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$registration) {
            return response()->json([
                'success' => false,
                'can_attend' => false,
                'message' => 'Anda belum terdaftar untuk event ini.',
            ]);
        }

        // Try to find attendance - handle both old and new schema
        $attendance = null;
        try {
            $attendance = Attendance::where('event_id', $id)
                ->where('user_id', $user->id)
                ->where('registration_id', $registration->id)
                ->first();
        } catch (\Exception $e) {
            // If attendance table doesn't exist or has issues, continue without it
            Log::warning('Error fetching attendance', [
                'error' => $e->getMessage(),
                'event_id' => $id,
                'user_id' => $user->id,
                'registration_id' => $registration->id,
            ]);
        }

        // Check if attendance window is open (event date/time logic)
        try {
            $now = Carbon::now();
            $eventDate = Carbon::parse($event->event_date);
            
            // Parse start_time safely
            $startTime = null;
            if ($event->start_time) {
                try {
                    if (is_string($event->start_time)) {
                        $startTime = Carbon::parse($event->event_date . ' ' . $event->start_time);
                    } else {
                        $startTime = Carbon::parse($event->event_date . ' ' . $event->start_time->format('H:i:s'));
                    }
                } catch (\Exception $e) {
                    $startTime = $eventDate->copy()->setTime(0, 0);
                }
            } else {
                $startTime = $eventDate->copy()->setTime(0, 0);
            }
            
            // Parse end_time safely
            $endTime = null;
            if ($event->end_time) {
                try {
                    if (is_string($event->end_time)) {
                        $endTime = Carbon::parse($event->event_date . ' ' . $event->end_time);
                    } else {
                        $endTime = Carbon::parse($event->event_date . ' ' . $event->end_time->format('H:i:s'));
                    }
                } catch (\Exception $e) {
                    $endTime = $startTime->copy()->addHours(8);
                }
            } else {
                $endTime = $startTime->copy()->addHours(8);
            }
            
            // Allow attendance 30 minutes before event starts until event ends
            $attendanceOpenTime = $startTime->copy()->subMinutes(30);
            $isAttendanceOpen = $now->greaterThanOrEqualTo($attendanceOpenTime) && $now->lessThanOrEqualTo($endTime);
            $isEventPassed = $now->greaterThan($endTime);
        } catch (\Exception $e) {
            Log::error('Error calculating attendance window', [
                'error' => $e->getMessage(),
                'event_id' => $id,
            ]);
            // Default to closed if calculation fails
            $isAttendanceOpen = false;
            $isEventPassed = false;
        }

        // Check registration status - Railway DB uses 'registered'/'cancelled', new schema uses 'pending'/'confirmed'/'cancelled'/'completed'
        $isRegistrationConfirmed = in_array($registration->status, ['confirmed', 'registered', 'completed']);
        
        // Format start_time safely for response
        $startTimeFormatted = null;
        try {
            if ($event->start_time) {
                if (is_string($event->start_time)) {
                    // Try to parse and format
                    $timeParts = explode(':', $event->start_time);
                    if (count($timeParts) >= 2) {
                        $startTimeFormatted = $timeParts[0] . ':' . $timeParts[1];
                    } else {
                        $startTimeFormatted = $event->start_time;
                    }
                } else {
                    $startTimeFormatted = $event->start_time->format('H:i');
                }
            }
        } catch (\Exception $e) {
            $startTimeFormatted = null;
        }

        return response()->json([
            'success' => true,
            'can_attend' => $isRegistrationConfirmed && !$attendance && ($isAttendanceOpen ?? false),
            'has_attended' => (bool) $attendance,
            'active' => $isAttendanceOpen ?? false,
            'is_event_passed' => $isEventPassed ?? false,
            'message' => ($isEventPassed ?? false)
                ? 'Daftar hadir sudah ditutup' 
                : (($isAttendanceOpen ?? false)
                    ? 'Daftar hadir sedang dibuka' 
                    : 'Daftar hadir belum dibuka'),
            'event_date' => $event->event_date ? Carbon::parse($event->event_date)->format('d F Y') : null,
            'start_time' => $startTimeFormatted,
            'current_time' => $now->toISOString() ?? Carbon::now()->toISOString(),
            'attendance' => $attendance ? [
                'id' => $attendance->id,
                'status' => $attendance->status ?? null,
                'checked_in_at' => $attendance->checked_in_at ?? null,
            ] : null,
            'registration' => [
                'id' => $registration->id,
                'status' => $registration->status,
                'event_id' => $registration->event_id,
                'user_id' => $registration->user_id,
            ],
        ]);
    }

    /**
     * Create payment for event
     */
    public function payment(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $event = Event::findOrFail($id);

        if ($event->is_free) {
            return response()->json([
                'success' => false,
                'message' => 'Event ini gratis.',
            ], 400);
        }

        $registration = EventRegistration::where('event_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$registration) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum terdaftar untuk event ini.',
            ], 400);
        }

        // Check which columns exist in payments table
        $hasEventIdColumn = Schema::hasColumn('payments', 'event_id');
        $hasUserIdColumn = Schema::hasColumn('payments', 'user_id');
        $hasOrderIdColumn = Schema::hasColumn('payments', 'order_id');
        $hasMidtransOrderIdColumn = Schema::hasColumn('payments', 'midtrans_order_id');
        $hasSnapTokenColumn = Schema::hasColumn('payments', 'snap_token');
        $hasTransactionIdColumn = Schema::hasColumn('payments', 'transaction_id');
        $hasMidtransTransactionIdColumn = Schema::hasColumn('payments', 'midtrans_transaction_id');
        $hasNotesColumn = Schema::hasColumn('payments', 'notes');
        
        $payment = Payment::where('registration_id', $registration->id)
            ->where('status', '!=', 'paid')
            ->first();

        if (!$payment) {
            // Prepare payment data based on table schema
            $paymentData = [
                'registration_id' => $registration->id,
                'amount' => $event->price,
                'status' => 'pending',
            ];
            
            // Set event_id and user_id if columns exist (new schema)
            if ($hasEventIdColumn) {
                $paymentData['event_id'] = $id;
            }
            if ($hasUserIdColumn) {
                $paymentData['user_id'] = $user->id;
            }
            
            // Set order_id or midtrans_order_id based on which column exists
            $orderId = 'EVENT-' . $id . '-' . $user->id . '-' . time();
            if ($hasOrderIdColumn) {
                $paymentData['order_id'] = $orderId;
            } elseif ($hasMidtransOrderIdColumn) {
                $paymentData['midtrans_order_id'] = $orderId;
            }
            
            $payment = Payment::create($paymentData);
        }

        // TODO: Integrate with Midtrans or payment gateway
        // For now, return mock snap_token
        if ($hasSnapTokenColumn) {
            $payment->snap_token = 'mock-snap-token-' . $payment->id;
            $payment->save();
        }

        // Get order_id from appropriate column
        $orderId = $payment->order_id ?? $payment->midtrans_order_id ?? null;
        
        return response()->json([
            'success' => true,
            'payment_id' => $payment->id,
            'snap_token' => $payment->snap_token ?? null,
            'order_id' => $orderId,
            'amount' => (float) $payment->amount,
        ]);
    }

    /**
     * Store new event (admin only)
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'category' => 'required|in:teknologi,seni_budaya,olahraga,akademik,sosial',
            'is_published' => 'nullable|boolean',
            'is_free' => 'nullable|boolean',
            'price' => 'nullable|numeric|min:0',
            'max_participants' => 'nullable|integer|min:1',
            'organizer' => 'nullable|string|max:255',
            'flyer' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'certificate_template' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        DB::beginTransaction();
        try {
            $data = $request->except(['flyer', 'certificate_template']);
            $admin = $request->user();
            
            // Handle created_by field - check if column exists
            if (Schema::hasColumn('events', 'created_by')) {
                if ($admin instanceof \App\Models\Admin) {
                    $data['created_by'] = $admin->id;
                } elseif ($admin instanceof \App\Models\User && $admin->role === 'admin') {
                    // Fallback: if using User with admin role, try to find admin ID
                    if (Schema::hasTable('admins')) {
                        $defaultAdmin = \App\Models\Admin::first();
                        $data['created_by'] = $defaultAdmin ? $defaultAdmin->id : 1; // Fallback to 1 if no admin found
                    } else {
                        // If admins table doesn't exist, use 1 as fallback
                        // In Railway DB, created_by is NOT NULL, so we need a valid value
                        $data['created_by'] = 1;
                    }
                } else {
                    // No admin found - use fallback value
                    // In Railway DB, created_by is NOT NULL, so we need a valid value
                    $data['created_by'] = 1;
                }
            }
            
            $data['is_published'] = $request->boolean('is_published', false);
            $data['is_free'] = $request->boolean('is_free', true);

            // Handle flyer upload
            if ($request->hasFile('flyer')) {
                $path = $request->file('flyer')->store('events/flyers', 'public');
                $data['flyer_path'] = $path;
            }

            // Handle certificate template upload
            if ($request->hasFile('certificate_template')) {
                $path = $request->file('certificate_template')->store('events/certificates', 'public');
                $data['certificate_template_path'] = $path;
            }

            $event = Event::create($data);

            DB::commit();

            // Load creator relationship only if created_by exists and admins table exists
            $eventData = $event->toArray();
            if (Schema::hasTable('admins') && $event->created_by && Schema::hasColumn('events', 'created_by')) {
                try {
                    $event->load('creator');
                    $eventData = $event->toArray();
                } catch (\Exception $e) {
                    // Ignore relationship loading errors
                    \Log::warning('Error loading creator relationship: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Event berhasil dibuat.',
                'event' => $eventData,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating event: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $data ?? null,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat event.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update event (admin only)
     */
    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'event_date' => 'sometimes|required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'category' => 'sometimes|required|in:teknologi,seni_budaya,olahraga,akademik,sosial',
            'is_published' => 'nullable|boolean',
            'is_free' => 'nullable|boolean',
            'price' => 'nullable|numeric|min:0',
            'max_participants' => 'nullable|integer|min:1',
            'organizer' => 'nullable|string|max:255',
            'flyer' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'certificate_template' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        DB::beginTransaction();
        try {
            $data = $request->except(['flyer', 'certificate_template']);
            if ($request->has('is_published')) {
                $data['is_published'] = $request->boolean('is_published');
            }
            if ($request->has('is_free')) {
                $data['is_free'] = $request->boolean('is_free');
            }

            // Handle flyer upload
            if ($request->hasFile('flyer')) {
                // Delete old flyer
                if ($event->flyer_path) {
                    Storage::disk('public')->delete($event->flyer_path);
                }
                $path = $request->file('flyer')->store('events/flyers', 'public');
                $data['flyer_path'] = $path;
            }

            // Handle certificate template upload
            if ($request->hasFile('certificate_template')) {
                // Delete old certificate template
                if ($event->certificate_template_path) {
                    Storage::disk('public')->delete($event->certificate_template_path);
                }
                $path = $request->file('certificate_template')->store('events/certificates', 'public');
                $data['certificate_template_path'] = $path;
            }

            $event->update($data);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Event berhasil diupdate.',
                'event' => $event->load('creator'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate event.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete event (admin only)
     */
    public function destroy($id)
    {
        $event = Event::findOrFail($id);

        DB::beginTransaction();
        try {
            // Delete files
            if ($event->flyer_path) {
                Storage::disk('public')->delete($event->flyer_path);
            }
            if ($event->certificate_template_path) {
                Storage::disk('public')->delete($event->certificate_template_path);
            }

            $event->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Event berhasil dihapus.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus event.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Publish/unpublish event (admin only)
     */
    public function publish(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $isPublished = $request->boolean('is_published', true);

        $event->update(['is_published' => $isPublished]);

        return response()->json([
            'success' => true,
            'message' => $isPublished ? 'Event berhasil dipublish.' : 'Event berhasil diunpublish.',
            'is_published' => $event->is_published,
        ]);
    }
}
