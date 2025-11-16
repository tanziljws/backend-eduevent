<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use App\Models\Like;
use App\Models\Bookmark;
use App\Models\Comment;
use App\Models\Download;
use App\Observers\LikeObserver;
use App\Observers\BookmarkObserver;
use App\Observers\CommentObserver;
use App\Observers\DownloadObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS in production or when APP_URL uses HTTPS
        if (config('app.env') === 'production' || (config('app.url') && str_starts_with(config('app.url'), 'https://'))) {
            URL::forceScheme('https');
            // Force secure cookies
            if (config('session.secure') !== true) {
                config(['session.secure' => true]);
            }
        }
        
        Like::observe(LikeObserver::class);
        Bookmark::observe(BookmarkObserver::class);
        Comment::observe(CommentObserver::class);
        Download::observe(DownloadObserver::class);
        
        // View composer untuk memastikan user data selalu fresh di navbar
        View::composer('layouts.app', function ($view) {
            if (Auth::guard('user')->check()) {
                // Refresh user data dari database
                $freshUser = Auth::guard('user')->user()->fresh();
                if ($freshUser) {
                    Auth::guard('user')->setUser($freshUser);
                }
            }
        });
    }
}
