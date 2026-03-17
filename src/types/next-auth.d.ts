import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: 'FREE' | 'PRO' | 'STUDIO';
      role: 'USER' | 'ADMIN';
    } & DefaultSession['user'];
  }
}
