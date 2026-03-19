/**
 * AUTH_URL is NOT needed when trustHost:true is set — NextAuth auto-detects
 * the URL from request headers (x-forwarded-host, x-forwarded-proto).
 * Having AUTH_URL set causes PKCE cookie domain mismatch: the cookie is set
 * on the user's current domain, but AUTH_URL overrides redirect_uri to a
 * different domain, so the callback can't read the cookie → "Configuration" error.
 */
const _hadAuthUrl = process.env.AUTH_URL;
const _hadNextAuthUrl = process.env.NEXTAUTH_URL;
delete process.env.AUTH_URL;
delete process.env.NEXTAUTH_URL;
if (_hadAuthUrl || _hadNextAuthUrl) {
  console.warn('[auth][init] Deleted env vars to prevent PKCE cookie mismatch:',
    _hadAuthUrl ? `AUTH_URL=${_hadAuthUrl}` : '',
    _hadNextAuthUrl ? `NEXTAUTH_URL=${_hadNextAuthUrl}` : '',
  );
}

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/server/db';

// Capture last auth error for diagnostics
let _lastAuthError: unknown = null;
export function getLastAuthError() { return _lastAuthError; }

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV !== 'production',
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  logger: {
    error(error: Error) {
      // AuthError stores cause as { err: Error, ...rest }
      const cause = (error as any)?.cause;
      const innerErr = cause?.err;
      _lastAuthError = {
        name: error?.name,
        message: error?.message,
        causeMessage: innerErr?.message ?? cause?.message,
        causeName: innerErr?.name ?? innerErr?.constructor?.name,
        causeStack: innerErr?.stack?.split('\n').slice(0, 4),
        causeDetails: cause ? JSON.stringify(cause, Object.getOwnPropertyNames(cause)).substring(0, 500) : undefined,
        stack: error?.stack?.split('\n').slice(0, 6),
        time: new Date().toISOString(),
      };
      console.error('[auth][error]', error);
      if (innerErr) console.error('[auth][cause]', innerErr);
    },
    warn(code: string) {
      console.warn('[auth][warn]', code);
    },
    debug(message: string, metadata?: unknown) {
      console.log('[auth][debug]', message, metadata);
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? '';
        // Fetch plan/role from database instead of hardcoding
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true, role: true },
        });
        if (dbUser) {
          session.user.plan = dbUser.plan;
          session.user.role = dbUser.role;
        } else {
          session.user.plan = 'FREE';
          session.user.role = 'USER';
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        // Auto-generate referral code on first login if not yet set
        await db.user.updateMany({
          where: { id: user.id, referralCode: null },
          data: { referralCode: user.id.slice(0, 8).toUpperCase() },
        }).catch(() => {}); // Ignore if already set (unique constraint)
      }
    },
  },
  pages: {
    signIn: '/login',
  },
});
