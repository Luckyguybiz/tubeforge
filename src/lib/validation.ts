import { z } from 'zod';

/* ── Project schemas ───────────────────────────────────────────── */

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less'),
  description: z
    .string()
    .max(5000, 'Description must be 5,000 characters or less')
    .optional(),
  tags: z
    .array(z.string().max(50))
    .max(30, 'Maximum 30 tags')
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(5000, 'Description must be 5,000 characters or less')
    .optional(),
  tags: z
    .array(z.string().max(50))
    .max(30, 'Maximum 30 tags')
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/* ── AI generation schema ──────────────────────────────────────── */

export const generateAISchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(2000, 'Prompt must be 2,000 characters or less'),
  style: z
    .enum([
      'realistic',
      'anime',
      'cinematic',
      'minimalist',
      '3d',
      'popart',
    ])
    .optional(),
  count: z
    .number()
    .int()
    .min(1, 'At least 1 variant required')
    .max(6, 'Maximum 6 variants')
    .optional()
    .default(4),
  preserveText: z.boolean().optional().default(true),
  referenceImageUrl: z.string().url('Invalid reference URL').optional(),
});

export type GenerateAIInput = z.infer<typeof generateAISchema>;

/* ── Profile schema ────────────────────────────────────────────── */

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(60, 'Name must be 60 characters or less')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be 500 characters or less')
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  channelUrl: z
    .string()
    .url('Invalid channel URL')
    .regex(
      /youtube\.com|youtu\.be/,
      'Please enter a valid YouTube channel URL',
    )
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
