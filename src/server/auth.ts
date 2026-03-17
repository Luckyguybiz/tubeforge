import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';
import { env } from '@/lib/env';

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  console.error('[auth] CRITICAL: AUTH_SECRET is not set! Available env vars:', Object.keys(process.env).filter(k => k.includes('AUTH') || k.includes('SECRET') || k.includes('NEXT')).join(', '));
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV !== 'production',
  secret: authSecret,
  session: { strategy: 'database' },
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/yt-analytics.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { plan: true, role: true },
          });
          session.user.plan = dbUser?.plan ?? 'FREE';
          session.user.role = dbUser?.role ?? 'USER';
        } catch (e) {
          console.error('[auth] session callback DB error:', e);
          session.user.plan = 'FREE';
          session.user.role = 'USER';
        }
      }
      return session;
    },
  },
  logger: {
    error(code, ...message) {
      console.error('[next-auth][error]', code, ...message);
    },
    warn(code, ...message) {
      console.warn('[next-auth][warn]', code, ...message);
    },
  },
  pages: {
    signIn: '/login',
  },
});
