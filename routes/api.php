<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BannerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::get('/banners', [BannerController::class, 'index']); // Public banners endpoint

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/admin/login', [AuthController::class, 'loginAdmin']);
    Route::post('/request-reset', [AuthController::class, 'requestReset']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Events
    Route::post('/events/{id}/register', [EventController::class, 'register']);
    Route::post('/events/{id}/attendance', [EventController::class, 'attendance']);
    Route::get('/events/{id}/attendance/status', [EventController::class, 'attendanceStatus']);
    Route::post('/events/{id}/payment', [EventController::class, 'payment']);

    // User routes
    Route::prefix('user')->group(function () {
        Route::get('/event-history', [UserController::class, 'eventHistory']);
        Route::get('/transactions', [UserController::class, 'transactions']);
        Route::get('/event-details/{id}', [UserController::class, 'eventDetail']);
        Route::post('/change-password', [UserController::class, 'changePassword']);
    });

    // Me routes (shortcuts)
    Route::prefix('me')->group(function () {
        Route::get('/registrations', [UserController::class, 'registrations']);
        Route::get('/history', [UserController::class, 'history']);
        Route::get('/certificates', [UserController::class, 'certificates']);
        Route::get('/wishlist', [UserController::class, 'wishlist']);
    });

    // Wishlist routes
    Route::get('/wishlist/check/{id}', [UserController::class, 'checkWishlist']);
    Route::post('/events/{id}/wishlist', [UserController::class, 'toggleWishlist']);
    Route::get('/wishlist', [UserController::class, 'wishlist']);

    // Registrations
    Route::delete('/registrations/{id}', [UserController::class, 'cancelRegistration']);
    Route::post('/registrations/{id}/generate-certificate', [UserController::class, 'generateCertificate']);
    Route::get('/registrations/{id}/certificate-status', [UserController::class, 'certificateStatus']);

    // Payments
    Route::get('/payments/{id}/status', [UserController::class, 'paymentStatus']);

    // Certificates
    Route::get('/certificates/{id}/download', [UserController::class, 'downloadCertificate']);
});

// Admin routes (separate from user routes - admin middleware handles authentication itself)
Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/profile', [AdminController::class, 'profile']);
        Route::put('/profile', [AdminController::class, 'updateProfile']);
        Route::put('/profile/password', [AdminController::class, 'changePassword']);
        Route::get('/settings', [AdminController::class, 'settings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);

        // Events management
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{id}', [EventController::class, 'update']);
        Route::delete('/events/{id}', [EventController::class, 'destroy']);
        Route::post('/events/{id}/publish', [EventController::class, 'publish']);

        // Banners
        Route::get('/banners', [BannerController::class, 'index']);
        Route::post('/banners', [BannerController::class, 'store']);
        Route::post('/banners/{id}', [BannerController::class, 'update']);
        Route::delete('/banners/{id}', [BannerController::class, 'destroy']);
        Route::post('/banners/{id}/toggle', [BannerController::class, 'toggle']);

        // Export
        Route::get('/export', [AdminController::class, 'export']);
        Route::get('/reports/monthly-events', [AdminController::class, 'monthlyEvents']);
        Route::get('/reports/monthly-attendees', [AdminController::class, 'monthlyAttendees']);
        Route::get('/reports/top10-events', [AdminController::class, 'topEvents']);
        Route::get('/events/{id}/export', [AdminController::class, 'exportEventParticipants']);
    });
});
