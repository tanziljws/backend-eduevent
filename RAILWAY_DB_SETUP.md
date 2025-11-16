# Railway Database Setup

## Current Railway MySQL Credentials

```
DB_CONNECTION=mysql
DB_HOST=trolley.proxy.rlwy.net
DB_PORT=41771
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=hjbOWrZVmwWpzEviTXjwycpLTSUtWJAc
```

## Current Status

**Railway Database (Direct MySQL query):**
- Total events: 34
- Published events: 19
- Unpublished events: 15

**Local Database (Laravel current connection):**
- Total events: 35
- Published events: 20

## Issue

Laravel application is currently connected to **local database** (`127.0.0.1:8889`), NOT Railway database.

When you switch to Railway database, events should show all 19 published events.

## To Fix

1. Update `.env` file with Railway credentials above
2. Clear Laravel cache:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   ```
3. Test connection:
   ```bash
   php artisan tinker
   ```
   Then in tinker:
   ```php
   App\Models\Event::count(); // Should show 34
   App\Models\Event::where('is_published', true)->count(); // Should show 19
   ```

## Verify Database Connection

After updating `.env`, verify you're connected to Railway:

```bash
php artisan tinker --execute="echo 'Host: ' . config('database.connections.mysql.host');"
```

Should show: `trolley.proxy.rlwy.net`

