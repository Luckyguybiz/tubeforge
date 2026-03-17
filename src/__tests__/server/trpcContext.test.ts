/**
 * Tests for tRPC context creation and procedure guards.
 *
 * We replicate the procedure middleware logic from src/server/trpc.ts
 * to test it in isolation without needing a real database or auth provider.
 */
import { describe, it, expect } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

/* ── Minimal context type matching src/server/trpc.ts ─────────── */

type Session = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    plan?: string;
    role?: string;
  };
  expires: string;
} | null;

type TRPCContext = {
  db: unknown;
  session: Session;
};

/* ── Build a tRPC instance mirroring the real one ─────────────── */

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: {
        ...ctx.session,
        user: { ...ctx.session.user, id: ctx.session.user.id },
      },
    },
  });
});

/* ── Build a test router with both procedure types ────────────── */

const appRouter = t.router({
  publicHello: publicProcedure.query(() => {
    return { message: 'hello from public' };
  }),
  protectedSecret: protectedProcedure.query(({ ctx }) => {
    return { userId: ctx.session.user.id, message: 'secret data' };
  }),
});

type AppRouter = typeof appRouter;

/* ── Helper to create a caller with a given context ───────────── */

function createCaller(session: Session) {
  return appRouter.createCaller({ db: null, session });
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('tRPC context and procedures', () => {
  describe('publicProcedure', () => {
    it('should allow unauthenticated access (no session)', async () => {
      const caller = createCaller(null);
      const result = await caller.publicHello();
      expect(result).toEqual({ message: 'hello from public' });
    });

    it('should allow unauthenticated access (session without user)', async () => {
      const caller = createCaller({ expires: '2099-01-01' });
      const result = await caller.publicHello();
      expect(result).toEqual({ message: 'hello from public' });
    });

    it('should allow authenticated access', async () => {
      const caller = createCaller({
        user: { id: 'user-1', name: 'Test', email: 'test@example.com' },
        expires: '2099-01-01',
      });
      const result = await caller.publicHello();
      expect(result).toEqual({ message: 'hello from public' });
    });
  });

  describe('protectedProcedure', () => {
    it('should throw UNAUTHORIZED when session is null', async () => {
      const caller = createCaller(null);
      await expect(caller.protectedSecret()).rejects.toThrow(TRPCError);
      await expect(caller.protectedSecret()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('should throw UNAUTHORIZED when session has no user', async () => {
      const caller = createCaller({ expires: '2099-01-01' });
      await expect(caller.protectedSecret()).rejects.toThrow(TRPCError);
    });

    it('should throw UNAUTHORIZED when user has no id', async () => {
      const caller = createCaller({
        user: { name: 'No ID User' },
        expires: '2099-01-01',
      });
      await expect(caller.protectedSecret()).rejects.toThrow(TRPCError);
      await expect(caller.protectedSecret()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('should throw UNAUTHORIZED when user id is empty string', async () => {
      const caller = createCaller({
        user: { id: '', name: 'Empty ID' },
        expires: '2099-01-01',
      });
      await expect(caller.protectedSecret()).rejects.toThrow(TRPCError);
    });

    it('should allow access when session has user with id', async () => {
      const caller = createCaller({
        user: { id: 'user-123', name: 'Authenticated User', email: 'auth@test.com' },
        expires: '2099-01-01',
      });
      const result = await caller.protectedSecret();
      expect(result).toEqual({ userId: 'user-123', message: 'secret data' });
    });

    it('should pass user id through to the context', async () => {
      const caller = createCaller({
        user: { id: 'ctx-user-456', name: 'Context Test' },
        expires: '2099-01-01',
      });
      const result = await caller.protectedSecret();
      expect(result.userId).toBe('ctx-user-456');
    });

    it('should preserve other session fields in protected context', async () => {
      // Build a separate router that exposes more context details
      const detailRouter = t.router({
        detail: protectedProcedure.query(({ ctx }) => ({
          id: ctx.session.user.id,
          name: ctx.session.user.name,
          email: ctx.session.user.email,
        })),
      });

      const caller = detailRouter.createCaller({
        db: null,
        session: {
          user: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
          expires: '2099-01-01',
        },
      });

      const result = await caller.detail();
      expect(result).toEqual({ id: 'u1', name: 'Alice', email: 'alice@test.com' });
    });
  });
});
