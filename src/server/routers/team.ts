import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR, PLAN_LIMITS } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';

/** Mutation rate limit: 10 team actions per minute per user */
async function checkTeamRate(userId: string) {
  const { success } = await rateLimit({ identifier: `team:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const teamRouter = router({
  getTeam: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Single query: find team where user is owner OR member
    const membership = await ctx.db.teamMember.findFirst({
      where: { userId },
      select: {
        team: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            createdAt: true,
            updatedAt: true,
            owner: { select: { id: true, name: true, email: true, image: true } },
            members: {
              select: {
                id: true,
                role: true,
                joinedAt: true,
                user: { select: { id: true, name: true, email: true, image: true } },
              },
              orderBy: { joinedAt: 'asc' },
            },
            _count: { select: { projects: true } },
          },
        },
      },
      // Prefer owned team by sorting OWNER role first
      orderBy: { role: 'asc' },
    });

    return membership?.team ?? null;
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
          name: stripTags(input.name),
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

      // Find user by email outside transaction (read-only, no race condition)
      const invitee = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (!invitee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Пользователь не найден' });
      }

      // Use interactive transaction to atomically check limit and create member
      return ctx.db.$transaction(async (tx) => {
        const team = await tx.team.findFirst({
          where: { ownerId: ctx.session.user.id },
          select: { id: true, _count: { select: { members: true } } },
        });
        if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Команда не найдена' });

        // Check member limit
        const maxMembers = PLAN_LIMITS.STUDIO.teamMembers;
        if (team._count.members >= maxMembers) {
          throw new TRPCError({ code: 'FORBIDDEN', message: `Максимум ${maxMembers} участников в команде` });
        }

        // Check if already a member
        const existing = await tx.teamMember.findUnique({
          where: { teamId_userId: { teamId: team.id, userId: invitee.id } },
          select: { id: true },
        });
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Пользователь уже в команде' });
        }

        return tx.teamMember.create({
          data: {
            teamId: team.id,
            userId: invitee.id,
            role: input.role,
          },
          select: {
            id: true,
            role: true,
            joinedAt: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        });
      });
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, role: true, team: { select: { ownerId: true } } },
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
        select: { id: true, role: true, team: { select: { ownerId: true } } },
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
        where: { id: input.projectId, userId: ctx.session.user.id },
        data: { teamId: team.id },
        select: { id: true, teamId: true },
      });
    }),

  unshareProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true, teamId: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      if (!project.teamId) return { id: project.id, teamId: null };

      return ctx.db.project.update({
        where: { id: input.projectId, userId: ctx.session.user.id },
        data: { teamId: null },
        select: { id: true, teamId: true },
      });
    }),

  /** Get project collaborators — returns team members who have access to this project */
  getProjectCollaborators: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id } } } },
          ],
        },
        select: {
          id: true,
          userId: true,
          teamId: true,
          user: { select: { id: true, name: true, email: true, image: true } },
          team: {
            select: {
              members: {
                select: {
                  role: true,
                  user: { select: { id: true, name: true, email: true, image: true } },
                },
                orderBy: { role: 'asc' },
              },
            },
          },
        },
      });
      if (!project) return { owner: null, members: [] };

      const owner = {
        ...project.user,
        role: 'OWNER' as const,
      };

      const members = (project.team?.members ?? [])
        .filter((m) => m.user.id !== project.userId)
        .map((m) => ({
          ...m.user,
          role: m.role,
        }));

      return { owner, members };
    }),
});
