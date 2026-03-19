/**
 * Lightweight internal email system for TubeForge.
 *
 * - In development: logs emails to console (no actual sending)
 * - In production: POSTs to a configurable SMTP relay / webhook URL (SMTP_URL)
 *
 * No external dependencies required (no Resend, SendGrid, etc.).
 */

const isDev = process.env.NODE_ENV !== 'production';

/** Resolved sender address — falls back to noreply@tubeforge.app */
function getFrom(): string {
  return process.env.EMAIL_FROM || 'noreply@tubeforge.app';
}

/** Resolved SMTP relay / webhook endpoint */
function getSmtpUrl(): string | undefined {
  return process.env.SMTP_URL || undefined;
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email.
 *
 * In dev mode the email is printed to the console and no network request is
 * made. In production the payload is POSTed to `SMTP_URL` as JSON.
 *
 * The function never throws — failures are logged so that callers (webhook
 * handlers, auth events) are not disrupted by email delivery issues.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const from = getFrom();

  // --- Development: log only ------------------------------------------------
  if (isDev) {
    console.log(
      `\n[email][dev] ─────────────────────────────────────\n` +
      `  From:    ${from}\n` +
      `  To:      ${to}\n` +
      `  Subject: ${subject}\n` +
      `  Body:    (${html.length} chars HTML)\n` +
      `──────────────────────────────────────────────────\n`,
    );
    return true;
  }

  // --- Production: POST to SMTP relay / webhook ----------------------------
  const smtpUrl = getSmtpUrl();
  if (!smtpUrl) {
    console.warn('[email] SMTP_URL not configured — skipping email to', to);
    return false;
  }

  try {
    const res = await fetch(smtpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '(unreadable body)');
      console.error(`[email] SMTP relay returned ${res.status}: ${text}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[email] Failed to send email:', err instanceof Error ? err.message : err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Shared HTML layout wrapper
// ---------------------------------------------------------------------------

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TubeForge</title>
</head>
<body style="margin:0;padding:0;background:#06060b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#06060b;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#111119;border-radius:12px;border:1px solid #1e1e2e;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #1e1e2e;">
              <span style="font-size:24px;font-weight:700;color:#ff2d55;letter-spacing:-0.5px;">TubeForge</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;color:#e8e8f0;font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid #1e1e2e;color:#7c7c96;font-size:12px;line-height:1.5;">
              &copy; ${new Date().getFullYear()} TubeForge. All rights reserved.<br />
              You received this email because you have an account at TubeForge.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

/**
 * Welcome email — sent on first sign-in.
 */
export function welcomeEmail(name: string | null): SendEmailOptions & { to: '' } {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;color:#e8e8f0;">Welcome to TubeForge!</h1>
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">
      Thanks for signing up. TubeForge helps you create stunning YouTube content
      with AI-powered video generation, thumbnail design, and metadata
      optimization&mdash;all in one place.
    </p>
    <p style="margin:0 0 24px;">Here&rsquo;s what you can do right away:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#e8e8f0;">
      <li style="margin-bottom:8px;">Create your first project and add scenes</li>
      <li style="margin-bottom:8px;">Design eye-catching thumbnails with the canvas editor</li>
      <li style="margin-bottom:8px;">Generate AI videos from text prompts</li>
      <li style="margin-bottom:8px;">Share your referral code and earn commissions</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tubeforge.app'}/dashboard"
       style="display:inline-block;padding:12px 28px;background:#ff2d55;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Go to Dashboard
    </a>
  `);

  return { to: '' as const, subject: 'Welcome to TubeForge!', html };
}

/**
 * Plan upgrade confirmation email.
 */
export function planUpgradeEmail(name: string | null, plan: 'PRO' | 'STUDIO'): SendEmailOptions & { to: '' } {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const planLabel = plan === 'STUDIO' ? 'Studio' : 'Pro';
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;color:#e8e8f0;">You&rsquo;re now on ${planLabel}!</h1>
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">
      Your TubeForge subscription has been upgraded to the
      <strong style="color:#ff2d55;">${planLabel}</strong> plan. You now have access
      to all ${planLabel}-tier features.
    </p>
    <p style="margin:0 0 24px;">
      Thank you for supporting TubeForge. If you have any questions about your
      plan, just reply to this email.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tubeforge.app'}/dashboard"
       style="display:inline-block;padding:12px 28px;background:#ff2d55;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Explore Your New Features
    </a>
  `);

  return { to: '' as const, subject: `You're now on TubeForge ${planLabel}!`, html };
}

/**
 * Plan cancellation / downgrade notice.
 */
export function planCancellationEmail(name: string | null): SendEmailOptions & { to: '' } {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;color:#e8e8f0;">Your subscription has been cancelled</h1>
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">
      Your TubeForge paid subscription has been cancelled and your account has
      been moved to the <strong>Free</strong> plan.
    </p>
    <p style="margin:0 0 12px;">
      Your existing projects and assets are still available. Some premium
      features may be limited on the Free plan.
    </p>
    <p style="margin:0 0 24px;">
      If this was a mistake or you&rsquo;d like to resubscribe, you can upgrade
      again at any time from your dashboard.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tubeforge.app'}/dashboard"
       style="display:inline-block;padding:12px 28px;background:#ff2d55;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Go to Dashboard
    </a>
  `);

  return { to: '' as const, subject: 'Your TubeForge subscription has been cancelled', html };
}

/**
 * Referral notification — sent to the referrer when they earn a commission.
 */
export function referralNotificationEmail(
  name: string | null,
  commission: number,
): SendEmailOptions & { to: '' } {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const formatted = `$${commission.toFixed(2)}`;
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:22px;color:#e8e8f0;">You earned a referral commission!</h1>
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">
      Great news! Someone you referred just made a payment, and you&rsquo;ve
      earned a <strong style="color:#2dd4a0;">${formatted}</strong> commission.
    </p>
    <p style="margin:0 0 24px;">
      Keep sharing your referral code to earn even more. You can view your
      total earnings and payout history on your dashboard.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tubeforge.app'}/dashboard"
       style="display:inline-block;padding:12px 28px;background:#ff2d55;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      View Your Earnings
    </a>
  `);

  return { to: '' as const, subject: `You earned ${formatted} from a TubeForge referral!`, html };
}
