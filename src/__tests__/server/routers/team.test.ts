// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));

const mockStripTags = vi.fn((s: string) => s.replace(/<[^>]*>/g, ''));
vi.mock('@/lib/sanitize', () => ({ stripTags: (s: string) => mockStripTags(s) }));

vi.mock('@/lib/constants', () => ({ RATE_LIMIT_ERROR: 'Too many requests' }));

/* ── tRPC setup mirroring src/server/trpc.ts ───────────────────── */

type Session = {
  user: { id: string; name?: string | null; email?: string | null };
  expires: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockDb = Record<string, Record<string, vi.Mock<any>>>;

type TRPCContext = { db: MockDb; session: Session };

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});

/* ── Imports after mocks are set up ────────────────────────────── */

const { rateLimit } = await import('@/lib/rate-limit');
const { stripTags } = await import('@/lib/sanitize');

const RATE_LIMIT_ERROR = 'Too many requests';

async function checkTeamRate(userId: string) {
  const { success } = await rateLimit({ identifier: `team:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/* ── Replicate team router logic ───────────────────────────────── */

const teamRouter = t.router({
  getTeam: protectedProcedure.query(async ({ ctx }) => {
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
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { plan: true },
      });
      if (user?.plan !== 'STUDIO') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Teams require Studio plan' });
      }

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
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });

      if (team._count.members >= 10) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Max 10 members' });
      }

      const invitee = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (!invitee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const existingMember = await ctx.db.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: invitee.id } },
        select: { id: true },
      });
      if (existingMember) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already in team' });
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
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove owner' });
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
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot change owner role' });
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
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Create a team first' });

      return ctx.db.project.update({
        where: { id: input.projectId },
        data: { teamId: team.id },
        select: { id: true, teamId: true },
      });
    }),
});

/* ── Helpers ───────────────────────────────────────────────────── */

const USER_ID = 'user-team-owner';

function makeSession(userId = USER_ID): Session {
  return { user: { id: userId, name: 'Owner', email: 'owner@example.com' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ plan: 'STUDIO' }),
    },
    team: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'team-1', name: 'My Team' }),
    },
    teamMember: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'member-new',
        role: 'EDITOR',
        user: { id: 'invitee-1', name: 'Invitee', email: 'inv@example.com', image: null },
      }),
      delete: vi.fn().mockResolvedValue({ id: 'member-1' }),
      update: vi.fn().mockResolvedValue({ id: 'member-1', role: 'ADMIN' }),
    },
    project: {
      findFirst: vi.fn().mockResolvedValue({ id: 'proj-1' }),
      update: vi.fn().mockResolvedValue({ id: 'proj-1', teamId: 'team-1' }),
    },
  };
}

function createCaller(db: MockDb, session: Session) {
  return teamRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('teamRouter', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
    db = makeDb();
    caller = createCaller(db, makeSession());
  });

  /* ── getTeam ──────────────────────────────────────────────────── */

  describe('getTeam', () => {
    it('returns the owned team when one exists', async () => {
      const teamData = { id: 'team-1', name: 'My Team', owner: {}, members: [], _count: { projects: 0 } };
      db.team.findFirst.mockResolvedValue(teamData);

      const result = await caller.getTeam();

      expect(result).toEqual(teamData);
    });

    it('returns the team from membership when no owned team', async () => {
      const teamData = { id: 'team-2', name: 'Other Team' };
      db.team.findFirst.mockResolvedValue(null);
      db.teamMember.findFirst.mockResolvedValue({ team: teamData });

      const result = await caller.getTeam();

      expect(result).toEqual(teamData);
    });

    it('returns null when user has no team', async () => {
      db.team.findFirst.mockResolvedValue(null);
      db.teamMember.findFirst.mockResolvedValue(null);

      const result = await caller.getTeam();

      expect(result).toBeNull();
    });

    it('prefers owned team over membership team', async () => {
      const owned = { id: 'team-owned', name: 'Owned' };
      const memberOf = { team: { id: 'team-member', name: 'Member' } };
      db.team.findFirst.mockResolvedValue(owned);
      db.teamMember.findFirst.mockResolvedValue(memberOf);

      const result = await caller.getTeam();

      expect(result).toEqual(owned);
    });

    it('queries membership for the current user', async () => {
      db.team.findFirst.mockResolvedValue(null);
      db.teamMember.findFirst.mockResolvedValue(null);

      await caller.getTeam();

      expect(db.teamMember.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID },
        }),
      );
    });

    it('queries owned team for the current user', async () => {
      db.team.findFirst.mockResolvedValue(null);
      db.teamMember.findFirst.mockResolvedValue(null);

      await caller.getTeam();

      expect(db.team.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: USER_ID },
        }),
      );
    });
  });

  /* ── create ───────────────────────────────────────────────────── */

  describe('create', () => {
    it('creates a team for STUDIO plan users', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'STUDIO' });
      db.team.findFirst.mockResolvedValue(null); // no existing team

      const result = await caller.create({ name: 'New Team' });

      expect(result).toEqual({ id: 'team-1', name: 'My Team' });
      expect(db.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Team',
            ownerId: USER_ID,
            members: { create: { userId: USER_ID, role: 'OWNER' } },
          }),
        }),
      );
    });

    it('calls stripTags on team name', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'STUDIO' });
      db.team.findFirst.mockResolvedValue(null);

      await caller.create({ name: '<script>xss</script>Team' });

      expect(mockStripTags).toHaveBeenCalledWith('<script>xss</script>Team');
    });

    it('calls rate limit check', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'STUDIO' });
      db.team.findFirst.mockResolvedValue(null);

      await caller.create({ name: 'Team' });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `team:${USER_ID}`, limit: 10, window: 60 }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.create({ name: 'Team' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });

    it('throws FORBIDDEN for FREE plan users', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'FREE' });

      await expect(caller.create({ name: 'Team' })).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => { const d = makeDb(); d.user.findUnique.mockResolvedValue({ plan: 'FREE' }); return d; })(),
          makeSession(),
        ).create({ name: 'Team' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('throws FORBIDDEN for PRO plan users', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'PRO' });

      await expect(caller.create({ name: 'Team' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('throws CONFLICT when user already owns a team', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'STUDIO' });
      db.team.findFirst.mockResolvedValue({ id: 'existing-team' });

      await expect(caller.create({ name: 'Another Team' })).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => {
            const d = makeDb();
            d.user.findUnique.mockResolvedValue({ plan: 'STUDIO' });
            d.team.findFirst.mockResolvedValue({ id: 'existing-team' });
            return d;
          })(),
          makeSession(),
        ).create({ name: 'Another Team' }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('adds the owner as a team member with OWNER role', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'STUDIO' });
      db.team.findFirst.mockResolvedValue(null);

      await caller.create({ name: 'Team' });

      expect(db.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            members: { create: { userId: USER_ID, role: 'OWNER' } },
          }),
        }),
      );
    });
  });

  /* ── invite ───────────────────────────────────────────────────── */

  describe('invite', () => {
    beforeEach(() => {
      db.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 2 } });
      db.user.findUnique.mockResolvedValue({ id: 'invitee-1' });
      db.teamMember.findUnique.mockResolvedValue(null); // not already a member
    });

    it('invites a user to the team', async () => {
      const result = await caller.invite({ email: 'inv@example.com' });

      expect(result).toHaveProperty('id');
      expect(db.teamMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: 'team-1',
            userId: 'invitee-1',
            role: 'EDITOR',
          }),
        }),
      );
    });

    it('uses default EDITOR role when not specified', async () => {
      await caller.invite({ email: 'inv@example.com' });

      expect(db.teamMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'EDITOR' }),
        }),
      );
    });

    it('allows specifying ADMIN role', async () => {
      await caller.invite({ email: 'inv@example.com', role: 'ADMIN' });

      expect(db.teamMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'ADMIN' }),
        }),
      );
    });

    it('allows specifying VIEWER role', async () => {
      await caller.invite({ email: 'inv@example.com', role: 'VIEWER' });

      expect(db.teamMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'VIEWER' }),
        }),
      );
    });

    it('calls rate limit check', async () => {
      await caller.invite({ email: 'inv@example.com' });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `team:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.invite({ email: 'inv@example.com' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });

    it('throws NOT_FOUND when user does not own a team', async () => {
      db.team.findFirst.mockResolvedValue(null);

      await expect(caller.invite({ email: 'inv@example.com' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws FORBIDDEN when team has 10 members (max limit)', async () => {
      db.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 10 } });

      await expect(caller.invite({ email: 'inv@example.com' })).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => {
            const d = makeDb();
            d.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 10 } });
            d.user.findUnique.mockResolvedValue({ id: 'inv' });
            return d;
          })(),
          makeSession(),
        ).invite({ email: 'inv@example.com' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('allows invite when team has 9 members (under limit)', async () => {
      db.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 9 } });

      await expect(caller.invite({ email: 'inv@example.com' })).resolves.toBeDefined();
    });

    it('throws NOT_FOUND when invitee email is not registered', async () => {
      db.user.findUnique.mockResolvedValue(null);

      await expect(caller.invite({ email: 'unknown@example.com' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws CONFLICT when user is already a team member', async () => {
      db.teamMember.findUnique.mockResolvedValue({ id: 'existing-member' });

      await expect(caller.invite({ email: 'inv@example.com' })).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => {
            const d = makeDb();
            d.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 2 } });
            d.user.findUnique.mockResolvedValue({ id: 'invitee-1' });
            d.teamMember.findUnique.mockResolvedValue({ id: 'existing-member' });
            return d;
          })(),
          makeSession(),
        ).invite({ email: 'inv@example.com' }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('checks the correct compound key for existing membership', async () => {
      await caller.invite({ email: 'inv@example.com' });

      expect(db.teamMember.findUnique).toHaveBeenCalledWith({
        where: { teamId_userId: { teamId: 'team-1', userId: 'invitee-1' } },
        select: { id: true },
      });
    });
  });

  /* ── removeMember ─────────────────────────────────────────────── */

  describe('removeMember', () => {
    beforeEach(() => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        role: 'EDITOR',
        team: { ownerId: USER_ID },
      });
    });

    it('removes a team member', async () => {
      const result = await caller.removeMember({ memberId: 'member-1' });

      expect(result).toEqual({ success: true });
      expect(db.teamMember.delete).toHaveBeenCalledWith({ where: { id: 'member-1' } });
    });

    it('calls rate limit check', async () => {
      await caller.removeMember({ memberId: 'member-1' });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `team:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.removeMember({ memberId: 'member-1' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });

    it('throws NOT_FOUND when member does not exist', async () => {
      db.teamMember.findUnique.mockResolvedValue(null);

      await expect(caller.removeMember({ memberId: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws NOT_FOUND when caller is not the team owner', async () => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        role: 'EDITOR',
        team: { ownerId: 'different-owner' },
      });

      await expect(caller.removeMember({ memberId: 'member-1' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws FORBIDDEN when trying to remove the OWNER', async () => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-owner',
        role: 'OWNER',
        team: { ownerId: USER_ID },
      });

      await expect(caller.removeMember({ memberId: 'member-owner' })).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => {
            const d = makeDb();
            d.teamMember.findUnique.mockResolvedValue({
              id: 'member-owner',
              role: 'OWNER',
              team: { ownerId: USER_ID },
            });
            return d;
          })(),
          makeSession(),
        ).removeMember({ memberId: 'member-owner' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('allows removing ADMIN members', async () => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-admin',
        role: 'ADMIN',
        team: { ownerId: USER_ID },
      });

      await expect(caller.removeMember({ memberId: 'member-admin' })).resolves.toEqual({ success: true });
    });

    it('allows removing VIEWER members', async () => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-viewer',
        role: 'VIEWER',
        team: { ownerId: USER_ID },
      });

      await expect(caller.removeMember({ memberId: 'member-viewer' })).resolves.toEqual({ success: true });
    });
  });

  /* ── updateRole ───────────────────────────────────────────────── */

  describe('updateRole', () => {
    beforeEach(() => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        role: 'EDITOR',
        team: { ownerId: USER_ID },
      });
    });

    it('updates a member role', async () => {
      const result = await caller.updateRole({ memberId: 'member-1', role: 'ADMIN' });

      expect(result).toEqual({ id: 'member-1', role: 'ADMIN' });
      expect(db.teamMember.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: { role: 'ADMIN' },
        select: { id: true, role: true },
      });
    });

    it('calls rate limit check', async () => {
      await caller.updateRole({ memberId: 'member-1', role: 'VIEWER' });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `team:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.updateRole({ memberId: 'member-1', role: 'ADMIN' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });

    it('throws NOT_FOUND when member does not exist', async () => {
      db.teamMember.findUnique.mockResolvedValue(null);

      await expect(caller.updateRole({ memberId: 'nonexistent', role: 'ADMIN' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws NOT_FOUND when caller is not the team owner', async () => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        role: 'EDITOR',
        team: { ownerId: 'different-owner' },
      });

      await expect(caller.updateRole({ memberId: 'member-1', role: 'ADMIN' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws FORBIDDEN when trying to change the OWNER role', async () => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-owner',
        role: 'OWNER',
        team: { ownerId: USER_ID },
      });

      await expect(
        caller.updateRole({ memberId: 'member-owner', role: 'ADMIN' }),
      ).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => {
            const d = makeDb();
            d.teamMember.findUnique.mockResolvedValue({
              id: 'member-owner',
              role: 'OWNER',
              team: { ownerId: USER_ID },
            });
            return d;
          })(),
          makeSession(),
        ).updateRole({ memberId: 'member-owner', role: 'ADMIN' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('can change role to EDITOR', async () => {
      db.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        role: 'ADMIN',
        team: { ownerId: USER_ID },
      });

      await caller.updateRole({ memberId: 'member-1', role: 'EDITOR' });

      expect(db.teamMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: 'EDITOR' },
        }),
      );
    });

    it('can change role to VIEWER', async () => {
      await caller.updateRole({ memberId: 'member-1', role: 'VIEWER' });

      expect(db.teamMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: 'VIEWER' },
        }),
      );
    });
  });

  /* ── shareProject ─────────────────────────────────────────────── */

  describe('shareProject', () => {
    beforeEach(() => {
      db.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      db.team.findFirst.mockResolvedValue({ id: 'team-1' });
    });

    it('shares a project with the team', async () => {
      const result = await caller.shareProject({ projectId: 'proj-1' });

      expect(result).toEqual({ id: 'proj-1', teamId: 'team-1' });
      expect(db.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: { teamId: 'team-1' },
        select: { id: true, teamId: true },
      });
    });

    it('throws NOT_FOUND when project does not exist or is not owned', async () => {
      db.project.findFirst.mockResolvedValue(null);

      await expect(caller.shareProject({ projectId: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws NOT_FOUND when user has no team', async () => {
      db.team.findFirst.mockResolvedValue(null);

      await expect(caller.shareProject({ projectId: 'proj-1' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('verifies project ownership', async () => {
      await caller.shareProject({ projectId: 'proj-1' });

      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', userId: USER_ID },
        select: { id: true },
      });
    });

    it('looks up team owned by the user', async () => {
      await caller.shareProject({ projectId: 'proj-1' });

      expect(db.team.findFirst).toHaveBeenCalledWith({
        where: { ownerId: USER_ID },
        select: { id: true },
      });
    });
  });

  /* ── Input validation ─────────────────────────────────────────── */

  describe('input validation', () => {
    it('rejects create with empty name', async () => {
      await expect(caller.create({ name: '' })).rejects.toThrow();
    });

    it('rejects create with name over 100 chars', async () => {
      await expect(caller.create({ name: 'X'.repeat(101) })).rejects.toThrow();
    });

    it('rejects invite with invalid email', async () => {
      await expect(caller.invite({ email: 'not-an-email' })).rejects.toThrow();
    });

    it('rejects invite with OWNER role', async () => {
      await expect(
        // @ts-expect-error - intentionally invalid for test
        caller.invite({ email: 'a@b.com', role: 'OWNER' }),
      ).rejects.toThrow();
    });

    it('rejects updateRole with invalid role', async () => {
      await expect(
        // @ts-expect-error - intentionally invalid for test
        caller.updateRole({ memberId: 'm1', role: 'OWNER' }),
      ).rejects.toThrow();
    });

    it('accepts all valid invite roles', async () => {
      db.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 2 } });
      db.user.findUnique.mockResolvedValue({ id: 'inv-1' });
      db.teamMember.findUnique.mockResolvedValue(null);

      for (const role of ['ADMIN', 'EDITOR', 'VIEWER'] as const) {
        const d = makeDb();
        d.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 2 } });
        d.user.findUnique.mockResolvedValue({ id: 'inv-1' });
        d.teamMember.findUnique.mockResolvedValue(null);
        const c = createCaller(d, makeSession());
        await expect(c.invite({ email: 'a@b.com', role })).resolves.toBeDefined();
      }
    });

    it('accepts all valid updateRole roles', async () => {
      for (const role of ['ADMIN', 'EDITOR', 'VIEWER'] as const) {
        const d = makeDb();
        d.teamMember.findUnique.mockResolvedValue({
          id: 'm1', role: 'EDITOR', team: { ownerId: USER_ID },
        });
        const c = createCaller(d, makeSession());
        await expect(c.updateRole({ memberId: 'm1', role })).resolves.toBeDefined();
      }
    });
  });

  /* ── Team member limit constant ───────────────────────────────── */

  describe('team member limit', () => {
    it('allows exactly 9 members', async () => {
      db.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 9 } });
      db.user.findUnique.mockResolvedValue({ id: 'inv-1' });
      db.teamMember.findUnique.mockResolvedValue(null);

      await expect(caller.invite({ email: 'a@b.com' })).resolves.toBeDefined();
    });

    it('blocks at exactly 10 members', async () => {
      db.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 10 } });

      await expect(caller.invite({ email: 'a@b.com' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('blocks at more than 10 members', async () => {
      db.team.findFirst.mockResolvedValue({ id: 'team-1', _count: { members: 15 } });

      await expect(caller.invite({ email: 'a@b.com' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });
});
