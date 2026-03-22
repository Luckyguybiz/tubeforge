#!/bin/bash
set -e
cd /home/ubuntu/tubeforge-next

echo "[deploy] Pulling latest..."
git pull origin main

echo "[deploy] Installing deps..."
npm ci --production=false

echo "[deploy] Building..."
npm run build

echo "[deploy] Pushing Prisma schema..."
npx prisma db push --skip-generate

echo "[deploy] Restarting PM2..."
pm2 restart tubeforge

echo "[deploy] Waiting for startup..."
sleep 5

echo "[deploy] Health check..."
curl -sf http://localhost:3000/api/health || { echo "HEALTH CHECK FAILED"; exit 1; }

echo "[deploy] Done!"
