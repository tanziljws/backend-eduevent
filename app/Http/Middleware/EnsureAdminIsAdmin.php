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
                // Get expected admin class name
                $adminClassName = \App\Models\Admin::class;
                
                // Check if token belongs to Admin model
                // Use both direct comparison and string comparison for compatibility
                if ($token->tokenable_type === $adminClassName || $token->tokenable_type === 'App\\Models\\Admin') {
                    $admin = $token->tokenable;
                    
                    // Double check it's actually an Admin instance
                    if (!($admin instanceof \App\Models\Admin)) {
                        \Log::warning('Token tokenable_type is Admin but instance is not Admin', [
                            'tokenable_type' => $token->tokenable_type,
                            'tokenable_class' => get_class($admin),
                        ]);
                        return response()->json([
                            'success' => false,
                            'message' => 'Forbidden. Admin access required. Please login as admin.',
                        ], 403);
                    }
                } else {
                    // Token exists but belongs to User, not Admin - reject immediately
                    \Log::warning('Admin route accessed with non-admin token', [
                        'tokenable_type' => $token->tokenable_type,
                        'expected' => $adminClassName,
                        'token_id' => $token->id,
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden. Admin access required. Please logout and login as admin using admin credentials.',
                        'debug' => config('app.debug') ? [
                            'token_type' => $token->tokenable_type,
                            'expected_type' => $adminClassName,
                        ] : null,
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
