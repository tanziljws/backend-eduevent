<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminController extends Controller
{
    /**
     * Get admin dashboard data
     */
    public function dashboard(Request $request)
    {
        $year = $request->get('year', date('Y'));

        // Calculate stats
        $totalEvents = Event::count();
        $publishedEvents = Event::where('is_published', true)->count();
        $totalRegistrations = EventRegistration::where('status', '!=', 'cancelled')->count();
        $totalAttendances = Attendance::count();
        $totalAttendees = Attendance::where('status', 'present')->count();
        
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
                $totalRevenue = \App\Models\Payment::where('status', 'paid')
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
            'registrations_this_year' => EventRegistration::whereYear('created_at', $year)
                ->where('status', '!=', 'cancelled')
                ->count(),
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
        $monthlyAttendees = Attendance::selectRaw('MONTH(checked_in_at) as month, COUNT(*) as count')
            ->whereYear('checked_in_at', $year)
            ->where('status', 'present')
            ->groupBy('month')
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
        $topEvents = Event::select('events.*', DB::raw('COUNT(registrations.id) as registration_count'))
            ->leftJoin('registrations', 'events.id', '=', 'registrations.event_id')
            ->where(function($query) {
                $query->where('registrations.status', '!=', 'cancelled')
                      ->orWhereNull('registrations.status');
            })
            ->orWhereNull('registrations.id')
            ->groupBy('events.id')
            ->orderBy('registration_count', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'statistics' => $stats, // Changed from 'stats' to 'statistics' for frontend compatibility
            'stats' => $stats, // Keep for backward compatibility
            'recent_events' => $recentEvents,
            'upcoming_events' => $upcomingEvents,
            'monthly_events' => $monthlyEventsData,
            'monthly_attendees' => $monthlyAttendeesData,
            'top_events' => $topEvents,
        ]);
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
        $type = $request->get('type', 'events');
        $format = $request->get('format', 'csv');

        // TODO: Implement export logic
        return response()->json([
            'success' => false,
            'message' => 'Export feature coming soon.',
        ], 501);
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
        $event = Event::findOrFail($id);
        $registrations = EventRegistration::where('event_id', $id)
            ->where('status', '!=', 'cancelled')
            ->with('user')
            ->get();

        // TODO: Implement CSV/Excel export
        return response()->json([
            'success' => false,
            'message' => 'Export feature coming soon.',
        ], 501);
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
        $total = EventRegistration::count();
        $confirmed = EventRegistration::where('status', 'confirmed')->orWhere('status', 'registered')->count();
        $pending = EventRegistration::where('status', 'pending')->count();
        $attended = Attendance::where('status', 'present')->count();
        $cancelled = EventRegistration::where('status', 'cancelled')->count();

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
