import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

/** Mutation rate limit: 10 team actions per minute per user */
async function checkTeamRate(userId: string) {
  const { success } = await rateLimit({ identifier: `team:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const teamRouter = router({
  getTeam: protectedProcedure.query(async ({ ctx }) => {
    // Find team where user is owner or member
    const membership = await ctx.db.teamMember.findFirst({
      where: { userId: ctx.session.user.id },
      include: {
        team: {
          include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
              orderBy: { joinedAt: 'asc' },
            },
            _count: { select: { projects: true } },
          },
        },
      },
    });

    // Also check if user owns a team
    const ownedTeam = await ctx.db.team.findFirst({
      where: { ownerId: ctx.session.user.id },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { projects: true } },
      },
    });

    return ownedTeam ?? membership?.team ?? null;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      // Only Studio plan can create teams
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { plan: true },
      });
      if (user?.plan !== 'STUDIO') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Команды доступны только на плане Studio' });
      }

      // Check if user already owns a team
      const existing = await ctx.db.team.findFirst({
        where: { ownerId: ctx.session.user.id },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'У вас уже есть команда' });
      }

      const team = await ctx.db.team.create({
        data: {
          name: input.name,
          ownerId: ctx.session.user.id,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: 'OWNER',
            },
          },
        },
        select: { id: true, name: true },
      });

      return team;
    }),

  invite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('EDITOR'),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      const team = await ctx.db.team.findFirst({
        where: { ownerId: ctx.session.user.id },
        include: { _count: { select: { members: true } } },
      });
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Команда не найдена' });

      // Check member limit
      if (team._count.members >= 10) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Максимум 10 участников в команде' });
      }

      // Find user by email
      const invitee = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (!invitee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Пользователь не найден' });
      }

      // Check if already a member
      const existing = await ctx.db.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: invitee.id } },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Пользователь уже в команде' });
      }

      return ctx.db.teamMember.create({
        data: {
          teamId: team.id,
          userId: invitee.id,
          role: input.role,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      });
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.memberId },
        include: { team: { select: { ownerId: true } } },
      });
      if (!member || member.team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (member.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Нельзя удалить владельца' });
      }

      await ctx.db.teamMember.delete({ where: { id: input.memberId } });
      return { success: true };
    }),

  updateRole: protectedProcedure
    .input(z.object({
      memberId: z.string(),
      role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.memberId },
        include: { team: { select: { ownerId: true } } },
      });
      if (!member || member.team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (member.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Нельзя изменить роль владельца' });
      }

      return ctx.db.teamMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
        select: { id: true, role: true },
      });
    }),

  shareProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      const team = await ctx.db.team.findFirst({
        where: { ownerId: ctx.session.user.id },
        select: { id: true },
      });
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Создайте команду' });

      return ctx.db.project.update({
        where: { id: input.projectId },
        data: { teamId: team.id },
        select: { id: true, teamId: true },
      });
    }),
});
