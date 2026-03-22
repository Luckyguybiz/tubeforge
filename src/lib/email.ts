/**
 * Email sending utility using Resend.
 *
 * Email sending is completely non-blocking: if RESEND_API_KEY is not set,
 * calls are silently skipped. Errors are logged but never thrown to callers.
 *
 * Setup instructions:
 *  1. Sign up at https://resend.com and verify your domain (tubeforge.co)
 *  2. Create an API key at https://resend.com/api-keys
 *  3. Set RESEND_API_KEY in your .env file
 *  4. Ensure DNS records (SPF, DKIM) are configured per Resend's instructions
 */
import type { EmailTemplate } from '@/lib/email-templates';

// Log once at startup if RESEND_API_KEY is not configured
if (!process.env.RESEND_API_KEY) {
  console.warn('[EMAIL] RESEND_API_KEY not set — emails will be skipped. Set it in .env to enable transactional emails.');
}

/** Lazy-loaded Resend client — avoids throwing at import time if key is missing */
let _resend: import('resend').Resend | null = null;
function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require('resend') as typeof import('resend');
    _resend = new Resend(key);
  }
  return _resend;
}

interface SendEmailOpts {
  to: string;
  template: EmailTemplate;
  data: Record<string, string | number>;
}

/**
 * Send a transactional email using a pre-defined template.
 *
 * This function NEVER throws. If RESEND_API_KEY is missing, the call is
 * silently skipped. Any Resend API errors are logged to the console.
 */
export async function sendEmail({ to, template, data }: SendEmailOpts): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping email');
    return;
  }

  const { getTemplate } = await import('@/lib/email-templates');
  const { subject, html } = getTemplate(template, data);

  try {
    await resend.emails.send({
      from: 'TubeForge <noreply@tubeforge.co>',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[email] Failed to send:', err);
  }
}
