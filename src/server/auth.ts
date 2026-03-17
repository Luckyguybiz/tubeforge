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
      _lastAuthError = {
        name: error?.name,
        message: error?.message,
        cause: (error as any)?.cause?.message,
        stack: error?.stack?.split('\n').slice(0, 6),
        time: new Date().toISOString(),
      };
      console.error('[auth][error]', error);
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
        session.user.plan = 'FREE';
        session.user.role = 'USER';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
