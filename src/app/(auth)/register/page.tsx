/**
 * /register is kept for backwards-compatible inbound links (marketing pages,
 * pricing CTAs, referral URLs). With email-OTP auth, registration is implicit
 * — the first successful code on a fresh email creates the user — so this
 * page just forwards to /login while preserving query params (?ref=, ?plan=,
 * ?callbackUrl=, etc.).
 */
import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RegisterRedirect({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  // Map ?plan=PRO|STUDIO to a callbackUrl that initiates checkout post-login
  // (mirrors the previous register page's behavior).
  const plan = qs.get('plan');
  if (plan === 'PRO' || plan === 'STUDIO') {
    qs.delete('plan');
    if (!qs.get('callbackUrl')) {
      qs.set('callbackUrl', `/dashboard?initCheckout=${plan}`);
    }
  }
  const query = qs.toString();
  redirect(query ? `/login?${query}` : '/login');
}
