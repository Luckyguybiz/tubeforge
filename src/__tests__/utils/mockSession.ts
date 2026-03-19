/**
 * Mock NextAuth session helpers for tRPC router tests.
 */

export interface MockSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    plan?: string;
  };
  expires: string;
}

export function makeSession(overrides?: Partial<MockSession['user']>): MockSession {
  return {
    user: {
      id: 'test-user-001',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
      plan: 'FREE',
      ...overrides,
    },
    expires: '2099-01-01',
  };
}

export function makeAdminSession(overrides?: Partial<MockSession['user']>): MockSession {
  return makeSession({
    id: 'admin-user-001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    ...overrides,
  });
}
