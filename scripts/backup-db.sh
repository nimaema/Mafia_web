#!/bin/sh
set -eu

BACKUP_DIR="${DB_BACKUP_DIR:-/backups}"
RETENTION_DAYS="${DB_BACKUP_RETENTION_DAYS:-7}"
INTERVAL_SECONDS="${DB_BACKUP_INTERVAL_SECONDS:-86400}"

mkdir -p "$BACKUP_DIR"
chmod 777 "$BACKUP_DIR" 2>/dev/null || true

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set; database backup service cannot start." >&2
  exit 1
fi

until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do
  echo "Waiting for database before starting backup loop..."
  sleep 5
done

while true; do
  timestamp="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
  target="$BACKUP_DIR/mafia-db-auto-$timestamp.dump"

  echo "Creating database backup: $target"
  if pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl -f "$target"; then
    chmod 666 "$target" 2>/dev/null || true
    find "$BACKUP_DIR" -name "mafia-db-*.dump" -type f -mtime +"$RETENTION_DAYS" -delete
    echo "Database backup completed: $target"
    sleep "$INTERVAL_SECONDS"
  else
    echo "Database backup failed; retrying in 60 seconds." >&2
    rm -f "$target"
    sleep 60
  fi
done
