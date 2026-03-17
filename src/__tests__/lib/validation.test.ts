import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  generateAISchema,
  updateProfileSchema,
} from '@/lib/validation';

/* ── createProjectSchema ─────────────────────────────────────── */

describe('createProjectSchema', () => {
  it('accepts valid input with only title', () => {
    const result = createProjectSchema.safeParse({ title: 'Мой проект' });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with all fields', () => {
    const result = createProjectSchema.safeParse({
      title: 'Мой проект',
      description: 'Описание проекта',
      tags: ['tag1', 'tag2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title (empty object)', () => {
    const result = createProjectSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty title string', () => {
    const result = createProjectSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('accepts title at exactly 100 characters', () => {
    const result = createProjectSchema.safeParse({ title: 'A'.repeat(100) });
    expect(result.success).toBe(true);
  });

  it('rejects title at 101 characters', () => {
    const result = createProjectSchema.safeParse({ title: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('accepts description at exactly 5000 characters', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      description: 'X'.repeat(5000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects description at 5001 characters', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      description: 'X'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('allows omitting description', () => {
    const result = createProjectSchema.safeParse({ title: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it('allows omitting tags', () => {
    const result = createProjectSchema.safeParse({ title: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toBeUndefined();
    }
  });

  it('accepts exactly 30 tags', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      tags: Array.from({ length: 30 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(true);
  });

  it('rejects 31 tags', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      tags: Array.from({ length: 31 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a single tag longer than 50 characters', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      tags: ['A'.repeat(51)],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a tag at exactly 50 characters', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      tags: ['A'.repeat(50)],
    });
    expect(result.success).toBe(true);
  });
});

/* ── updateProjectSchema ─────────────────────────────────────── */

describe('updateProjectSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only title', () => {
    const result = updateProjectSchema.safeParse({ title: 'New title' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title string when provided', () => {
    const result = updateProjectSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title longer than 100 chars', () => {
    const result = updateProjectSchema.safeParse({ title: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('accepts all valid status values', () => {
    for (const status of ['draft', 'published', 'archived'] as const) {
      const result = updateProjectSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status value', () => {
    const result = updateProjectSchema.safeParse({ status: 'deleted' });
    expect(result.success).toBe(false);
  });

  it('accepts valid thumbnail URL', () => {
    const result = updateProjectSchema.safeParse({
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid thumbnail URL', () => {
    const result = updateProjectSchema.safeParse({
      thumbnailUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description longer than 5000 chars', () => {
    const result = updateProjectSchema.safeParse({
      description: 'X'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts all fields at once', () => {
    const result = updateProjectSchema.safeParse({
      title: 'Updated',
      description: 'New description',
      tags: ['edited'],
      status: 'published',
      thumbnailUrl: 'https://example.com/new.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects tags array exceeding 30 items', () => {
    const result = updateProjectSchema.safeParse({
      tags: Array.from({ length: 31 }, (_, i) => `t${i}`),
    });
    expect(result.success).toBe(false);
  });
});

/* ── generateAISchema ────────────────────────────────────────── */

describe('generateAISchema', () => {
  it('accepts minimal valid input (prompt only)', () => {
    const result = generateAISchema.safeParse({ prompt: 'Яркая обложка' });
    expect(result.success).toBe(true);
  });

  it('rejects missing prompt', () => {
    const result = generateAISchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty prompt', () => {
    const result = generateAISchema.safeParse({ prompt: '' });
    expect(result.success).toBe(false);
  });

  it('accepts prompt at exactly 2000 characters', () => {
    const result = generateAISchema.safeParse({ prompt: 'A'.repeat(2000) });
    expect(result.success).toBe(true);
  });

  it('rejects prompt at 2001 characters', () => {
    const result = generateAISchema.safeParse({ prompt: 'A'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('accepts all valid style enum values', () => {
    const styles = ['realistic', 'anime', 'cinematic', 'minimalist', '3d', 'popart'] as const;
    for (const style of styles) {
      const result = generateAISchema.safeParse({ prompt: 'test', style });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid style value', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', style: 'watercolor' });
    expect(result.success).toBe(false);
  });

  it('defaults count to 4 when omitted', () => {
    const result = generateAISchema.safeParse({ prompt: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(4);
    }
  });

  it('accepts count of 1 (minimum)', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', count: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts count of 6 (maximum)', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', count: 6 });
    expect(result.success).toBe(true);
  });

  it('rejects count of 0 (below minimum)', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', count: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects count of 7 (above maximum)', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', count: 7 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer count', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', count: 2.5 });
    expect(result.success).toBe(false);
  });

  it('defaults preserveText to true when omitted', () => {
    const result = generateAISchema.safeParse({ prompt: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preserveText).toBe(true);
    }
  });

  it('allows setting preserveText to false', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', preserveText: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preserveText).toBe(false);
    }
  });

  it('accepts valid referenceImageUrl', () => {
    const result = generateAISchema.safeParse({
      prompt: 'test',
      referenceImageUrl: 'https://cdn.example.com/ref.png',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid referenceImageUrl', () => {
    const result = generateAISchema.safeParse({
      prompt: 'test',
      referenceImageUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all fields together', () => {
    const result = generateAISchema.safeParse({
      prompt: 'Epic gaming thumbnail',
      style: 'cinematic',
      count: 3,
      preserveText: false,
      referenceImageUrl: 'https://example.com/ref.jpg',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(3);
      expect(result.data.preserveText).toBe(false);
    }
  });
});

/* ── updateProfileSchema ─────────────────────────────────────── */

describe('updateProfileSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid name', () => {
    const result = updateProfileSchema.safeParse({ name: 'Иван Петров' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name when provided', () => {
    const result = updateProfileSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('accepts name at exactly 60 characters', () => {
    const result = updateProfileSchema.safeParse({ name: 'A'.repeat(60) });
    expect(result.success).toBe(true);
  });

  it('rejects name at 61 characters', () => {
    const result = updateProfileSchema.safeParse({ name: 'A'.repeat(61) });
    expect(result.success).toBe(false);
  });

  it('accepts valid bio', () => {
    const result = updateProfileSchema.safeParse({ bio: 'YouTube-креатор из Москвы' });
    expect(result.success).toBe(true);
  });

  it('accepts bio at exactly 500 characters', () => {
    const result = updateProfileSchema.safeParse({ bio: 'Б'.repeat(500) });
    expect(result.success).toBe(true);
  });

  it('rejects bio at 501 characters', () => {
    const result = updateProfileSchema.safeParse({ bio: 'Б'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts valid avatar URL', () => {
    const result = updateProfileSchema.safeParse({
      avatarUrl: 'https://example.com/avatar.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid avatar URL', () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts youtube.com channel URL', () => {
    const result = updateProfileSchema.safeParse({
      channelUrl: 'https://www.youtube.com/c/TestChannel',
    });
    expect(result.success).toBe(true);
  });

  it('accepts youtu.be channel URL', () => {
    const result = updateProfileSchema.safeParse({
      channelUrl: 'https://youtu.be/channel123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts youtube.com/@handle URL', () => {
    const result = updateProfileSchema.safeParse({
      channelUrl: 'https://youtube.com/@myhandle',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-YouTube URL for channelUrl', () => {
    const result = updateProfileSchema.safeParse({
      channelUrl: 'https://vimeo.com/channel',
    });
    expect(result.success).toBe(false);
  });

  it('rejects plain string (non-URL) for channelUrl', () => {
    const result = updateProfileSchema.safeParse({
      channelUrl: 'just-text',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all fields together', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Тест Тестович',
      bio: 'Описание профиля',
      avatarUrl: 'https://example.com/me.png',
      channelUrl: 'https://www.youtube.com/@testchannel',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-YouTube domain even if URL is valid', () => {
    const result = updateProfileSchema.safeParse({
      channelUrl: 'https://twitch.tv/mychannel',
    });
    expect(result.success).toBe(false);
  });
});
