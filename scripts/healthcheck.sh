#!/bin/bash
# Uptime health check — restarts the app via pm2 if the health endpoint is unreachable.
# Intended to be run from cron every 5 minutes:
#   */5 * * * * /home/ubuntu/tubeforge-next/scripts/healthcheck.sh >> /var/log/tubeforge-health.log 2>&1

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3000/api/health)
if [ "$STATUS" != "200" ]; then
  echo "[$(date)] Health check FAILED (HTTP $STATUS), restarting..."
  pm2 restart tubeforge
fi
