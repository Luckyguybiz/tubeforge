import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { auth } from './auth';
import { db } from './db';
import { createLogger, recordRequest } from '@/lib/logger';

const log = createLogger('trpc');

export const createTRPCContext = async () => {
  const session = await auth();
  return { db, session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, path }) {
    // Log all internal server errors for debugging
    if (shape.data.code === 'INTERNAL_SERVER_ERROR') {
      log.error('tRPC internal error', { path, error: error.message });
    }

    return {
      ...shape,
      message:
        process.env.NODE_ENV === 'production' &&
        shape.data.code === 'INTERNAL_SERVER_ERROR'
          ? 'An internal error occurred'
          : shape.message,
      data: {
        ...shape.data,
        stack:
          process.env.NODE_ENV === 'production' ? undefined : error.stack,
      },
    };
  },
});

/* ── Logging middleware — tracks duration + records metrics ────── */

const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  // Record metrics for every request
  recordRequest(`trpc.${path}`, duration, !result.ok);

  // Log slow queries (>1s)
  if (duration > 1000) {
    log.warn('Slow tRPC call', { path, type, duration });
  }

  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggerMiddleware);
export const protectedProcedure = t.procedure.use(loggerMiddleware).use(({ ctx, next }) => {
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

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });
  if (user?.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin privileges required' });
  }
  return next({ ctx });
});
