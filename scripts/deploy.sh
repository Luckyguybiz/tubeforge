#!/bin/bash
# ────────────────────────────────────────────────────────────────
# TubeForge — Deploy Script
#
# Currently uses `prisma db push` for schema changes (pre-launch).
# Before launch, initialize Prisma migration history:
#   1. mkdir -p prisma/migrations/0_init
#   2. npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
#   3. npx prisma migrate resolve --applied 0_init
# Then replace `db push` below with `npx prisma migrate deploy`.
# ────────────────────────────────────────────────────────────────
set -e
cd /home/ubuntu/tubeforge-next

echo "[deploy] Pulling latest..."
git pull origin main

echo "[deploy] Installing deps..."
npm ci --production=false

echo "[deploy] Syncing Prisma schema..."
npx prisma db push --skip-generate

echo "[deploy] Generating Prisma client..."
npx prisma generate

echo "[deploy] Building..."
npm run build

echo "[deploy] Restarting PM2..."
pm2 restart tubeforge

echo "[deploy] Waiting for startup..."
sleep 5

echo "[deploy] Health check..."
curl -sf http://localhost:3000/api/health || { echo "HEALTH CHECK FAILED"; exit 1; }

echo "[deploy] Saving PM2 state..."
pm2 save

echo "[deploy] Done!"
