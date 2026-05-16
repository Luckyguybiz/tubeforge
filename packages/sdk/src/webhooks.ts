/**
 * Webhook signature verification for inbound TubeForge events.
 *
 * Use in your server route that receives TubeForge webhooks:
 *
 *   import { verifyWebhook } from "@tubeforge/sdk";
 *
 *   export async function POST(req: Request) {
 *     const body = await req.text();
 *     const signature = req.headers.get("x-forge-signature");
 *     const event = verifyWebhook(body, signature, process.env.WEBHOOK_SECRET!);
 *     // event is now type-checked WebhookDelivery
 *   }
 */
import crypto from "node:crypto";
import { TubeForgeApiError, WebhookDelivery } from "./types";

/**
 * Verify HMAC-SHA256 signature on a raw webhook body and return the
 * parsed payload. Throws {@link TubeForgeApiError} with code
 * "invalid_signature" if verification fails.
 *
 * @param rawBody the unparsed string body of the incoming HTTP POST
 * @param signature the value of the `X-Forge-Signature` header
 * @param secret the webhook secret revealed once at registration time
 */
export function verifyWebhook<E extends WebhookDelivery["event"] = WebhookDelivery["event"]>(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): WebhookDelivery<E> {
  if (!signature) {
    throw new TubeForgeApiError(401, "missing_signature", "X-Forge-Signature header is required");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Constant-time compare to defeat timing attacks
  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new TubeForgeApiError(401, "invalid_signature", "Webhook signature does not match");
  }

  let parsed: WebhookDelivery<E>;
  try {
    parsed = JSON.parse(rawBody) as WebhookDelivery<E>;
  } catch {
    throw new TubeForgeApiError(400, "invalid_body", "Webhook body is not valid JSON");
  }
  return parsed;
}
