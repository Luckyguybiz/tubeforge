import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/server/db';
import { sendEmail } from '@/lib/email';
import { stripTags } from '@/lib/sanitize';

const SUPPORT_EMAIL = 'support@tubeforge.co';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').max(320),
  subject: z.string().min(1).max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  /** Honeypot field — must be empty. Bots tend to fill hidden fields. */
  website: z.string().max(0, 'Bot detected').optional().default(''),
});

export async function POST(req: NextRequest) {
  // --- IP extraction ---
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  // --- Rate limit: 3 submissions per hour per IP ---
  const { success, reset } = await rateLimit({
    identifier: `contact:${ip}`,
    limit: 3,
    window: 3600, // 1 hour
  });
  if (!success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  // --- Parse body ---
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, subject, message, website } = parsed.data;

  // --- Honeypot check ---
  if (website && website.length > 0) {
    // Silently accept to not reveal the trap, but do nothing
    return NextResponse.json({ success: true });
  }

  // Sanitize inputs
  const cleanName = stripTags(name.trim());
  const cleanSubject = stripTags(subject.trim());
  const cleanMessage = stripTags(message.trim());
  const userAgent = req.headers.get('user-agent') || undefined;

  // --- Save to database ---
  try {
    await db.contactSubmission.create({
      data: {
        name: cleanName,
        email: email.trim().toLowerCase(),
        subject: cleanSubject,
        message: cleanMessage,
        ipAddress: ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error('[contact] Failed to save submission:', err);
    // Don't fail the request — the email notification is still valuable
  }

  // --- Send email notification to support ---
  try {
    await sendEmail({
      to: SUPPORT_EMAIL,
      template: 'contact-form',
      data: {
        name: cleanName,
        email: email.trim().toLowerCase(),
        subject: cleanSubject,
        message: cleanMessage,
        ip,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[contact] Failed to send email notification:', err);
    // Still return success — submission is saved in DB
  }

  return NextResponse.json({ success: true });
}
