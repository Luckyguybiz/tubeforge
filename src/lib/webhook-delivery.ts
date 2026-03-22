/**
 * Webhook delivery — POST events to registered webhook endpoints.
 *
 * Features:
 * - HMAC-SHA256 signed payloads
 * - 10-second timeout per delivery
 * - Fire-and-forget (non-blocking)
 * - Logs failures to console (no retry queue — single-instance PM2)
 */

import { db } from '@/server/db';
import { signPayload, type WebhookEvent } from '@/server/routers/webhook';
import { randomUUID } from 'crypto';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Deliver a webhook event to all active endpoints for a user.
 * Non-blocking — errors are logged but never thrown to the caller.
 */
export async function deliverWebhook(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const endpoints = await db.webhookEndpoint.findMany({
      where: { userId, active: true },
      select: { id: true, url: true, events: true, secret: true },
    });

    if (endpoints.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    const body = JSON.stringify(payload);

    const deliveries = endpoints
      .filter((ep) => ep.events.includes(event))
      .map((ep) => deliverToEndpoint(ep, event, body));

    // Fire-and-forget — don't await in the caller's hot path
    Promise.allSettled(deliveries).catch(() => {});
  } catch (err) {
    console.error('[webhook-delivery] Failed to query endpoints:', err);
  }
}

async function deliverToEndpoint(
  endpoint: { id: string; url: string; secret: string },
  event: WebhookEvent,
  body: string,
): Promise<void> {
  const deliveryId = randomUUID();
  const signature = signPayload(endpoint.secret, body);

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-Id': deliveryId,
        'User-Agent': 'TubeForge-Webhooks/1.0',
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(
        `[webhook-delivery] ${event} → ${endpoint.url} returned ${res.status}`,
      );
    }
  } catch (err) {
    console.error(
      `[webhook-delivery] ${event} → ${endpoint.url} failed:`,
      err instanceof Error ? err.message : err,
    );
  }
}
