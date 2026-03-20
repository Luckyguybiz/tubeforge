/**
 * AUTH_URL is NOT needed when trustHost:true is set — NextAuth auto-detects
 * the URL from request headers (x-forwarded-host, x-forwarded-proto).
 * Having AUTH_URL set causes PKCE cookie domain mismatch: the cookie is set
 * on the user's current domain, but AUTH_URL overrides redirect_uri to a
 * different domain, so the callback can't read the cookie → "Configuration" error.
 */
import { createLogger } from '@/lib/logger';

const authLog = createLogger('auth');

const _hadAuthUrl = !!process.env.AUTH_URL;
const _hadNextAuthUrl = !!process.env.NEXTAUTH_URL;
delete process.env.AUTH_URL;
delete process.env.NEXTAUTH_URL;
if (_hadAuthUrl || _hadNextAuthUrl) {
  authLog.warn('Deleted env vars to prevent PKCE cookie mismatch', {
    AUTH_URL: _hadAuthUrl ? 'was set' : 'not set',
    NEXTAUTH_URL: _hadNextAuthUrl ? 'was set' : 'not set',
  });
}

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Plan, Role } from '@prisma/client';
import { db } from '@/server/db';
import { env } from '@/lib/env';

// Capture last auth error for diagnostics
let _lastAuthError: unknown = null;
export function getLastAuthError() { return _lastAuthError; }

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: false,
  trustHost: true,
  secret: env.AUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
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
      const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

      if (user) {
        // Initial sign-in: populate plan/role from DB into the JWT token
        token.id = user.id;
        const dbUser = user.id
          ? await db.user.findUnique({
              where: { id: user.id },
              select: { plan: true, role: true },
            })
          : null;
        token.plan = dbUser?.plan ?? 'FREE';
        token.role = dbUser?.role ?? 'USER';
        token.planUpdatedAt = Date.now();
      } else {
        // Subsequent requests: refresh plan/role from DB if cache is stale
        const lastUpdated = (token.planUpdatedAt as number) ?? 0;
        if (Date.now() - lastUpdated > PLAN_CACHE_TTL_MS) {
          const userId = (token.id as string) ?? token.sub;
          if (userId) {
            const dbUser = await db.user.findUnique({
              where: { id: userId },
              select: { plan: true, role: true },
            });
            token.plan = dbUser?.plan ?? 'FREE';
            token.role = dbUser?.role ?? 'USER';
          } else {
            token.plan = 'FREE';
            token.role = 'USER';
          }
          token.planUpdatedAt = Date.now();
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Read plan/role directly from the cached JWT — no DB query needed
      if (session.user) {
        const userId = (token.id as string) ?? token.sub;
        if (!userId) {
          session.user.plan = 'FREE';
          session.user.role = 'USER';
          return session;
        }
        session.user.id = userId;
        session.user.plan = (token.plan as Plan) ?? 'FREE';
        session.user.role = (token.role as Role) ?? 'USER';
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        // Auto-generate referral code on first login if not yet set
        try {
          await db.user.updateMany({
            where: { id: user.id, referralCode: null },
            data: {
              referralCode: Array.from(crypto.getRandomValues(new Uint8Array(4)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase(),
            },
          });
        } catch (err: unknown) {
          // Only ignore unique constraint violations (P2002)
          const isPrismaConstraint = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
          if (!isPrismaConstraint) {
            authLog.error('Failed to set referral code', { error: err instanceof Error ? err.message : String(err) });
          }
        }
      }
    },
  },
  pages: {
    signIn: '/login',
  },
});
