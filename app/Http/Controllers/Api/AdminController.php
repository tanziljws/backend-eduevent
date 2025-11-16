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

        $stats = [
            'total_events' => Event::count(),
            'published_events' => Event::where('is_published', true)->count(),
            'total_registrations' => EventRegistration::where('status', '!=', 'cancelled')->count(),
            'total_users' => Schema::hasColumn('users', 'is_verified') 
                ? User::where('is_verified', true)->count()
                : User::whereNotNull('email_verified_at')->count(),
            'total_attendances' => Attendance::count(),
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

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'recent_events' => $recentEvents,
            'upcoming_events' => $upcomingEvents,
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
}
