import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // Store as an audit log entry
    try {
      await db.auditLog.create({
        data: {
          action: 'NEWSLETTER_SIGNUP',
          metadata: { email, timestamp: new Date().toISOString() },
        },
      });
    } catch {
      // AuditLog may not have all fields, fall back to console
      console.log('[NEWSLETTER]', email);
    }

    // If Resend is configured, send welcome email
    if (process.env.RESEND_API_KEY) {
      try {
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
          to: email,
          template: 'welcome',
          data: { name: '', locale: 'ru' },
        });
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
}
