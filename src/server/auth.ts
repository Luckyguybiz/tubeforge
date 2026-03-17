import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * PHASE 1: Minimal auth — JWT only, no database adapter.
 * Testing if Configuration error is from adapter or OAuth flow.
 * Once login works, we'll re-add PrismaAdapter.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
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
