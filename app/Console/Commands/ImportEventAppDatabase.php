<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Event;
use App\Models\User;
use App\Models\EventRegistration;
use App\Models\Attendance;
use App\Models\Certificate;
use App\Models\Payment;
use App\Models\Banner;
use App\Models\Wishlist;
use Carbon\Carbon;

class ImportEventAppDatabase extends Command
{
    protected $signature = 'db:import-event-app {file}';
    protected $description = 'Import event_app database SQL file with proper field mapping';

    public function handle()
    {
        $filePath = $this->argument('file');
        
        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $this->info("Reading SQL file...");
        $sql = file_get_contents($filePath);

        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::statement('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"');

        try {
            // Import events first
            $this->info("Importing events...");
            $this->importEvents($sql);
            
            // Import users
            $this->info("Importing users...");
            $this->importUsers($sql);
            
            // Import registrations (mapping to event_registrations)
            $this->info("Importing registrations...");
            $this->importRegistrations($sql);
            
            // Import attendances
            $this->info("Importing attendances...");
            $this->importAttendances($sql);
            
            // Import certificates
            $this->info("Importing certificates...");
            $this->importCertificates($sql);
            
            // Import payments
            $this->info("Importing payments...");
            $this->importPayments($sql);
            
            // Import banners
            $this->info("Importing banners...");
            $this->importBanners($sql);
            
            // Import wishlists
            $this->info("Importing wishlists...");
            $this->importWishlists($sql);

            $this->info("✅ Import completed successfully!");
            
        } catch (\Exception $e) {
            $this->error("Import failed: " . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        return 0;
    }

    private function importEvents($sql)
    {
        // Extract events INSERT statements
        if (preg_match_all('/INSERT INTO `events`[^;]+;/i', $sql, $matches)) {
            foreach ($matches[0] as $insert) {
                // Replace table name and adjust field names if needed
                $insert = str_replace('`events`', '`events`', $insert);
                try {
                    DB::unprepared($insert);
                } catch (\Exception $e) {
                    if (!str_contains($e->getMessage(), 'Duplicate entry')) {
                        $this->warn("Event import warning: " . substr($e->getMessage(), 0, 100));
                    }
                }
            }
            $this->info("  - Events imported");
        }
    }

    private function importUsers($sql)
    {
        // Extract users INSERT statements and map to our structure
        if (preg_match_all('/INSERT INTO `users`[^;]+;/i', $sql, $matches)) {
            foreach ($matches[0] as $insert) {
                // Extract values from INSERT statement
                if (preg_match('/VALUES\s*\((.*?)\)/is', $insert, $valueMatch)) {
                    $values = $this->parseInsertValues($valueMatch[1]);
                    
                    foreach ($values as $row) {
                        try {
                            // Map old structure to new structure
                            $userData = [
                                'id' => $row[0] ?? null,
                                'name' => $row[1] ?? '',
                                'email' => strtolower(trim($row[2] ?? '')),
                                'phone' => $row[3] ?? null,
                                'address' => $row[4] ?? null,
                                'education' => $row[5] ?? null,
                                'email_verified_at' => $row[6] ?? null,
                                'password' => $row[7] ?? '',
                                'role' => $row[8] ?? 'participant',
                                'remember_token' => $row[9] ?? null,
                                'created_at' => $row[10] ?? now(),
                                'updated_at' => $row[11] ?? now(),
                                // Add fields for new structure
                                'username' => $this->generateUsername($row[1] ?? '', $row[2] ?? ''),
                                'is_verified' => !empty($row[6]), // verified if email_verified_at is set
                            ];

                            // Skip if already exists
                            if (User::where('email', $userData['email'])->exists()) {
                                continue;
                            }

                            User::create($userData);
                        } catch (\Exception $e) {
                            if (!str_contains($e->getMessage(), 'Duplicate')) {
                                $this->warn("  User import warning: " . substr($e->getMessage(), 0, 80));
                            }
                        }
                    }
                }
            }
            $this->info("  - Users imported");
        }
    }

    private function importRegistrations($sql)
    {
        // Extract registrations INSERT and map to event_registrations
        if (preg_match_all('/INSERT INTO `registrations`[^;]+;/i', $sql, $matches)) {
            foreach ($matches[0] as $insert) {
                if (preg_match('/VALUES\s*(.*?);/is', $insert, $valueMatch)) {
                    $values = $this->parseInsertValues($valueMatch[1]);
                    
                    foreach ($values as $row) {
                        try {
                            $regData = [
                                'id' => $row[0] ?? null,
                                'user_id' => $row[1] ?? null,
                                'event_id' => $row[2] ?? null,
                                'name' => $row[3] ?? null,
                                'email' => $row[4] ?? null,
                                'phone' => $row[5] ?? null,
                                'motivation' => $row[6] ?? null,
                                'token_hash' => $row[7] ?? null,
                                'token_plain' => $row[8] ?? null,
                                'token_sent_at' => $row[9] ?? null,
                                'status' => $this->mapRegistrationStatus($row[10] ?? 'registered'),
                                'created_at' => $row[11] ?? now(),
                                'updated_at' => $row[12] ?? now(),
                                'attendance_token' => $row[13] ?? null,
                                'attendance_status' => $row[14] ?? null,
                                'attended_at' => $row[15] ?? null,
                                // Map to new structure
                                'additional_info' => $row[6] ?? null, // motivation -> additional_info
                                'registered_at' => $row[11] ?? now(),
                                'confirmed_at' => ($row[10] ?? 'registered') === 'registered' ? $row[11] : null,
                            ];

                            if (EventRegistration::where('id', $regData['id'])->exists()) {
                                continue;
                            }

                            EventRegistration::create($regData);
                        } catch (\Exception $e) {
                            if (!str_contains($e->getMessage(), 'Duplicate')) {
                                $this->warn("  Registration import warning: " . substr($e->getMessage(), 0, 80));
                            }
                        }
                    }
                }
            }
            $this->info("  - Registrations imported");
        }
    }

    private function importAttendances($sql)
    {
        if (preg_match_all('/INSERT INTO `attendances`[^;]+;/i', $sql, $matches)) {
            foreach ($matches[0] as $insert) {
                if (preg_match('/VALUES\s*(.*?);/is', $insert, $valueMatch)) {
                    $values = $this->parseInsertValues($valueMatch[1]);
                    
                    foreach ($values as $row) {
                        try {
                            $attData = [
                                'id' => $row[0] ?? null,
                                'registration_id' => $row[1] ?? null,
                                'event_id' => $row[2] ?? null,
                                'user_id' => $row[3] ?? null,
                                'token_entered' => $row[4] ?? null,
                                'status' => $row[5] ?? 'present',
                                'attendance_time' => $row[6] ?? now(),
                                'created_at' => $row[7] ?? now(),
                                'updated_at' => $row[8] ?? now(),
                                // Map to new structure
                                'check_in_token' => $row[4] ?? null, // token_entered -> check_in_token
                                'checked_in_at' => $row[6] ?? now(), // attendance_time -> checked_in_at
                            ];

                            if (Attendance::where('id', $attData['id'])->exists()) {
                                continue;
                            }

                            Attendance::create($attData);
                        } catch (\Exception $e) {
                            if (!str_contains($e->getMessage(), 'Duplicate')) {
                                $this->warn("  Attendance import warning: " . substr($e->getMessage(), 0, 80));
                            }
                        }
                    }
                }
            }
            $this->info("  - Attendances imported");
        }
    }

    private function importCertificates($sql)
    {
        if (preg_match_all('/INSERT INTO `certificates`[^;]+;/i', $sql, $matches)) {
            foreach ($matches[0] as $insert) {
                try {
                    DB::unprepared($insert);
                } catch (\Exception $e) {
                    if (!str_contains($e->getMessage(), 'Duplicate')) {
                        $this->warn("  Certificate import warning: " . substr($e->getMessage(), 0, 80));
                    }
                }
            }
            $this->info("  - Certificates imported");
        }
    }

    private function importPayments($sql)
    {
        if (preg_match_all('/INSERT INTO `payments`[^;]+;/i', $sql, $matches)) {
            foreach ($matches[0] as $insert) {
                try {
                    DB::unprepared($insert);
                } catch (\Exception $e) {
                    if (!str_contains($e->getMessage(), 'Duplicate')) {
                        $this->warn("  Payment import warning: " . substr($e->getMessage(), 0, 80));
                    }
                }
            }
            $this->info("  - Payments imported");
        }
    }

    private function importBanners($sql)
    {
        if (preg_match_all('/INSERT INTO `banners`[^;]+;/i', $sql, $matches)) {
            foreach ($matches[0] as $insert) {
                try {
                    DB::unprepared($insert);
                } catch (\Exception $e) {
                    if (!str_contains($e->getMessage(), 'Duplicate')) {
                        $this->warn("  Banner import warning: " . substr($e->getMessage(), 0, 80));
                    }
                }
            }
            $this->info("  - Banners imported");
        }
    }

    private function importWishlists($sql)
    {
        if (preg_match_all('/INSERT INTO `wishlists`[^;]+;/i', $sql, $matches)) {
            foreach ($matches[0] as $insert) {
                try {
                    DB::unprepared($insert);
                } catch (\Exception $e) {
                    if (!str_contains($e->getMessage(), 'Duplicate')) {
                        $this->warn("  Wishlist import warning: " . substr($e->getMessage(), 0, 80));
                    }
                }
            }
            $this->info("  - Wishlists imported");
        }
    }

    private function parseInsertValues($valuesString)
    {
        $rows = [];
        // Split by rows (each row in parentheses)
        if (preg_match_all('/\(([^)]+(?:\([^)]*\)[^)]*)*)\)/s', $valuesString, $rowMatches)) {
            foreach ($rowMatches[1] as $rowString) {
                // Parse values handling quotes and commas inside quotes
                $values = [];
                $current = '';
                $inQuotes = false;
                $quoteChar = null;
                
                for ($i = 0; $i < strlen($rowString); $i++) {
                    $char = $rowString[$i];
                    
                    if (($char === '"' || $char === "'") && ($i === 0 || $rowString[$i-1] !== '\\')) {
                        if (!$inQuotes) {
                            $inQuotes = true;
                            $quoteChar = $char;
                        } elseif ($char === $quoteChar) {
                            $inQuotes = false;
                            $quoteChar = null;
                        }
                        $current .= $char;
                    } elseif ($char === ',' && !$inQuotes) {
                        $values[] = trim($current, " \t\n\r\0\x0B\"'");
                        $current = '';
                    } else {
                        $current .= $char;
                    }
                }
                if (!empty(trim($current))) {
                    $values[] = trim($current, " \t\n\r\0\x0B\"'");
                }
                
                $rows[] = $values;
            }
        }
        return $rows;
    }

    private function mapRegistrationStatus($oldStatus)
    {
        $map = [
            'registered' => 'confirmed',
            'cancelled' => 'cancelled',
        ];
        return $map[$oldStatus] ?? 'pending';
    }

    private function generateUsername($name, $email)
    {
        // Generate username from name or email
        if (!empty($name)) {
            $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
            if (strlen($username) > 50) {
                $username = substr($username, 0, 50);
            }
            if (strlen($username) < 3) {
                $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', explode('@', $email)[0]));
            }
        } else {
            $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', explode('@', $email)[0]));
        }
        
        // Ensure uniqueness
        $original = $username;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $original . $counter;
            $counter++;
        }
        
        return $username;
    }
}
