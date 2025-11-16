<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only redirect if we're NOT behind a proxy (Railway handles HTTPS at proxy level)
        // Check if request is actually insecure (not just missing X-Forwarded-Proto)
        $isBehindProxy = $request->headers->has('X-Forwarded-Proto') || 
                         $request->headers->has('X-Forwarded-For') ||
                         $request->server->has('HTTP_X_FORWARDED_PROTO');
        
        // Only redirect if not behind proxy AND actually insecure
        if (!$isBehindProxy && 
            (config('app.env') === 'production' || (config('app.url') && str_starts_with(config('app.url'), 'https://'))) &&
            !$request->secure() && 
            !$request->is('health') && 
            !$request->is('up')) {
            return redirect()->secure($request->getRequestUri(), 301);
        }

        return $next($request);
    }
}

