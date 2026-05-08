#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready (db:5432)..."
until nc -z db 5432; do
  echo "  (Still waiting for database...)"
  sleep 2
done

echo "🔧 Running database migrations..."
if [ "$PRISMA_DB_PUSH_ACCEPT_DATA_LOSS" = "true" ]; then
  ./node_modules/.bin/prisma db push --accept-data-loss
else
  ./node_modules/.bin/prisma db push
fi

echo "🌱 Running database seed..."
./node_modules/.bin/prisma db seed || echo "⚠️ Seed may have already been applied, continuing..."

echo "🚀 Starting application..."
exec node server.js
