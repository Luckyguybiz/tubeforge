-- Autopost mobile app: channel rules (additive). Applied with psql on 2026-11-15.
-- Rollback: DROP TABLE "AutopostChannel";
BEGIN;
-- CreateTable
CREATE TABLE "AutopostChannel" (
    "channelId" TEXT NOT NULL,
    "slotTimes" TEXT[] DEFAULT ARRAY['12:00', '18:00']::TEXT[],
    "weekdays" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
    "postsPerDay" INTEGER NOT NULL DEFAULT 2,
    "minGapMinutes" INTEGER NOT NULL DEFAULT 120,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "autopostEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pausedUntil" TIMESTAMP(3),
    "connectionLostAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutopostChannel_pkey" PRIMARY KEY ("channelId")
);

-- AddForeignKey
ALTER TABLE "AutopostChannel" ADD CONSTRAINT "AutopostChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
