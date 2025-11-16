#!/bin/bash

# Script to update .env file with Railway database credentials

ENV_FILE=".env"

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backed up existing .env file"
fi

# Update DB configuration
echo "Updating .env file with Railway database credentials..."

# Use sed or perl to update .env file
if command -v perl &> /dev/null; then
    perl -i -pe 's/^DB_HOST=.*/DB_HOST=trolley.proxy.rlwy.net/ if /^DB_HOST=/; s/^DB_PORT=.*/DB_PORT=41771/ if /^DB_PORT=/; s/^DB_DATABASE=.*/DB_DATABASE=railway/ if /^DB_DATABASE=/; s/^DB_USERNAME=.*/DB_USERNAME=root/ if /^DB_USERNAME=/; s/^DB_PASSWORD=.*/DB_PASSWORD=hjbOWrZVmwWpzEviTXjwycpLTSUtWJAc/ if /^DB_PASSWORD=/' "$ENV_FILE" 2>/dev/null
    
    # If DB_HOST doesn't exist, append it
    if ! grep -q "^DB_HOST=" "$ENV_FILE" 2>/dev/null; then
        echo "DB_HOST=trolley.proxy.rlwy.net" >> "$ENV_FILE"
        echo "DB_PORT=41771" >> "$ENV_FILE"
        echo "DB_DATABASE=railway" >> "$ENV_FILE"
        echo "DB_USERNAME=root" >> "$ENV_FILE"
        echo "DB_PASSWORD=hjbOWrZVmwWpzEviTXjwycpLTSUtWJAc" >> "$ENV_FILE"
    fi
else
    echo "⚠️  Perl not found. Please manually update .env file with:"
    echo ""
    echo "DB_HOST=trolley.proxy.rlwy.net"
    echo "DB_PORT=41771"
    echo "DB_DATABASE=railway"
    echo "DB_USERNAME=root"
    echo "DB_PASSWORD=hjbOWrZVmwWpzEviTXjwycpLTSUtWJAc"
    echo ""
    exit 1
fi

echo "✅ Updated .env file with Railway credentials"
echo ""
echo "Clearing Laravel cache..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear

echo ""
echo "✅ Done! Testing connection..."
php artisan tinker --execute="try { echo 'Host: ' . config('database.connections.mysql.host') . PHP_EOL; echo 'Database: ' . config('database.connections.mysql.database') . PHP_EOL; echo 'Total events: ' . App\Models\Event::count() . PHP_EOL; echo 'Published events: ' . App\Models\Event::where('is_published', true)->count() . PHP_EOL; } catch (Exception \$e) { echo 'Error: ' . \$e->getMessage() . PHP_EOL; }"

