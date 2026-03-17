import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  generateAISchema,
  updateProfileSchema,
} from '@/lib/validation';

describe('createProjectSchema', () => {
  it('accepts valid input', () => {
    const result = createProjectSchema.safeParse({ title: 'Мой проект' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createProjectSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title longer than 100 chars', () => {
    const result = createProjectSchema.safeParse({ title: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('accepts optional description', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      description: 'Some desc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects description longer than 5000 chars', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      description: 'X'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional tags array', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      tags: ['tag1', 'tag2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 30 tags', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      tags: Array.from({ length: 31 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe('updateProjectSchema', () => {
  it('accepts partial updates', () => {
    const result = updateProjectSchema.safeParse({ title: 'New title' });
    expect(result.success).toBe(true);
  });

  it('accepts valid status values', () => {
    for (const status of ['draft', 'published', 'archived'] as const) {
      const result = updateProjectSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = updateProjectSchema.safeParse({ status: 'deleted' });
    expect(result.success).toBe(false);
  });

  it('accepts valid thumbnail URL', () => {
    const result = updateProjectSchema.safeParse({
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid thumbnail URL', () => {
    const result = updateProjectSchema.safeParse({
      thumbnailUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty object (all optional)', () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('generateAISchema', () => {
  it('accepts valid prompt', () => {
    const result = generateAISchema.safeParse({ prompt: 'Яркая обложка MrBeast' });
    expect(result.success).toBe(true);
  });

  it('rejects empty prompt', () => {
    const result = generateAISchema.safeParse({ prompt: '' });
    expect(result.success).toBe(false);
  });

  it('rejects prompt longer than 2000 chars', () => {
    const result = generateAISchema.safeParse({ prompt: 'A'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('accepts all valid styles', () => {
    const styles = ['realistic', 'anime', 'cinematic', 'minimalist', '3d', 'popart'] as const;
    for (const style of styles) {
      const result = generateAISchema.safeParse({ prompt: 'test', style });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid style', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', style: 'watercolor' });
    expect(result.success).toBe(false);
  });

  it('defaults count to 4', () => {
    const result = generateAISchema.safeParse({ prompt: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(4);
    }
  });

  it('rejects count above 6', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', count: 10 });
    expect(result.success).toBe(false);
  });

  it('rejects count below 1', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', count: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer count', () => {
    const result = generateAISchema.safeParse({ prompt: 'test', count: 2.5 });
    expect(result.success).toBe(false);
  });

  it('defaults preserveText to true', () => {
    const result = generateAISchema.safeParse({ prompt: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preserveText).toBe(true);
    }
  });
});

describe('updateProfileSchema', () => {
  it('accepts valid name', () => {
    const result = updateProfileSchema.safeParse({ name: 'Иван Петров' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name when provided', () => {
    const result = updateProfileSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 60 chars', () => {
    const result = updateProfileSchema.safeParse({ name: 'И'.repeat(61) });
    expect(result.success).toBe(false);
  });

  it('accepts valid bio', () => {
    const result = updateProfileSchema.safeParse({ bio: 'YouTube-креатор из Москвы' });
    expect(result.success).toBe(true);
  });

  it('rejects bio longer than 500 chars', () => {
    const result = updateProfileSchema.safeParse({ bio: 'Б'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts valid YouTube channel URL', () => {
    const result = updateProfileSchema.safeParse({
      channelUrl: 'https://www.youtube.com/c/TestChannel',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-YouTube channel URL', () => {
    const result = updateProfileSchema.safeParse({
      channelUrl: 'https://vimeo.com/channel',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid avatar URL', () => {
    const result = updateProfileSchema.safeParse({
      avatarUrl: 'https://example.com/avatar.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid avatar URL', () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: 'not-url' });
    expect(result.success).toBe(false);
  });

  it('accepts empty object (all optional)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
