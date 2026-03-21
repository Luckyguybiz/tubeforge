#!/bin/bash
# ────────────────────────────────────────────────────────────────
# TubeForge — PostgreSQL Database Backup Script
#
# Reads DATABASE_URL from .env, creates a timestamped gzipped
# backup in /home/ubuntu/backups/, keeps only the last 7 backups,
# and writes success/failure to a log file.
#
# Cron setup (daily at 3:00 AM):
#   0 3 * * * /home/ubuntu/tubeforge-next/scripts/backup.sh
#
# Manual run:
#   bash /home/ubuntu/tubeforge-next/scripts/backup.sh
# ────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="/home/ubuntu/backups"
ENV_FILE="/home/ubuntu/tubeforge-next/.env"
LOG_FILE="/home/ubuntu/backups/backup.log"
MAX_BACKUPS=7

# ── Ensure backup directory exists ───────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Logging helper ───────────────────────────────────────────────
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

# ── Rotate the log file if it exceeds 1 MB ──────────────────────
if [ -f "$LOG_FILE" ] && [ "$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null)" -gt 1048576 ]; then
  mv "$LOG_FILE" "${LOG_FILE}.old"
  log "Log file rotated (exceeded 1 MB)"
fi

# ── Read DATABASE_URL from .env ──────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  log "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
  log "ERROR: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

# ── Generate timestamped filename ────────────────────────────────
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tubeforge_${TIMESTAMP}.sql.gz"

# ── Run pg_dump and compress ─────────────────────────────────────
log "Starting backup..."

if pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "SUCCESS: Backup saved to $BACKUP_FILE ($FILE_SIZE)"
else
  log "ERROR: pg_dump failed"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# ── Keep only the last N backups (count-based rotation) ──────────
BACKUP_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -name "tubeforge_*.sql.gz" -type f | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  EXCESS=$((BACKUP_COUNT - MAX_BACKUPS))
  # Delete the oldest backups beyond the retention count
  DELETED=$(find "$BACKUP_DIR" -maxdepth 1 -name "tubeforge_*.sql.gz" -type f -printf '%T+ %p\n' \
    | sort | head -n "$EXCESS" | awk '{print $2}' | xargs rm -f -v | wc -l)
  log "Cleaned up $DELETED old backup(s), keeping latest $MAX_BACKUPS"
fi

log "Backup complete"
