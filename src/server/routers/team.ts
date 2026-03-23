import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR, PLAN_LIMITS } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';
import type { PrismaClient } from '@prisma/client';

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/** Mutation rate limit: 10 team actions per minute per user */
async function checkTeamRate(userId: string) {
  const { success } = await rateLimit({ identifier: `team:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/** Log a team activity event */
async function logActivity(
  db: PrismaClient | TxClient,
  params: { teamId: string; actorId: string; action: string; targetId?: string; meta?: Record<string, unknown> },
) {
  await (db as PrismaClient).teamActivityLog.create({
    data: {
      teamId: params.teamId,
      actorId: params.actorId,
      action: params.action,
      targetId: params.targetId ?? null,
      meta: params.meta ? JSON.stringify(params.meta) : null,
    },
  });
}

export const teamRouter = router({
  getTeam: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Single query: find team where user is owner OR member (non-pending)
    const membership = await ctx.db.teamMember.findFirst({
      where: { userId, pending: false },
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
              where: { pending: false },
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

  /** Get pending invites for the team (visible to owner/admin) */
  getPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Find the team this user owns or admins
    const membership = await ctx.db.teamMember.findFirst({
      where: { userId, role: { in: ['OWNER', 'ADMIN'] }, pending: false },
      select: { teamId: true },
    });
    if (!membership) return [];

    return ctx.db.teamMember.findMany({
      where: { teamId: membership.teamId, pending: true },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }),

  /** Get pending invites for the current user (invites they need to accept) */
  getMyPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.teamMember.findMany({
      where: { userId: ctx.session.user.id, pending: true },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }),

  /** Accept a pending invite */
  acceptInvite: protectedProcedure
    .input(z.object({ memberId: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);

      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, userId: true, pending: true, teamId: true, role: true },
      });
      if (!member || member.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (!member.pending) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invite already accepted' });
      }

      const updated = await ctx.db.teamMember.update({
        where: { id: input.memberId },
        data: { pending: false, joinedAt: new Date() },
        select: { id: true, role: true, teamId: true },
      });

      await logActivity(ctx.db, {
        teamId: member.teamId,
        actorId: ctx.session.user.id,
        action: 'invite_accepted',
        meta: { role: member.role },
      });

      return updated;
    }),

  /** Decline a pending invite */
  declineInvite: protectedProcedure
    .input(z.object({ memberId: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);

      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, userId: true, pending: true, teamId: true },
      });
      if (!member || member.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (!member.pending) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invite already accepted' });
      }

      await ctx.db.teamMember.delete({ where: { id: input.memberId } });

      await logActivity(ctx.db, {
        teamId: member.teamId,
        actorId: ctx.session.user.id,
        action: 'invite_declined',
      });

      return { success: true };
    }),

  /** Cancel a pending invite (owner/admin action) */
  cancelInvite: protectedProcedure
    .input(z.object({ memberId: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);

      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.memberId },
        select: {
          id: true,
          pending: true,
          teamId: true,
          userId: true,
          user: { select: { email: true } },
          team: { select: { ownerId: true } },
        },
      });
      if (!member || !member.pending) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Only owner or admin can cancel invites
      const callerMembership = await ctx.db.teamMember.findFirst({
        where: { teamId: member.teamId, userId: ctx.session.user.id, role: { in: ['OWNER', 'ADMIN'] }, pending: false },
        select: { id: true },
      });
      if (!callerMembership) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.teamMember.delete({ where: { id: input.memberId } });

      await logActivity(ctx.db, {
        teamId: member.teamId,
        actorId: ctx.session.user.id,
        action: 'invite_cancelled',
        targetId: member.userId,
        meta: { email: member.user.email },
      });

      return { success: true };
    }),

  /** Get team activity log */
  getActivityLog: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Find the team this user belongs to
      const membership = await ctx.db.teamMember.findFirst({
        where: { userId, pending: false },
        select: { teamId: true },
        orderBy: { role: 'asc' },
      });
      if (!membership) return [];

      return ctx.db.teamActivityLog.findMany({
        where: { teamId: membership.teamId },
        select: {
          id: true,
          action: true,
          targetId: true,
          meta: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input?.limit ?? 20,
      });
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
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Teams are available on the Studio plan only' });
      }

      // Check if user already owns a team
      const existing = await ctx.db.team.findFirst({
        where: { ownerId: ctx.session.user.id },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You already have a team' });
      }

      const team = await ctx.db.team.create({
        data: {
          name: stripTags(input.name),
          ownerId: ctx.session.user.id,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: 'OWNER',
              pending: false,
            },
          },
        },
        select: { id: true, name: true },
      });

      await logActivity(ctx.db, {
        teamId: team.id,
        actorId: ctx.session.user.id,
        action: 'team_created',
        meta: { name: team.name },
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Use interactive transaction to atomically check limit and create member
      const result = await ctx.db.$transaction(async (tx) => {
        const team = await tx.team.findFirst({
          where: { ownerId: ctx.session.user.id },
          select: { id: true, _count: { select: { members: true } } },
        });
        if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });

        // Check member limit
        const maxMembers = PLAN_LIMITS.STUDIO.teamMembers;
        if (team._count.members >= maxMembers) {
          throw new TRPCError({ code: 'FORBIDDEN', message: `Maximum ${maxMembers} members per team` });
        }

        // Check if already a member or has a pending invite
        const existing = await tx.teamMember.findUnique({
          where: { teamId_userId: { teamId: team.id, userId: invitee.id } },
          select: { id: true, pending: true },
        });
        if (existing) {
          if (existing.pending) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Invite already sent' });
          }
          throw new TRPCError({ code: 'CONFLICT', message: 'User is already a member' });
        }

        const member = await tx.teamMember.create({
          data: {
            teamId: team.id,
            userId: invitee.id,
            role: input.role,
            pending: true,
          },
          select: {
            id: true,
            role: true,
            pending: true,
            joinedAt: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        });

        return { member, teamId: team.id };
      });

      await logActivity(ctx.db, {
        teamId: result.teamId,
        actorId: ctx.session.user.id,
        action: 'member_invited',
        targetId: invitee.id,
        meta: { email: input.email, role: input.role },
      });

      return result.member;
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.memberId },
        select: {
          id: true,
          role: true,
          userId: true,
          teamId: true,
          user: { select: { email: true } },
          team: { select: { ownerId: true } },
        },
      });
      if (!member || member.team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (member.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove the owner' });
      }

      await ctx.db.teamMember.delete({ where: { id: input.memberId } });

      await logActivity(ctx.db, {
        teamId: member.teamId,
        actorId: ctx.session.user.id,
        action: 'member_removed',
        targetId: member.userId,
        meta: { email: member.user.email, role: member.role },
      });

      return { success: true };
    }),

  updateRole: protectedProcedure
    .input(z.object({
      memberId: z.string().min(1).max(100),
      role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.memberId },
        select: {
          id: true,
          role: true,
          teamId: true,
          userId: true,
          user: { select: { email: true } },
          team: { select: { ownerId: true } },
        },
      });
      if (!member || member.team.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (member.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot change the owner role' });
      }

      const oldRole = member.role;
      const updated = await ctx.db.teamMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
        select: { id: true, role: true },
      });

      await logActivity(ctx.db, {
        teamId: member.teamId,
        actorId: ctx.session.user.id,
        action: 'role_changed',
        targetId: member.userId,
        meta: { email: member.user.email, from: oldRole, to: input.role },
      });

      return updated;
    }),

  shareProject: protectedProcedure
    .input(z.object({ projectId: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true, title: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      const team = await ctx.db.team.findFirst({
        where: { ownerId: ctx.session.user.id },
        select: { id: true },
      });
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Create a team first' });

      const updated = await ctx.db.project.update({
        where: { id: input.projectId, userId: ctx.session.user.id },
        data: { teamId: team.id },
        select: { id: true, teamId: true },
      });

      await logActivity(ctx.db, {
        teamId: team.id,
        actorId: ctx.session.user.id,
        action: 'project_shared',
        targetId: input.projectId,
        meta: { title: project.title },
      });

      return updated;
    }),

  unshareProject: protectedProcedure
    .input(z.object({ projectId: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkTeamRate(ctx.session.user.id);
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true, teamId: true, title: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      if (!project.teamId) return { id: project.id, teamId: null };

      const teamId = project.teamId;
      const updated = await ctx.db.project.update({
        where: { id: input.projectId, userId: ctx.session.user.id },
        data: { teamId: null },
        select: { id: true, teamId: true },
      });

      await logActivity(ctx.db, {
        teamId,
        actorId: ctx.session.user.id,
        action: 'project_unshared',
        targetId: input.projectId,
        meta: { title: project.title },
      });

      return updated;
    }),

  /** Get project collaborators -- returns team members who have access to this project */
  getProjectCollaborators: protectedProcedure
    .input(z.object({ projectId: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id, pending: false } } } },
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
                where: { pending: false },
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
