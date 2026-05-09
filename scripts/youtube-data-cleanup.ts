/**
 * YouTube API data retention cleanup
 *
 * Compliance: YouTube API Services Terms of Service, Policy III.E.4a-g
 * — YouTube API data MUST NOT be stored for more than 30 days.
 *
 * What this deletes:
 * - Channel records where `updatedAt` is older than 30 days (stale OAuth-fetched data)
 *
 * Run schedule: daily via cron at 03:00 UTC
 *
 * Manual run: `npx tsx scripts/youtube-data-cleanup.ts`
 */
import { PrismaClient } from "@prisma/client";

const RETENTION_DAYS = 30;

async function main() {
  const prisma = new PrismaClient();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  console.log(`[youtube-cleanup] cutoff = ${cutoff.toISOString()}`);

  // Delete stale Channel records (YouTube API data via OAuth that was not refreshed in 30 days)
  const deletedChannels = await prisma.channel.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  });
  console.log(`[youtube-cleanup] deleted ${deletedChannels.count} stale Channel rows`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[youtube-cleanup] failed:", e);
  process.exit(1);
});
