<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Attendance;
use App\Models\User;
use App\Models\Payment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Get admin dashboard data
     */
    public function dashboard(Request $request)
    {
        $year = $request->get('year', date('Y'));

        // Calculate stats with logging for debugging
        try {
            $totalEvents = Event::count();
            $publishedEvents = Event::where('is_published', true)->count();
            
            // Check if status column exists before filtering
            $hasStatusColumn = Schema::hasColumn('registrations', 'status');
            $totalRegistrations = $hasStatusColumn 
                ? EventRegistration::where('status', '!=', 'cancelled')->count()
                : EventRegistration::count();
            
            $totalAttendances = Attendance::count();
            
            // Check which column exists for attendance date and status
            $hasCheckedInAt = Schema::hasColumn('attendances', 'checked_in_at');
            $hasAttendanceTime = Schema::hasColumn('attendances', 'attendance_time');
            $hasStatusColumnAtt = Schema::hasColumn('attendances', 'status');
            
            // Calculate total attendees based on available columns
            $totalAttendees = 0;
            if ($hasStatusColumnAtt) {
                $totalAttendees = Attendance::where('status', 'present')->count();
            } else {
                // If no status column, all attendances are considered as present
                $totalAttendees = $totalAttendances;
            }
            
            Log::info('Dashboard stats calculated', [
                'total_events' => $totalEvents,
                'published_events' => $publishedEvents,
                'total_registrations' => $totalRegistrations,
                'total_attendances' => $totalAttendances,
                'total_attendees' => $totalAttendees,
                'has_checked_in_at' => $hasCheckedInAt,
                'has_attendance_time' => $hasAttendanceTime,
                'has_status_column' => $hasStatusColumnAtt,
            ]);
        } catch (\Exception $e) {
            Log::error('Error calculating dashboard stats: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            // Set defaults on error
            $totalEvents = 0;
            $publishedEvents = 0;
            $totalRegistrations = 0;
            $totalAttendances = 0;
            $totalAttendees = 0;
        }
        
        // Calculate attendance rate
        $attendanceRate = 0;
        if ($totalRegistrations > 0) {
            $attendanceRate = round(($totalAttendees / $totalRegistrations) * 100, 1);
        }

        // Calculate revenue (from payments table)
        $totalRevenue = 0;
        $adminRevenue = 0;
        $panitiaRevenue = 0;
        
        if (Schema::hasTable('payments')) {
            try {
                $totalRevenue = Payment::where('status', 'paid')
                    ->sum('amount') ?? 0;
                // For now, split 70% admin, 30% panitia (can be configured later)
                $adminRevenue = $totalRevenue * 0.7;
                $panitiaRevenue = $totalRevenue * 0.3;
            } catch (\Exception $e) {
                Log::warning('Error calculating revenue: ' . $e->getMessage());
            }
        }

        $stats = [
            'total_events' => $totalEvents,
            'published_events' => $publishedEvents,
            'total_registrations' => $totalRegistrations,
            'total_users' => Schema::hasColumn('users', 'is_verified') 
                ? User::where('is_verified', true)->count()
                : User::whereNotNull('email_verified_at')->count(),
            'total_attendances' => $totalAttendances,
            'total_attendees' => $totalAttendees, // For frontend compatibility
            'attendance_rate' => $attendanceRate,
            'total_revenue' => $totalRevenue,
            'admin_revenue' => $adminRevenue,
            'panitia_revenue' => $panitiaRevenue,
            'events_this_year' => Event::whereYear('created_at', $year)->count(),
            'registrations_this_year' => $hasStatusColumn 
                ? EventRegistration::whereYear('created_at', $year)
                    ->where('status', '!=', 'cancelled')
                    ->count()
                : EventRegistration::whereYear('created_at', $year)->count(),
        ];

        // Recent events - remove creator eager loading (admins table doesn't exist)
        $recentEvents = Event::latest()
            ->take(5)
            ->get();

        // Upcoming events
        $upcomingEvents = Event::where('event_date', '>=', now())
            ->where('is_published', true)
            ->orderBy('event_date', 'asc')
            ->take(5)
            ->get();

        // Monthly events data (for chart)
        $monthlyEvents = Event::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', $year)
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $monthlyEventsData = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthlyEventsData[] = [
                'month' => $i,
                'count' => $monthlyEvents->get($i)->count ?? 0,
            ];
        }

        // Monthly attendees data (for chart)
        // Check which column exists for attendance date
        $hasCheckedInAt = Schema::hasColumn('attendances', 'checked_in_at');
        $hasAttendanceTime = Schema::hasColumn('attendances', 'attendance_time');
        $hasStatusColumnAtt = Schema::hasColumn('attendances', 'status');
        
        $dateColumn = $hasCheckedInAt ? 'checked_in_at' : ($hasAttendanceTime ? 'attendance_time' : 'created_at');
        
        $monthlyAttendeesQuery = Attendance::selectRaw("MONTH({$dateColumn}) as month, COUNT(*) as count")
            ->whereYear($dateColumn, $year);
        
        // Only filter by status if column exists
        if ($hasStatusColumnAtt) {
            $monthlyAttendeesQuery->where('status', 'present');
        }
        
        $monthlyAttendees = $monthlyAttendeesQuery->groupBy('month')
            ->get()
            ->keyBy('month');

        $monthlyAttendeesData = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthlyAttendeesData[] = [
                'month' => $i,
                'count' => $monthlyAttendees->get($i)->count ?? 0,
            ];
        }

        // Top events (by registration count)
        // Check if status column exists in registrations table
        $hasStatusColumnReg = Schema::hasColumn('registrations', 'status');
        
        // Use subquery to count non-cancelled registrations per event
        $topEventsQuery = Event::select('events.*');
        
        if ($hasStatusColumnReg) {
            $topEventsQuery->withCount([
                'registrations' => function($query) {
                    $query->where('status', '!=', 'cancelled');
                }
            ]);
        } else {
            // If no status column, count all registrations
            $topEventsQuery->withCount('registrations');
        }
        
        $topEvents = $topEventsQuery->orderBy('registrations_count', 'desc')
            ->take(10)
            ->get()
            ->map(function($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'event_date' => $event->event_date,
                    'category' => $event->category,
                    'registration_count' => $event->registrations_count ?? 0,
                ];
            });

        $response = [
            'success' => true,
            'statistics' => $stats, // Changed from 'stats' to 'statistics' for frontend compatibility
            'stats' => $stats, // Keep for backward compatibility
            'recent_events' => $recentEvents,
            'upcoming_events' => $upcomingEvents,
            'monthly_events' => $monthlyEventsData,
            'monthly_attendees' => $monthlyAttendeesData,
            'top_events' => $topEvents,
        ];
        
        // Log response for debugging (without sensitive data)
        Log::info('Dashboard response', [
            'statistics' => $stats,
            'recent_events_count' => count($recentEvents),
            'upcoming_events_count' => count($upcomingEvents),
            'monthly_events_count' => count($monthlyEventsData),
            'monthly_attendees_count' => count($monthlyAttendeesData),
            'top_events_count' => count($topEvents),
        ]);
        
        return response()->json($response);
    }

    /**
     * Get admin profile
     */
    public function profile(Request $request)
    {
        $admin = $request->user();
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'username' => $admin->username ?? null,
                'role' => 'admin',
            ],
        ]);
    }

    /**
     * Update admin profile
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:admins,email,' . $request->user()->id,
        ]);

        $request->user()->update($request->only(['name', 'email']));

        return response()->json([
            'success' => true,
            'message' => 'Profile berhasil diupdate.',
            'user' => $request->user(),
        ]);
    }

    /**
     * Change admin password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $admin = $request->user();

        if (!\Hash::check($request->current_password, $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password saat ini tidak valid.',
            ], 400);
        }

        $admin->update([
            'password' => $request->new_password,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah.',
        ]);
    }

    /**
     * Get app settings
     */
    public function settings(Request $request)
    {
        // TODO: Implement settings from database or config
        return response()->json([
            'success' => true,
            'settings' => [
                'app_name' => config('app.name'),
                'app_url' => config('app.url'),
            ],
        ]);
    }

    /**
     * Update app settings
     */
    public function updateSettings(Request $request)
    {
        // TODO: Implement settings update
        return response()->json([
            'success' => true,
            'message' => 'Settings berhasil diupdate.',
        ]);
    }

    /**
     * Export data
     */
    public function export(Request $request)
    {
        try {
        $type = $request->get('type', 'events');
        $format = $request->get('format', 'csv');

            if ($format !== 'csv') {
                return response()->json([
                    'success' => false,
                    'message' => 'Format tidak didukung. Gunakan format CSV.',
                ], 400);
            }
            
            if ($type === 'events') {
                $events = Event::withCount('registrations')->get();
                
                $csvData = [];
                $csvData[] = ['No', 'Judul Event', 'Tanggal', 'Lokasi', 'Kategori', 'Harga', 'Status', 'Jumlah Peserta'];
                
                $no = 1;
                foreach ($events as $event) {
                    // Safely format event_date
                    $eventDate = '-';
                    if ($event->event_date) {
                        try {
                            $eventDate = $event->event_date instanceof \Carbon\Carbon 
                                ? $event->event_date->format('Y-m-d')
                                : Carbon::parse($event->event_date)->format('Y-m-d');
                        } catch (\Exception $e) {
                            $eventDate = is_string($event->event_date) ? $event->event_date : '-';
                        }
                    }
                    
                    $csvData[] = [
                        $no++,
                        $event->title,
                        $eventDate,
                        $event->location ?? '-',
                        $event->category ?? '-',
                        $event->is_free ? 'Gratis' : 'Rp ' . number_format($event->price, 0, ',', '.'),
                        $event->is_published ? 'Published' : 'Draft',
                        $event->registrations_count ?? 0,
                    ];
                }
                
                $filename = 'events_' . date('Y-m-d') . '.csv';
                $output = fopen('php://temp', 'r+');
                fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
                foreach ($csvData as $row) {
                    fputcsv($output, $row);
                }
                rewind($output);
                $csvContent = stream_get_contents($output);
                fclose($output);
                
                return response($csvContent, 200)
                    ->header('Content-Type', 'text/csv; charset=UTF-8')
                    ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
                    
            } elseif ($type === 'registrations' || $type === 'participants') {
                $hasStatusColumn = Schema::hasColumn('registrations', 'status');
                $registrationsQuery = EventRegistration::with(['user', 'event', 'attendance']);
                
                if ($hasStatusColumn) {
                    $registrationsQuery->where('status', '!=', 'cancelled');
                }
                
                $registrations = $registrationsQuery->get();
                
                $csvData = [];
                $csvData[] = ['No', 'Nama', 'Email', 'Event', 'Tanggal Event', 'Status', 'Tanggal Daftar', 'Status Kehadiran'];
                
                $no = 1;
                foreach ($registrations as $reg) {
                    $user = $reg->user;
                    $event = $reg->event;
                    $attendance = $reg->attendance;
                    
                    // Safely format event_date
                    $eventDate = '-';
                    if ($event && $event->event_date) {
                        try {
                            $eventDate = $event->event_date instanceof \Carbon\Carbon 
                                ? $event->event_date->format('Y-m-d')
                                : Carbon::parse($event->event_date)->format('Y-m-d');
                        } catch (\Exception $e) {
                            $eventDate = is_string($event->event_date) ? $event->event_date : '-';
                        }
                    }
                    
                    // Safely format registered_at or created_at
                    $registrationDate = '-';
                    if ($reg->registered_at) {
                        try {
                            $registrationDate = $reg->registered_at instanceof \Carbon\Carbon 
                                ? $reg->registered_at->format('Y-m-d H:i:s')
                                : Carbon::parse($reg->registered_at)->format('Y-m-d H:i:s');
                        } catch (\Exception $e) {
                            $registrationDate = is_string($reg->registered_at) ? $reg->registered_at : '-';
                        }
                    } elseif ($reg->created_at) {
                        try {
                            $registrationDate = $reg->created_at instanceof \Carbon\Carbon 
                                ? $reg->created_at->format('Y-m-d H:i:s')
                                : Carbon::parse($reg->created_at)->format('Y-m-d H:i:s');
                        } catch (\Exception $e) {
                            $registrationDate = is_string($reg->created_at) ? $reg->created_at : '-';
                        }
                    }
                    
                    $csvData[] = [
                        $no++,
                        $user->name ?? $reg->name ?? 'N/A',
                        $user->email ?? $reg->email ?? 'N/A',
                        $event->title ?? 'N/A',
                        $eventDate,
                        $reg->status ?? 'registered',
                        $registrationDate,
                        $attendance ? 'Hadir' : 'Tidak hadir',
                    ];
                }
                
                $filename = 'participants_' . date('Y-m-d') . '.csv';
                $output = fopen('php://temp', 'r+');
                fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
                foreach ($csvData as $row) {
                    fputcsv($output, $row);
                }
                rewind($output);
                $csvContent = stream_get_contents($output);
                fclose($output);
                
                return response($csvContent, 200)
                    ->header('Content-Type', 'text/csv; charset=UTF-8')
                    ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
                    
            } elseif ($type === 'attendances') {
                $attendances = Attendance::with(['user', 'event'])->get();
                
                $csvData = [];
                $csvData[] = ['No', 'Nama', 'Email', 'Event', 'Tanggal Event', 'Tanggal Hadir', 'Status'];
                
                $no = 1;
                foreach ($attendances as $att) {
                    $user = $att->user;
                    $event = $att->event;
                    
                    // Safely format event_date
                    $eventDate = '-';
                    if ($event && $event->event_date) {
                        try {
                            $eventDate = $event->event_date instanceof \Carbon\Carbon 
                                ? $event->event_date->format('Y-m-d')
                                : Carbon::parse($event->event_date)->format('Y-m-d');
                        } catch (\Exception $e) {
                            $eventDate = is_string($event->event_date) ? $event->event_date : '-';
                        }
                    }
                    
                    // Safely format checked_in_at or attendance_time
                    $attendanceDate = '-';
                    if ($att->checked_in_at) {
                        try {
                            $attendanceDate = $att->checked_in_at instanceof \Carbon\Carbon 
                                ? $att->checked_in_at->format('Y-m-d H:i:s')
                                : Carbon::parse($att->checked_in_at)->format('Y-m-d H:i:s');
                        } catch (\Exception $e) {
                            $attendanceDate = is_string($att->checked_in_at) ? $att->checked_in_at : '-';
                        }
                    } elseif ($att->attendance_time) {
                        try {
                            $attendanceDate = $att->attendance_time instanceof \Carbon\Carbon 
                                ? $att->attendance_time->format('Y-m-d H:i:s')
                                : Carbon::parse($att->attendance_time)->format('Y-m-d H:i:s');
                        } catch (\Exception $e) {
                            $attendanceDate = is_string($att->attendance_time) ? $att->attendance_time : '-';
                        }
                    }
                    
                    $csvData[] = [
                        $no++,
                        $user->name ?? 'N/A',
                        $user->email ?? 'N/A',
                        $event->title ?? 'N/A',
                        $eventDate,
                        $attendanceDate,
                        $att->status ?? 'present',
                    ];
                }
                
                $filename = 'attendances_' . date('Y-m-d') . '.csv';
                $output = fopen('php://temp', 'r+');
                fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
                foreach ($csvData as $row) {
                    fputcsv($output, $row);
                }
                rewind($output);
                $csvContent = stream_get_contents($output);
                fclose($output);
                
                return response($csvContent, 200)
                    ->header('Content-Type', 'text/csv; charset=UTF-8')
                    ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Tipe export tidak didukung.',
            ], 400);
            
        } catch (\Exception $e) {
            Log::error('Error exporting data: ' . $e->getMessage(), [
                'type' => $request->get('type'),
                'trace' => $e->getTraceAsString(),
            ]);
            
        return response()->json([
            'success' => false,
                'message' => 'Gagal mengekspor data. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get monthly events report
     */
    public function monthlyEvents(Request $request)
    {
        $year = $request->get('year', date('Y'));

        $events = Event::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', $year)
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $data = [];
        for ($i = 1; $i <= 12; $i++) {
            $data[] = [
                'month' => $i,
                'count' => $events->get($i)->count ?? 0,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get monthly attendees report
     */
    public function monthlyAttendees(Request $request)
    {
        $year = $request->get('year', date('Y'));

        $attendances = Attendance::selectRaw('MONTH(checked_in_at) as month, COUNT(*) as count')
            ->whereYear('checked_in_at', $year)
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $data = [];
        for ($i = 1; $i <= 12; $i++) {
            $data[] = [
                'month' => $i,
                'count' => $attendances->get($i)->count ?? 0,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get top 10 events
     */
    public function topEvents(Request $request)
    {
        $events = Event::select('events.*', DB::raw('COUNT(event_registrations.id) as registration_count'))
            ->leftJoin('event_registrations', 'events.id', '=', 'event_registrations.event_id')
            ->where('event_registrations.status', '!=', 'cancelled')
            ->orWhereNull('event_registrations.id')
            ->groupBy('events.id')
            ->orderBy('registration_count', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    /**
     * Export event participants
     */
    public function exportEventParticipants(Request $request, $id)
    {
        try {
        $event = Event::findOrFail($id);
            $format = $request->get('format', 'csv');
            
            // Get registrations with user data
            $hasStatusColumn = Schema::hasColumn('registrations', 'status');
            $registrationsQuery = EventRegistration::where('event_id', $id)
                ->with(['user', 'attendance']);
            
            if ($hasStatusColumn) {
                $registrationsQuery->where('status', '!=', 'cancelled');
            }
            
            $registrations = $registrationsQuery->get();

            if ($format === 'csv') {
                // Prepare CSV data
                $csvData = [];
                $csvData[] = ['No', 'Nama', 'Email', 'No. Handphone', 'Status', 'Tanggal Daftar', 'Status Kehadiran', 'Tanggal Hadir'];
                
                $no = 1;
                foreach ($registrations as $reg) {
                    $user = $reg->user;
                    $attendance = $reg->attendance;
                    
                    // Safely format registered_at or created_at
                    $registrationDate = '-';
                    if ($reg->registered_at) {
                        try {
                            $registrationDate = $reg->registered_at instanceof \Carbon\Carbon 
                                ? $reg->registered_at->format('Y-m-d H:i:s')
                                : Carbon::parse($reg->registered_at)->format('Y-m-d H:i:s');
                        } catch (\Exception $e) {
                            $registrationDate = is_string($reg->registered_at) ? $reg->registered_at : '-';
                        }
                    } elseif ($reg->created_at) {
                        try {
                            $registrationDate = $reg->created_at instanceof \Carbon\Carbon 
                                ? $reg->created_at->format('Y-m-d H:i:s')
                                : Carbon::parse($reg->created_at)->format('Y-m-d H:i:s');
                        } catch (\Exception $e) {
                            $registrationDate = is_string($reg->created_at) ? $reg->created_at : '-';
                        }
                    }
                    
                    // Safely format attendance date
                    $attendanceDate = '-';
                    if ($attendance) {
                        $dateField = $attendance->checked_in_at ?? $attendance->attendance_time ?? null;
                        if ($dateField) {
                            try {
                                $attendanceDate = $dateField instanceof \Carbon\Carbon 
                                    ? $dateField->format('Y-m-d H:i:s')
                                    : Carbon::parse($dateField)->format('Y-m-d H:i:s');
                            } catch (\Exception $e) {
                                $attendanceDate = is_string($dateField) ? $dateField : '-';
                            }
                        }
                    }
                    
                    $csvData[] = [
                        $no++,
                        $user->name ?? $reg->name ?? 'N/A',
                        $user->email ?? $reg->email ?? 'N/A',
                        $user->phone ?? $reg->phone ?? '-',
                        $reg->status ?? 'registered',
                        $registrationDate,
                        $attendance ? ($attendance->status ?? 'present') : 'Tidak hadir',
                        $attendanceDate,
                    ];
                }
                
                // Generate CSV content
                $filename = 'event_' . $id . '_participants_' . date('Y-m-d') . '.csv';
                $output = fopen('php://temp', 'r+');
                
                // Add BOM for UTF-8 (for Excel compatibility)
                fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
                
                foreach ($csvData as $row) {
                    fputcsv($output, $row);
                }
                
                rewind($output);
                $csvContent = stream_get_contents($output);
                fclose($output);
                
                return response($csvContent, 200)
                    ->header('Content-Type', 'text/csv; charset=UTF-8')
                    ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Format tidak didukung. Gunakan format CSV.',
            ], 400);
            
        } catch (\Exception $e) {
            Log::error('Error exporting event participants: ' . $e->getMessage(), [
                'event_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            
        return response()->json([
            'success' => false,
                'message' => 'Gagal mengekspor data peserta. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all participants (registrations)
     */
    public function participants(Request $request)
    {
        $registrations = EventRegistration::with(['user', 'event', 'attendance'])
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $registrations->map(function ($registration) {
            return [
                'id' => $registration->id,
                'user_id' => $registration->user_id,
                'user_name' => $registration->user->name ?? $registration->name ?? 'N/A',
                'user_email' => $registration->user->email ?? $registration->email ?? 'N/A',
                'event_id' => $registration->event_id,
                'event_title' => $registration->event->title ?? 'N/A',
                'event_date' => $registration->event->event_date ?? null,
                'status' => $registration->status ?? 'pending',
                'registered_at' => $registration->registered_at ?? $registration->created_at,
                'attendance_status' => $registration->attendance->status ?? null,
                'attended_at' => $registration->attendance->checked_in_at ?? null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get participants statistics
     */
    public function participantsStatistics(Request $request)
    {
        $hasStatusColumnReg = Schema::hasColumn('registrations', 'status');
        $hasStatusColumnAtt = Schema::hasColumn('attendances', 'status');
        
        $total = EventRegistration::count();
        $confirmed = $hasStatusColumnReg 
            ? EventRegistration::where('status', 'confirmed')->orWhere('status', 'registered')->count()
            : $total; // If no status column, all are considered confirmed
        $pending = $hasStatusColumnReg 
            ? EventRegistration::where('status', 'pending')->count()
            : 0;
        $attended = $hasStatusColumnAtt 
            ? Attendance::where('status', 'present')->count()
            : Attendance::count(); // If no status column, all are considered attended
        $cancelled = $hasStatusColumnReg 
            ? EventRegistration::where('status', 'cancelled')->count()
            : 0;

        return response()->json([
            'success' => true,
            'total_participants' => $total,
            'confirmed' => $confirmed,
            'pending' => $pending,
            'attended' => $attended,
            'cancelled' => $cancelled,
        ]);
    }

    /**
     * Get all messages (contact messages)
     */
    public function messages(Request $request)
    {
        // Check if messages/contacts table exists
        if (!Schema::hasTable('contacts') && !Schema::hasTable('messages')) {
            return response()->json([
                'success' => true,
                'messages' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 15,
                    'total' => 0,
                ],
                'stats' => [
                    'total' => 0,
                    'unread' => 0,
                    'read' => 0,
                ],
            ]);
        }

        $tableName = Schema::hasTable('contacts') ? 'contacts' : 'messages';
        $page = $request->get('page', 1);
        $perPage = 15;
        $status = $request->get('status', 'all');
        $search = $request->get('search', '');

        $query = DB::table($tableName);

        if ($status !== 'all') {
            // Check if status column exists
            if (Schema::hasColumn($tableName, 'status')) {
                if ($status === 'read') {
                    $query->where('status', 'read')->orWhere('read_at', '!=', null);
                } elseif ($status === 'unread') {
                    $query->where(function($q) {
                        $q->where('status', 'unread')
                          ->orWhere('status', null)
                          ->orWhere('read_at', null);
                    });
                }
            } elseif (Schema::hasColumn($tableName, 'read_at')) {
                if ($status === 'read') {
                    $query->whereNotNull('read_at');
                } elseif ($status === 'unread') {
                    $query->whereNull('read_at');
                }
            }
        }

        if ($search) {
            $query->where(function($q) use ($search, $tableName) {
                if (Schema::hasColumn($tableName, 'name')) {
                    $q->where('name', 'like', "%{$search}%");
                }
                if (Schema::hasColumn($tableName, 'email')) {
                    $q->orWhere('email', 'like', "%{$search}%");
                }
                if (Schema::hasColumn($tableName, 'subject')) {
                    $q->orWhere('subject', 'like', "%{$search}%");
                }
                if (Schema::hasColumn($tableName, 'message')) {
                    $q->orWhere('message', 'like', "%{$search}%");
                }
            });
        }

        $total = $query->count();
        $messages = $query->orderBy('created_at', 'desc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // Stats
        $statsQuery = DB::table($tableName);
        $statsTotal = $statsQuery->count();
        
        $statsRead = 0;
        $statsUnread = 0;
        if (Schema::hasColumn($tableName, 'read_at')) {
            $statsRead = $statsQuery->clone()->whereNotNull('read_at')->count();
            $statsUnread = $statsTotal - $statsRead;
        } elseif (Schema::hasColumn($tableName, 'status')) {
            $statsRead = $statsQuery->clone()->where('status', 'read')->count();
            $statsUnread = $statsQuery->clone()->where('status', '!=', 'read')->orWhereNull('status')->count();
        }

        return response()->json([
            'success' => true,
            'messages' => [
                'data' => $messages,
                'current_page' => (int) $page,
                'last_page' => (int) ceil($total / $perPage),
                'per_page' => $perPage,
                'total' => $total,
            ],
            'stats' => [
                'total' => $statsTotal,
                'read' => $statsRead,
                'unread' => $statsUnread,
            ],
        ]);
    }

    /**
     * Mark message as read
     */
    public function markMessageAsRead(Request $request, $id)
    {
        $tableName = Schema::hasTable('contacts') ? 'contacts' : 'messages';
        
        if (!Schema::hasTable($tableName)) {
            return response()->json([
                'success' => false,
                'message' => 'Messages table not found.',
            ], 404);
        }

        if (Schema::hasColumn($tableName, 'read_at')) {
            DB::table($tableName)->where('id', $id)->update(['read_at' => now()]);
        } elseif (Schema::hasColumn($tableName, 'status')) {
            DB::table($tableName)->where('id', $id)->update(['status' => 'read']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Message marked as read.',
        ]);
    }

    /**
     * Delete message
     */
    public function deleteMessage(Request $request, $id)
    {
        $tableName = Schema::hasTable('contacts') ? 'contacts' : 'messages';
        
        if (!Schema::hasTable($tableName)) {
            return response()->json([
                'success' => false,
                'message' => 'Messages table not found.',
            ], 404);
        }

        DB::table($tableName)->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted.',
        ]);
    }
}
