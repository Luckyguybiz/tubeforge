import { z } from 'zod';

/* ── Project schemas ───────────────────────────────────────────── */

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Название обязательно')
    .max(100, 'Название должно быть не длиннее 100 символов'),
  description: z
    .string()
    .max(5000, 'Описание должно быть не длиннее 5 000 символов')
    .optional(),
  tags: z
    .array(z.string().max(50))
    .max(30, 'Максимум 30 тегов')
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Название обязательно')
    .max(100, 'Название должно быть не длиннее 100 символов')
    .optional(),
  description: z
    .string()
    .max(5000, 'Описание должно быть не длиннее 5 000 символов')
    .optional(),
  tags: z
    .array(z.string().max(50))
    .max(30, 'Максимум 30 тегов')
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  thumbnailUrl: z.string().url('Некорректный URL обложки').optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/* ── AI generation schema ──────────────────────────────────────── */

export const generateAISchema = z.object({
  prompt: z
    .string()
    .min(1, 'Промпт обязателен')
    .max(2000, 'Промпт должен быть не длиннее 2 000 символов'),
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
    .min(1, 'Минимум 1 вариант')
    .max(6, 'Максимум 6 вариантов')
    .optional()
    .default(4),
  preserveText: z.boolean().optional().default(true),
  referenceImageUrl: z.string().url('Некорректный URL референса').optional(),
});

export type GenerateAIInput = z.infer<typeof generateAISchema>;

/* ── Profile schema ────────────────────────────────────────────── */

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Имя обязательно')
    .max(60, 'Имя должно быть не длиннее 60 символов')
    .optional(),
  bio: z
    .string()
    .max(500, 'Биография должна быть не длиннее 500 символов')
    .optional(),
  avatarUrl: z.string().url('Некорректный URL аватара').optional(),
  channelUrl: z
    .string()
    .url('Некорректный URL канала')
    .regex(
      /youtube\.com|youtu\.be/,
      'Укажите корректный URL YouTube-канала',
    )
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
