import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { rateLimit } from '@/lib/rate-limit';
import { TRPCError } from '@trpc/server';
import OpenAI from 'openai';

export const keywordsRouter = router({
  /** Search keywords — uses GPT-4o to generate keyword data */
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const rl = await rateLimit({
        identifier: `keywords:${ctx.session.user.id}`,
        limit: 10,
        window: 60,
      });
      if (!rl.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${Math.ceil((rl.reset - Date.now()) / 1000)}s`,
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service is temporarily unavailable. Please try again later.',
        });
      }

      const openai = new OpenAI({ apiKey });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `You are a YouTube SEO expert. For the keyword "${input.query}", return JSON with:
{
  "mainKeyword": { "keyword": "...", "searchVolume": <number>, "competition": "low"|"medium"|"high", "cpc": <number>, "trend": "rising"|"stable"|"declining" },
  "relatedKeywords": [
    { "keyword": "...", "searchVolume": <number>, "competition": "low"|"medium"|"high", "relevance": <1-100> }
  ],
  "longTailKeywords": [
    { "keyword": "...", "searchVolume": <number>, "competition": "low"|"medium"|"high" }
  ],
  "risingKeywords": [
    { "keyword": "...", "searchVolume": <number>, "volumeChange": <percentage number like 500 for 500%> }
  ],
  "topOpportunities": [
    { "keyword": "...", "searchVolume": <number>, "competition": "low", "opportunity": "high"|"medium" }
  ]
}
Generate realistic data for YouTube search. Return 10 related keywords, 8 long-tail, 5 rising, and 5 top opportunities.`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      });

      const raw = res.choices[0]?.message?.content;
      if (!raw) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No response from AI',
        });
      }

      const data = JSON.parse(raw) as {
        mainKeyword: {
          keyword: string;
          searchVolume: number;
          competition: 'low' | 'medium' | 'high';
          cpc: number;
          trend: 'rising' | 'stable' | 'declining';
        };
        relatedKeywords: {
          keyword: string;
          searchVolume: number;
          competition: 'low' | 'medium' | 'high';
          relevance: number;
        }[];
        longTailKeywords: {
          keyword: string;
          searchVolume: number;
          competition: 'low' | 'medium' | 'high';
        }[];
        risingKeywords: {
          keyword: string;
          searchVolume: number;
          volumeChange: number;
        }[];
        topOpportunities: {
          keyword: string;
          searchVolume: number;
          competition: string;
          opportunity: 'high' | 'medium';
        }[];
      };
      return data;
    }),

  /** Get trending/rising keywords (no search needed) */
  getTrending: protectedProcedure
    .input(
      z.object({
        period: z.enum(['today', 'week', 'month']).default('month'),
        topic: z.string().max(200).optional(),
        language: z.string().max(50).default('English'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rl = await rateLimit({
        identifier: `trending:${ctx.session.user.id}`,
        limit: 5,
        window: 60,
      });
      if (!rl.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${Math.ceil((rl.reset - Date.now()) / 1000)}s`,
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service is temporarily unavailable. Please try again later.',
        });
      }

      const openai = new OpenAI({ apiKey });
      const periodLabel =
        input.period === 'today'
          ? 'today'
          : input.period === 'week'
            ? 'this week'
            : 'this month';

      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Generate 15 trending/rising YouTube keywords for ${periodLabel} in ${input.language}${input.topic ? ` for topic: ${input.topic}` : ''}. Return JSON:
{
  "keywords": [
    { "keyword": "...", "searchVolume": <number>, "volumeChange": <percentage like 5000 for 5000%> }
  ]
}
Use realistic, currently trending YouTube topics.`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      });

      const raw = res.choices[0]?.message?.content;
      if (!raw) {
        return { keywords: [] };
      }

      return JSON.parse(raw) as {
        keywords: {
          keyword: string;
          searchVolume: number;
          volumeChange: number;
        }[];
      };
    }),
});
