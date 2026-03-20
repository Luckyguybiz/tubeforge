import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

const brandKitSchema = z.object({
  primaryColor: z.string().regex(hexColorRegex).default('#6366f1'),
  secondaryColor: z.string().regex(hexColorRegex).default('#ec4899'),
  accentColor: z.string().regex(hexColorRegex).default('#f59e0b'),
  logoUrl: z.string().url().nullish(),
});

/**
 * Brand kit is stored as JSON metadata on the User model.
 * We use a dedicated Prisma raw query approach via a JSON column,
 * but since the User model doesn't have a metadata field, we store
 * brand kit in a separate lightweight mechanism: a dedicated Asset
 * with type "brand-kit" and the JSON in its url field (as data URI).
 *
 * Actually simpler: we store it as a special DesignFolder with name "__brand_kit__"
 * that has the brand kit JSON serialized in its name field.
 *
 * Simplest approach: we use a special Asset with type="brand-kit".
 */
export const brandRouter = router({
  /** Get user's brand kit */
  getBrandKit: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const brandAsset = await ctx.db.asset.findFirst({
      where: { userId, type: 'brand-kit' },
      select: { id: true, url: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!brandAsset) {
      return {
        primaryColor: '#6366f1',
        secondaryColor: '#ec4899',
        accentColor: '#f59e0b',
        logoUrl: null,
      };
    }

    try {
      const data = JSON.parse(brandAsset.url) as Record<string, unknown>;
      return {
        primaryColor: (typeof data.primaryColor === 'string' ? data.primaryColor : '#6366f1'),
        secondaryColor: (typeof data.secondaryColor === 'string' ? data.secondaryColor : '#ec4899'),
        accentColor: (typeof data.accentColor === 'string' ? data.accentColor : '#f59e0b'),
        logoUrl: (typeof data.logoUrl === 'string' ? data.logoUrl : null),
      };
    } catch {
      return {
        primaryColor: '#6366f1',
        secondaryColor: '#ec4899',
        accentColor: '#f59e0b',
        logoUrl: null,
      };
    }
  }),

  /** Save user's brand kit */
  saveBrandKit: protectedProcedure
    .input(brandKitSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Rate limit
      const { success } = await rateLimit({
        identifier: `brand:${userId}`,
        limit: 10,
        window: 60,
      });
      if (!success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
      }

      // Check plan: STUDIO only
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });

      if (user?.plan !== 'STUDIO') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Brand kit is available on Studio plan only',
        });
      }

      const jsonData = JSON.stringify({
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        accentColor: input.accentColor,
        logoUrl: input.logoUrl ?? null,
      });

      // Upsert: delete existing and create new
      await ctx.db.asset.deleteMany({
        where: { userId, type: 'brand-kit' },
      });

      const asset = await ctx.db.asset.create({
        data: {
          url: jsonData,
          filename: 'brand-kit.json',
          type: 'brand-kit',
          size: 0,
          userId,
        },
        select: { id: true },
      });

      return { id: asset.id, ...input };
    }),
});
