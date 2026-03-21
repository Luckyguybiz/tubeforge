#!/bin/bash
# ────────────────────────────────────────────────────────────────
# TubeForge — PostgreSQL Database Backup Script
#
# Reads DATABASE_URL from .env, creates a timestamped gzipped
# backup in /home/ubuntu/backups/, and removes backups older
# than 7 days.
#
# Cron setup (daily at 3:00 AM):
#   0 3 * * * /home/ubuntu/tubeforge-next/scripts/backup.sh >> /var/log/tubeforge-backup.log 2>&1
#
# Manual run:
#   bash /home/ubuntu/tubeforge-next/scripts/backup.sh
# ────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="/home/ubuntu/backups"
ENV_FILE="/home/ubuntu/tubeforge-next/.env"
RETENTION_DAYS=7

# ── Read DATABASE_URL from .env ────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "[$(date)] ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
  echo "[$(date)] ERROR: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

# ── Create backup directory if needed ──────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Generate timestamped filename ──────────────────────────────
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tubeforge_${TIMESTAMP}.sql.gz"

# ── Run pg_dump and compress ───────────────────────────────────
echo "[$(date)] Starting backup..."

if pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] SUCCESS: Backup saved to $BACKUP_FILE ($FILE_SIZE)"
else
  echo "[$(date)] ERROR: pg_dump failed"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# ── Remove old backups ─────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "tubeforge_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] Cleaned up $DELETED backup(s) older than $RETENTION_DAYS days"
fi

echo "[$(date)] Backup complete"
