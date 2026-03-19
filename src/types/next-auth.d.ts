import type { DefaultSession } from 'next-auth';
import type { Plan, Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: Plan;
      role: Role;
    } & DefaultSession['user'];
  }
}
