/**
 * Web Push notification utilities.
 *
 * Sends push notifications via the Web Push protocol using VAPID keys.
 * Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.
 *
 * Generate keys: npx web-push generate-vapid-keys
 */

import webPush from 'web-push';
import { db } from '@/server/db';

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webPush.setVapidDetails(
    'mailto:support@tubeforge.co',
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to all subscriptions for a user.
 * Non-blocking — errors are logged but never thrown.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureConfigured()) return;

  try {
    const subs = await db.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subs.length === 0) return;

    const data = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            data,
            { TTL: 86400 },
          );
        } catch (err: unknown) {
          // 410 Gone or 404 — subscription expired, remove it
          if (err && typeof err === 'object' && 'statusCode' in err) {
            const statusCode = (err as { statusCode: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          }
          throw err;
        }
      }),
    );

    const failed = results.filter((r: PromiseSettledResult<void>) => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`[push] ${failed.length}/${subs.length} notifications failed for user ${userId}`);
    }
  } catch (err) {
    console.error('[push] sendPushToUser error:', err);
  }
}
