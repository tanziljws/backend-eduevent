<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CleanupUnverifiedUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:cleanup-unverified 
                            {--hours=24 : Hours after OTP expires to keep user before deletion}
                            {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cleanup unverified users whose OTP has expired';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $hours = (int) $this->option('hours');
        $dryRun = $this->option('dry-run');
        
        // Find unverified users with expired OTP
        $cutoffTime = Carbon::now()->subHours($hours);
        
        $query = User::where('is_verified', false)
            ->where(function($q) use ($cutoffTime) {
                // OTP expired and past grace period
                $q->where(function($subQ) use ($cutoffTime) {
                    $subQ->whereNotNull('otp_expires_at')
                         ->where('otp_expires_at', '<', $cutoffTime);
                })
                // Or no OTP expiry set but account created before cutoff
                ->orWhere(function($subQ) use ($cutoffTime) {
                    $subQ->whereNull('otp_expires_at')
                         ->where('created_at', '<', $cutoffTime);
                });
            });
        
        $count = $query->count();
        
        if ($count === 0) {
            $this->info('No unverified users found to cleanup.');
            return 0;
        }
        
        if ($dryRun) {
            $this->info("DRY RUN: Found {$count} unverified user(s) that would be deleted:");
            $users = $query->get(['id', 'email', 'name', 'created_at', 'otp_expires_at']);
            
            $this->table(
                ['ID', 'Email', 'Name', 'Created At', 'OTP Expires At'],
                $users->map(function($user) {
                    return [
                        $user->id,
                        $user->email,
                        $user->name,
                        $user->created_at?->format('Y-m-d H:i:s'),
                        $user->otp_expires_at?->format('Y-m-d H:i:s') ?? 'N/A',
                    ];
                })
            );
            
            return 0;
        }
        
        $users = $query->get();
        
        $this->info("Found {$count} unverified user(s) to cleanup...");
        
        $deleted = 0;
        foreach ($users as $user) {
            try {
                Log::info('Cleanup: Deleting unverified user', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'created_at' => $user->created_at,
                    'otp_expires_at' => $user->otp_expires_at,
                ]);
                
                $user->delete();
                $deleted++;
            } catch (\Exception $e) {
                $this->error("Failed to delete user ID {$user->id}: " . $e->getMessage());
                Log::error('Failed to delete unverified user during cleanup', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        $this->info("Successfully deleted {$deleted} unverified user(s).");
        
        return 0;
    }
}

