<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Enable CORS for API routes (configuration in config/cors.php)
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        
        // Redirect to appropriate login based on guard (for web routes only)
        $middleware->redirectGuestsTo(function ($request) {
            // Skip redirect for API routes
            if ($request->is('api/*')) {
                return null;
            }
            
            if ($request->is('admin') || $request->is('admin/*')) {
                return route('admin.login');
            }
            if ($request->is('petugas') || $request->is('petugas/*')) {
                return route('petugas.login');
            }
            return route('user.login');
        });
        
        // Trust proxies for HTTPS (Railway handles HTTPS at proxy level)
        $middleware->trustProxies();
        
        // Register admin middleware alias
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdminIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
