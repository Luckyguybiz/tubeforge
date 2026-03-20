import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { auth } from './auth';
import { db } from './db';

export const createTRPCContext = async () => {
  const session = await auth();
  return { db, session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
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

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Требуются права администратора' });
  }
  return next({ ctx });
});
