import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';
import type { Prisma } from '@prisma/client';

/** Mutation rate limit: 20 writes per minute per user */
async function checkMutationRate(userId: string) {
  const { success } = await rateLimit({ identifier: `project:${userId}`, limit: 20, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 25, STUDIO: Infinity };
const SCENE_LIMITS: Record<string, number> = { FREE: 10, PRO: 50, STUDIO: 200 };

/** Current export format version */
const EXPORT_FORMAT_VERSION = 1;

/** Bounded schema for thumbnailData / metadata JSON fields */
const thumbnailDataSchema = z.record(
  z.string().max(100),
  z.union([z.string().max(10000), z.number(), z.boolean(), z.null()])
).optional();

/** Zod schema for validating imported scene data */
const importedSceneSchema = z.object({
  prompt: z.string().max(2000).nullish(),
  label: z.string().max(100).default(''),
  duration: z.number().min(1).max(60).default(5),
  order: z.number().min(0),
  model: z.enum(['turbo', 'standard', 'pro', 'cinematic']).default('standard'),
  metadata: thumbnailDataSchema.nullish(),
});

/** Zod schema for validating the full import payload */
const importPayloadSchema = z.object({
  formatVersion: z.number().min(1).max(EXPORT_FORMAT_VERSION),
  project: z.object({
    title: z.string().max(100),
    description: z.string().max(5000).nullish(),
    tags: z.array(z.string().max(100)).max(30).default([]),
    status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).default('DRAFT'),
    thumbnailData: thumbnailDataSchema.nullish(),
    characters: z.array(z.object({
      id: z.string(),
      name: z.string().max(100),
      role: z.string().max(100),
      avatar: z.string().max(10),
      ck: z.string().max(20),
      desc: z.string().max(500),
    })).max(50).nullish(),
  }),
  scenes: z.array(importedSceneSchema).max(200),
});

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().max(100).optional(),
      status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).optional(),
      sortBy: z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      // Offset-based pagination (default)
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
      // Cursor-based pagination (optional, takes precedence over page)
      cursor: z.string().nullish(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { search, status, sortBy = 'updatedAt', sortOrder = 'desc', page = 1, limit = 20, cursor } = input ?? {};

      const where: Record<string, unknown> = {
        OR: [
          { userId: ctx.session.user.id },
          { team: { members: { some: { userId: ctx.session.user.id } } } },
        ],
      };
      if (search) {
        where.title = { contains: search, mode: 'insensitive' };
      }
      if (status) {
        where.status = status;
      }

      const selectFields = {
        id: true,
        title: true,
        status: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { scenes: true } },
      } as const;

      // Cursor-based pagination for infinite scroll
      if (cursor) {
        const items = await ctx.db.project.findMany({
          where,
          select: selectFields,
          orderBy: { [sortBy]: sortOrder },
          take: limit + 1, // Fetch one extra to determine if there's a next page
          cursor: { id: cursor },
          skip: 1, // Skip the cursor item itself
        });

        const hasMore = items.length > limit;
        const results = hasMore ? items.slice(0, limit) : items;
        return {
          items: results,
          nextCursor: hasMore ? results[results.length - 1]?.id : null,
        };
      }

      // Offset-based pagination for page navigation
      const [items, total] = await Promise.all([
        ctx.db.project.findMany({
          where,
          select: selectFields,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.project.count({ where }),
      ]);

      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      take: z.number().min(1).max(50).default(20),
      skip: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { success } = await rateLimit({
        identifier: `search:${ctx.session.user.id}`,
        limit: 30,
        window: 60,
      });
      if (!success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
      }

      const userId = ctx.session.user.id;
      const rawQuery = stripTags(input.query).trim();
      if (!rawQuery) return { projects: [], scenes: [], total: 0 };

      // Prepare tsquery: split words, join with & for AND matching
      const words = rawQuery.split(/\s+/).filter(Boolean);
      const tsQueryStr = words.map((w) => w.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '')).filter(Boolean).join(' & ');
      const ilikePattern = `%${rawQuery}%`;

      // Full-text search on projects with ILIKE fallback
      type ProjectRow = {
        id: string;
        title: string;
        description: string | null;
        status: string;
        thumbnail_url: string | null;
        tags: string[];
        created_at: Date;
        updated_at: Date;
        scene_count: bigint;
        rank: number;
      };

      let projects: ProjectRow[] = [];

      if (tsQueryStr) {
        try {
          projects = await ctx.db.$queryRaw<ProjectRow[]>`
            SELECT
              p.id,
              p.title,
              p.description,
              p.status,
              p."thumbnailUrl" AS thumbnail_url,
              p.tags,
              p."createdAt" AS created_at,
              p."updatedAt" AS updated_at,
              (SELECT COUNT(*) FROM "Scene" s WHERE s."projectId" = p.id) AS scene_count,
              ts_rank(
                to_tsvector('russian', p.title || ' ' || COALESCE(p.description, '') || ' ' || array_to_string(p.tags, ' ')),
                to_tsquery('russian', ${tsQueryStr})
              ) AS rank
            FROM "Project" p
            WHERE p."userId" = ${userId}
              AND (
                to_tsvector('russian', p.title || ' ' || COALESCE(p.description, '') || ' ' || array_to_string(p.tags, ' '))
                @@ to_tsquery('russian', ${tsQueryStr})
                OR p.title ILIKE ${ilikePattern}
                OR p.description ILIKE ${ilikePattern}
              )
            ORDER BY rank DESC, p."updatedAt" DESC
            LIMIT ${input.take}
            OFFSET ${input.skip}
          `;
        } catch {
          // Fallback to pure ILIKE if tsquery fails (e.g. special characters)
          projects = await ctx.db.$queryRaw<ProjectRow[]>`
            SELECT
              p.id,
              p.title,
              p.description,
              p.status,
              p."thumbnailUrl" AS thumbnail_url,
              p.tags,
              p."createdAt" AS created_at,
              p."updatedAt" AS updated_at,
              (SELECT COUNT(*) FROM "Scene" s WHERE s."projectId" = p.id) AS scene_count,
              0::float AS rank
            FROM "Project" p
            WHERE p."userId" = ${userId}
              AND (
                p.title ILIKE ${ilikePattern}
                OR p.description ILIKE ${ilikePattern}
              )
            ORDER BY p."updatedAt" DESC
            LIMIT ${input.take}
            OFFSET ${input.skip}
          `;
        }
      }

      // Search scenes whose prompt/label match
      type SceneRow = {
        id: string;
        label: string;
        prompt: string | null;
        order: number;
        status: string;
        project_id: string;
        project_title: string;
      };

      let scenes: SceneRow[] = [];
      try {
        scenes = await ctx.db.$queryRaw<SceneRow[]>`
          SELECT
            s.id,
            s.label,
            s.prompt,
            s."order",
            s.status,
            s."projectId" AS project_id,
            p.title AS project_title
          FROM "Scene" s
          JOIN "Project" p ON p.id = s."projectId"
          WHERE p."userId" = ${userId}
            AND (
              s.label ILIKE ${ilikePattern}
              OR s.prompt ILIKE ${ilikePattern}
            )
          ORDER BY p."updatedAt" DESC, s."order" ASC
          LIMIT 10
        `;
      } catch {
        // Silently fail scene search — project results are primary
      }

      // Count total project matches for pagination
      type CountRow = { count: bigint };
      let total = projects.length;
      if (tsQueryStr) {
        try {
          const countResult = await ctx.db.$queryRaw<CountRow[]>`
            SELECT COUNT(*) AS count
            FROM "Project" p
            WHERE p."userId" = ${userId}
              AND (
                to_tsvector('russian', p.title || ' ' || COALESCE(p.description, '') || ' ' || array_to_string(p.tags, ' '))
                @@ to_tsquery('russian', ${tsQueryStr})
                OR p.title ILIKE ${ilikePattern}
                OR p.description ILIKE ${ilikePattern}
              )
          `;
          total = Number(countResult[0]?.count ?? 0);
        } catch {
          // Use length as fallback
        }
      }

      return {
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          thumbnailUrl: p.thumbnail_url,
          tags: p.tags,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          sceneCount: Number(p.scene_count),
          rank: p.rank,
        })),
        scenes: scenes.map((s) => ({
          id: s.id,
          label: s.label,
          prompt: s.prompt,
          order: s.order,
          status: s.status,
          projectId: s.project_id,
          projectTitle: s.project_title,
        })),
        total,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id } } } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          thumbnailUrl: true,
          thumbnailData: true,
          characters: true,
          status: true,
          userId: true,
          teamId: true,
          createdAt: true,
          updatedAt: true,
          scenes: {
            select: {
              id: true,
              prompt: true,
              label: true,
              duration: true,
              order: true,
              status: true,
              model: true,
              videoUrl: true,
              metadata: true,
              taskId: true,
              projectId: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      return project;
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);

      // Use interactive transaction to atomically check limit and create
      return ctx.db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { plan: true, _count: { select: { projects: true } } },
        });
        const planLimit = PLAN_LIMITS[user?.plan ?? 'FREE'];
        if ((user?._count.projects ?? 0) >= planLimit) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Достигнут лимит проектов. Обновите тарифный план.' });
        }
        return tx.project.create({
          data: { title: stripTags(input.title ?? 'Без названия'), userId: ctx.session.user.id },
          select: { id: true, title: true, status: true, createdAt: true },
        });
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().max(100).optional(),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string()).max(30).optional(),
      status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).optional(),
      characters: z.array(z.object({
        id: z.string(),
        name: z.string().max(100),
        role: z.string().max(100),
        avatar: z.string().max(10),
        ck: z.string().max(20),
        desc: z.string().max(500),
      })).max(50).optional(),
      thumbnailData: thumbnailDataSchema,
      thumbnailUrl: z.string().nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, characters, thumbnailData, ...rest } = input;
      // Sanitize text fields to prevent stored XSS
      if (rest.title) rest.title = stripTags(rest.title);
      if (rest.description) rest.description = stripTags(rest.description);
      if (rest.tags) rest.tags = rest.tags.map((tag) => stripTags(tag));
      const data: Prisma.ProjectUpdateInput = { ...rest };
      if (characters !== undefined) data.characters = characters as unknown as Prisma.InputJsonValue;
      if (thumbnailData !== undefined) data.thumbnailData = thumbnailData as unknown as Prisma.InputJsonValue;
      // Verify ownership or team membership before updating
      const existing = await ctx.db.project.findFirst({
        where: {
          id,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id } } } },
          ],
        },
        select: { id: true },
      });
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      return ctx.db.project.update({
        where: { id },
        data,
        select: { id: true, title: true, status: true, updatedAt: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);
      return ctx.db.project.delete({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
    }),

  /** Export a project as JSON (only the owner can export) */
  export: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { success } = await rateLimit({
        identifier: `export:${ctx.session.user.id}`,
        limit: 10,
        window: 60,
      });
      if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });

      const project = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        select: {
          title: true,
          description: true,
          tags: true,
          status: true,
          thumbnailData: true,
          characters: true,
          scenes: {
            select: {
              prompt: true,
              label: true,
              duration: true,
              order: true,
              model: true,
              metadata: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      return {
        formatVersion: EXPORT_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        project: {
          title: project.title,
          description: project.description,
          tags: project.tags,
          status: project.status,
          thumbnailData: project.thumbnailData,
          characters: project.characters,
        },
        scenes: project.scenes.map((scene) => ({
          prompt: scene.prompt,
          label: scene.label,
          duration: scene.duration,
          order: scene.order,
          model: scene.model,
          metadata: scene.metadata,
        })),
      };
    }),

  /** Import a project from JSON data */
  import: protectedProcedure
    .input(importPayloadSchema)
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);

      const userId = ctx.session.user.id;

      // Sanitize text fields
      const title = stripTags(input.project.title);
      const description = input.project.description ? stripTags(input.project.description) : null;
      const tags = input.project.tags.map((tag) => stripTags(tag));

      // Check plan limits and create project + scenes atomically in a transaction
      const result = await ctx.db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { plan: true, _count: { select: { projects: true } } },
        });

        const projectLimit = PLAN_LIMITS[user?.plan ?? 'FREE'] ?? 3;
        if ((user?._count.projects ?? 0) >= projectLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Project limit reached. Upgrade your plan.',
          });
        }

        const sceneLimit = SCENE_LIMITS[user?.plan ?? 'FREE'] ?? 10;
        if (input.scenes.length > sceneLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Scene limit is ${sceneLimit}. The imported project has ${input.scenes.length} scenes.`,
          });
        }

        const projectData: Prisma.ProjectCreateInput = {
          title,
          description,
          tags,
          status: 'DRAFT', // Always start imported projects as DRAFT
          user: { connect: { id: userId } },
        };
        if (input.project.thumbnailData) {
          projectData.thumbnailData = input.project.thumbnailData as Prisma.InputJsonValue;
        }
        if (input.project.characters) {
          projectData.characters = input.project.characters as unknown as Prisma.InputJsonValue;
        }

        const newProject = await tx.project.create({
          data: projectData,
          select: { id: true, title: true },
        });

        if (input.scenes.length > 0) {
          await tx.scene.createMany({
            data: input.scenes.map((scene, idx) => ({
              projectId: newProject.id,
              prompt: scene.prompt ? stripTags(scene.prompt) : null,
              label: stripTags(scene.label),
              duration: scene.duration,
              order: idx,
              model: scene.model,
              ...(scene.metadata ? { metadata: scene.metadata as Prisma.InputJsonValue } : {}),
            })),
          });
        }

        return newProject;
      });

      return { id: result.id, title: result.title };
    }),

  /** Duplicate an existing project with all its scenes */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);

      const userId = ctx.session.user.id;

      // Check plan limits, fetch source, and create duplicate atomically in a transaction
      const result = await ctx.db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { plan: true, _count: { select: { projects: true } } },
        });
        const projectLimit = PLAN_LIMITS[user?.plan ?? 'FREE'] ?? 3;
        if ((user?._count.projects ?? 0) >= projectLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Project limit reached. Upgrade your plan.',
          });
        }

        // Fetch the source project
        const source = await tx.project.findFirst({
          where: { id: input.id, userId },
          select: {
            title: true,
            description: true,
            tags: true,
            status: true,
            thumbnailData: true,
            thumbnailUrl: true,
            characters: true,
            scenes: {
              select: {
                prompt: true,
                label: true,
                duration: true,
                order: true,
                model: true,
                metadata: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        });
        if (!source) throw new TRPCError({ code: 'NOT_FOUND' });
        const projectData: Prisma.ProjectCreateInput = {
          title: `${source.title} (Copy)`,
          description: source.description,
          tags: source.tags,
          status: 'DRAFT',
          thumbnailUrl: source.thumbnailUrl,
          user: { connect: { id: userId } },
        };
        if (source.thumbnailData) {
          projectData.thumbnailData = source.thumbnailData as Prisma.InputJsonValue;
        }
        if (source.characters) {
          projectData.characters = source.characters as Prisma.InputJsonValue;
        }

        const newProject = await tx.project.create({
          data: projectData,
          select: { id: true, title: true, status: true, createdAt: true },
        });

        if (source.scenes.length > 0) {
          await tx.scene.createMany({
            data: source.scenes.map((scene, idx) => ({
              projectId: newProject.id,
              prompt: scene.prompt,
              label: scene.label,
              duration: scene.duration,
              order: idx,
              model: scene.model,
              ...(scene.metadata ? { metadata: scene.metadata as Prisma.InputJsonValue } : {}),
            })),
          });
        }

        return newProject;
      });

      return result;
    }),
});
