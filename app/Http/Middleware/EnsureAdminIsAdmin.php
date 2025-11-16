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
        $admin = null;

        // Check if using Sanctum token (API request with Bearer token)
        $bearerToken = $request->bearerToken();
        
        if ($bearerToken) {
            // Check token directly from database
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($bearerToken);
            
            if ($token) {
                // Check if token belongs to Admin model
                if ($token->tokenable_type === \App\Models\Admin::class) {
                    $admin = $token->tokenable;
                } else {
                    // Token exists but belongs to User, not Admin - reject immediately
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden. Admin access required. Please login as admin.',
                    ], 403);
                }
            } else {
                // Token not found in database - invalid token
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Invalid or expired token.',
                ], 401);
            }
        } else {
            // No bearer token - try session-based admin guard (for web routes)
            $admin = auth('admin')->user();
        }

        // Check if admin is authenticated
        if (!$admin || !($admin instanceof \App\Models\Admin)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Admin access required. Please login as admin.',
            ], 403);
        }

        return $next($request);
    }
}
