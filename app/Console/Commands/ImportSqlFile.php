<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportSqlFile extends Command
{
    protected $signature = 'db:import {file}';
    protected $description = 'Import SQL file to database';

    public function handle()
    {
        $filePath = $this->argument('file');
        
        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $this->info("Reading SQL file...");
        $sql = file_get_contents($filePath);

        // Remove comments
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
        $sql = preg_replace('/^--.*$/m', '', $sql);
        $sql = preg_replace('/^\s*$/m', '', $sql);

        // Split queries
        $queries = array_filter(
            array_map('trim', explode(';', $sql)),
            fn($query) => !empty($query) && strlen($query) > 10
        );

        $this->info("Found " . count($queries) . " queries");
        
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        $bar = $this->output->createProgressBar(count($queries));
        $bar->start();
        
        $success = 0;
        $failed = 0;

        foreach ($queries as $query) {
            try {
                DB::unprepared($query);
                $success++;
            } catch (\Exception $e) {
                $failed++;
                // Skip errors for common issues like "table already exists"
                if (!str_contains($e->getMessage(), 'already exists')) {
                    $this->newLine();
                    $this->warn("Query failed: " . substr($query, 0, 80) . "...");
                    $this->error($e->getMessage());
                }
            }
            $bar->advance();
        }
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("✅ Import completed!");
        $this->info("Success: {$success}");
        $this->info("Failed: {$failed}");
        
        return 0;
    }
}
