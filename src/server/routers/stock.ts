import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { rateLimit } from '@/lib/rate-limit';
import { TRPCError } from '@trpc/server';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

export const stockRouter = router({
  /** Search Pexels photos */
  searchPhotos: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(200),
      page: z.number().min(1).default(1),
      perPage: z.number().min(1).max(40).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Rate limit: 30 stock searches per minute per user
      const { success } = await rateLimit({
        identifier: `stock:${userId}`,
        limit: 30,
        window: 60,
      });
      if (!success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
      }

      const apiKey = process.env.PEXELS_API_KEY;
      if (!apiKey) {
        return {
          photos: [],
          total: 0,
          page: input.page,
          note: 'Stock photos temporarily unavailable',
        };
      }

      try {
        const params = new URLSearchParams({
          query: input.query,
          page: String(input.page),
          per_page: String(input.perPage),
        });

        const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
          headers: { Authorization: apiKey },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          return {
            photos: [],
            total: 0,
            page: input.page,
            note: 'Failed to load stock photos',
          };
        }

        const data = (await res.json()) as PexelsResponse;

        return {
          photos: data.photos.map((p) => ({
            id: p.id,
            width: p.width,
            height: p.height,
            url: p.url,
            photographer: p.photographer,
            photographerUrl: p.photographer_url,
            src: {
              medium: p.src.medium,
              large: p.src.large,
              original: p.src.original,
              small: p.src.small,
            },
            alt: p.alt || '',
          })),
          total: data.total_results,
          page: data.page,
          note: null,
        };
      } catch {
        return {
          photos: [],
          total: 0,
          page: input.page,
          note: 'Error loading stock photos',
        };
      }
    }),
});
