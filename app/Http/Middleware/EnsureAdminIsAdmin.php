<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class EnsureAdminIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if admins table exists first
        if (!Schema::hasTable('admins')) {
            Log::error('Admin middleware: admins table does not exist');
            return response()->json([
                'success' => false,
                'message' => 'Admin system not configured. Please run migrations to create admins table.',
                'error' => config('app.debug') ? 'Table "admins" does not exist' : null,
            ], 500);
        }

        $admin = null;

        // Check if using Sanctum token (API request with Bearer token)
        $bearerToken = $request->bearerToken();
        
        if ($bearerToken) {
            try {
                // Check token directly from database
                $token = \Laravel\Sanctum\PersonalAccessToken::findToken($bearerToken);
                
                if ($token) {
                    // Get expected admin class name
                    $adminClassName = \App\Models\Admin::class;
                    
                    // Log token info for debugging
                    Log::debug('Admin middleware token check', [
                        'token_id' => $token->id,
                        'tokenable_type' => $token->tokenable_type,
                        'expected_type' => $adminClassName,
                        'tokenable_id' => $token->tokenable_id,
                    ]);
                    
                    // Check if token belongs to Admin model OR User model with role='admin' (fallback)
                    $userClassName = \App\Models\User::class;
                    $isAdminModel = ($token->tokenable_type === $adminClassName || $token->tokenable_type === 'App\\Models\\Admin');
                    $isUserModel = ($token->tokenable_type === $userClassName || $token->tokenable_type === 'App\\Models\\User');
                    
                    if ($isAdminModel || $isUserModel) {
                        try {
                            $tokenable = $token->tokenable;
                            
                            // If it's User model, check if role is 'admin'
                            if ($isUserModel) {
                                if (!($tokenable instanceof \App\Models\User)) {
                                    Log::warning('Token tokenable_type is User but instance is not User', [
                                        'tokenable_type' => $token->tokenable_type,
                                        'tokenable_class' => get_class($tokenable),
                                        'tokenable_id' => $token->tokenable_id,
                                    ]);
                                    return response()->json([
                                        'success' => false,
                                        'message' => 'Forbidden. Admin access required. Please login as admin.',
                                    ], 403);
                                }
                                
                                // Check if user has admin role
                                if (!Schema::hasColumn('users', 'role') || $tokenable->role !== 'admin') {
                                    Log::warning('User token used but user does not have admin role', [
                                        'user_id' => $tokenable->id,
                                        'email' => $tokenable->email,
                                        'role' => $tokenable->role ?? 'N/A',
                                    ]);
                                    return response()->json([
                                        'success' => false,
                                        'message' => 'Forbidden. Admin access required. Please login as admin.',
                                    ], 403);
                                }
                                
                                // User with admin role is valid - treat as admin
                                $admin = $tokenable;
                                Log::info('Admin authenticated successfully (via User model with admin role)', [
                                    'admin_id' => $admin->id,
                                    'email' => $admin->email,
                                    'role' => $admin->role,
                                ]);
                            } else {
                                // It's Admin model
                                if (!($tokenable instanceof \App\Models\Admin)) {
                                    Log::warning('Token tokenable_type is Admin but instance is not Admin', [
                                        'tokenable_type' => $token->tokenable_type,
                                        'tokenable_class' => get_class($tokenable),
                                        'tokenable_id' => $token->tokenable_id,
                                    ]);
                                    return response()->json([
                                        'success' => false,
                                        'message' => 'Forbidden. Admin access required. Please login as admin.',
                                    ], 403);
                                }
                                
                                $admin = $tokenable;
                                Log::info('Admin authenticated successfully (via Admin model)', [
                                    'admin_id' => $admin->id,
                                    'email' => $admin->email,
                                ]);
                            }
                        } catch (\Exception $e) {
                            Log::error('Error loading admin from token', [
                                'error' => $e->getMessage(),
                                'tokenable_type' => $token->tokenable_type,
                                'tokenable_id' => $token->tokenable_id,
                            ]);
                            return response()->json([
                                'success' => false,
                                'message' => 'Error loading admin account.',
                                'error' => config('app.debug') ? $e->getMessage() : null,
                            ], 500);
                        }
                    } else {
                        // Token exists but belongs to User, not Admin - reject immediately
                        Log::warning('Admin route accessed with non-admin token', [
                            'tokenable_type' => $token->tokenable_type,
                            'expected' => $adminClassName,
                            'token_id' => $token->id,
                            'tokenable_id' => $token->tokenable_id,
                        ]);
                        return response()->json([
                            'success' => false,
                            'message' => 'Forbidden. Admin access required. Please logout and login as admin using admin credentials.',
                            'debug' => config('app.debug') ? [
                                'token_type' => $token->tokenable_type,
                                'expected_type' => $adminClassName,
                                'hint' => 'The token belongs to ' . $token->tokenable_type . ', not Admin model.',
                            ] : null,
                        ], 403);
                    }
                } else {
                    // Token not found in database - invalid token
                    Log::warning('Admin middleware: invalid or expired token', [
                        'token_prefix' => substr($bearerToken, 0, 10) . '...',
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized. Invalid or expired token. Please login again.',
                    ], 401);
                }
            } catch (\Exception $e) {
                Log::error('Error checking token in admin middleware', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Error validating token.',
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 500);
            }
        } else {
            // No bearer token - try session-based admin guard (for web routes)
            try {
                $admin = auth('admin')->user();
            } catch (\Exception $e) {
                Log::warning('Error checking admin session', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Check if admin is authenticated
        // Accept both Admin model and User model with role='admin'
        $isValidAdmin = false;
        if ($admin) {
            if ($admin instanceof \App\Models\Admin) {
                $isValidAdmin = true;
            } elseif ($admin instanceof \App\Models\User) {
                // Check if user has admin role
                if (Schema::hasColumn('users', 'role') && $admin->role === 'admin') {
                    $isValidAdmin = true;
                }
            }
        }
        
        if (!$isValidAdmin) {
            Log::warning('Admin middleware: no valid admin authenticated', [
                'has_bearer_token' => !empty($bearerToken),
                'has_admin' => !is_null($admin),
                'admin_type' => $admin ? get_class($admin) : null,
                'admin_role' => ($admin instanceof \App\Models\User) ? ($admin->role ?? 'N/A') : 'N/A',
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Admin access required. Please login as admin.',
                'debug' => config('app.debug') ? [
                    'has_bearer_token' => !empty($bearerToken),
                    'has_admin' => !is_null($admin),
                    'admin_type' => $admin ? get_class($admin) : null,
                    'admin_role' => ($admin instanceof \App\Models\User) ? ($admin->role ?? 'N/A') : 'N/A',
                ] : null,
            ], 403);
        }

        return $next($request);
    }
}
