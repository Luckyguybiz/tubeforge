import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';

/** Mutation rate limit: 10 user actions per minute per user */
async function checkUserRate(userId: string) {
  const { success } = await rateLimit({ identifier: `user:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        role: true,
        aiUsage: true,
        onboardingDone: true,
        createdAt: true,
        channels: { select: { id: true, title: true, thumbnail: true, subscribers: true } },
        _count: { select: { projects: true } },
      },
    });
  }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await checkUserRate(ctx.session.user.id);
    return ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { onboardingDone: true },
      select: { id: true, onboardingDone: true },
    });
  }),

  resetOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await checkUserRate(ctx.session.user.id);
    return ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { onboardingDone: false },
      select: { id: true, onboardingDone: true },
    });
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(50).optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkUserRate(ctx.session.user.id);
      const data = { ...input };
      if (data.name) data.name = stripTags(data.name);
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data,
        select: { id: true, name: true },
      });
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await checkUserRate(ctx.session.user.id);
    const userId = ctx.session.user.id;

    // Delete all user data in a single transaction to ensure atomicity.
    // Order respects FK constraints.
    await ctx.db.$transaction([
      // 1. Remove team memberships (FK to User without onDelete cascade)
      ctx.db.teamMember.deleteMany({ where: { userId } }),
      // 2. Delete owned teams (FK to User without onDelete cascade)
      //    TeamMember records of OTHER users in owned teams cascade from Team.
      ctx.db.team.deleteMany({ where: { ownerId: userId } }),
      // 3. Design folders (children SetNull via FolderTree, assets SetNull via folder FK)
      ctx.db.designFolder.deleteMany({ where: { userId } }),
      // 4. Assets
      ctx.db.asset.deleteMany({ where: { userId } }),
      // 5. Projects (scenes cascade via onDelete: Cascade)
      ctx.db.project.deleteMany({ where: { userId } }),
      // 6. YouTube channels
      ctx.db.channel.deleteMany({ where: { userId } }),
      // 7. Auth sessions and accounts (cascade exists, but explicit for clarity)
      ctx.db.session.deleteMany({ where: { userId } }),
      ctx.db.account.deleteMany({ where: { userId } }),
      // 8. Finally delete the user
      ctx.db.user.delete({ where: { id: userId } }),
    ]);

    return { success: true };
  }),
});
