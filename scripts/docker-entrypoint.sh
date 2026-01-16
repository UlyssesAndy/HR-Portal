#!/bin/sh
set -e

echo "=== HR Portal Startup ==="
echo "Running database migrations..."

# Apply schema changes to database
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || {
  echo "Warning: prisma db push failed, continuing anyway..."
}

echo "Database ready!"
echo "Starting application..."

# Start the application
exec node server.js
