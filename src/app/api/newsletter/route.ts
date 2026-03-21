import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

const log = createLogger("newsletter");

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    // Rate limit: 3 requests per minute per IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
    const rl = await rateLimit({
      identifier: `newsletter:${ip}`,
      limit: 3,
      window: 60,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        },
      );
    }

    const body = await req.json();
    const { email } = schema.parse(body);

    // Store as an audit log entry
    try {
      await db.auditLog.create({
        data: {
          action: "NEWSLETTER_SIGNUP",
          metadata: { email, timestamp: new Date().toISOString() },
        },
      });
    } catch {
      // AuditLog may not have all fields, fall back to structured logger
      log.info("Newsletter signup", {
        email: email.replace(/(.{2}).*@/, "$1***@"),
      });
    }

    // If Resend is configured, send welcome email
    if (process.env.RESEND_API_KEY) {
      try {
        const { sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: email,
          template: "welcome",
          data: { name: "", locale: "ru" },
        });
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
}
