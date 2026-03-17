import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';

/* ------------------------------------------------------------------ */
/*  Minimal auth config — stripped to debug "Configuration" error      */
/* ------------------------------------------------------------------ */

const googleId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? '';
const googleSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? '';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: { strategy: 'database' },
  providers: [
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
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
        } catch {
          session.user.plan = 'FREE';
          session.user.role = 'USER';
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
