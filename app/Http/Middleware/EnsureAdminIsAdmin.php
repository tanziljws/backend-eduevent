<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = null;
        $admin = null;

        // First, check if using Sanctum token (API request)
        if ($request->bearerToken()) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
            
            if ($token) {
                // Check if token belongs to Admin model
                if ($token->tokenable_type === \App\Models\Admin::class) {
                    $admin = $token->tokenable;
                } else {
                    // Token exists but belongs to User, not Admin
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden. Admin access required.',
                    ], 403);
                }
            }
        }

        // If no admin from Sanctum token, try Sanctum's user method
        if (!$admin) {
            $user = $request->user('sanctum');
            if ($user instanceof \App\Models\Admin) {
                $admin = $user;
            }
        }

        // If still no admin, try session-based admin guard
        if (!$admin) {
            $admin = auth('admin')->user();
        }

        // Check if admin is authenticated
        if (!$admin || !($admin instanceof \App\Models\Admin)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
