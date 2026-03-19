import { vi } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type MockFn = ReturnType<typeof vi.fn> & ((...args: any[]) => any);
export type MockDb = Record<string, any>;

/**
 * Create a mock Prisma-like client with common model methods.
 * Each model gets stubbed CRUD methods that return vi.fn()
 * so callers can override individual return values.
 */
export function createMockDb(
  models: string[] = ['user', 'project', 'scene', 'payout'],
): MockDb {
  const db: MockDb = {
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    $queryRaw: vi.fn().mockResolvedValue([]),
  };

  for (const model of models) {
    db[model] = {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: {} }),
      create: vi.fn().mockResolvedValue({ id: `${model}-new` }),
      update: vi.fn().mockResolvedValue({ id: `${model}-1` }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      delete: vi.fn().mockResolvedValue({ id: `${model}-1` }),
    };
  }

  return db;
}
