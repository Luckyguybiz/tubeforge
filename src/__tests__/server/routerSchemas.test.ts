/**
 * Tests for Zod input schemas used in tRPC routers.
 *
 * Since the schemas are defined inline inside the routers, we recreate them
 * here to validate edge-cases like boundary lengths and invalid enums.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/* ── Scene schemas ──────────────────────────────────────────────── */

const sceneMetadataSchema = z.object({
  ck: z.string().optional(),
  sf: z.string().nullish(),
  ef: z.string().nullish(),
  enh: z.boolean().optional(),
  snd: z.boolean().optional(),
  chars: z.array(z.string()).optional(),
});

const sceneCreateInput = z.object({
  projectId: z.string(),
  prompt: z.string().max(2000).default(''),
  label: z.string().max(100).default(''),
  model: z.enum(['turbo', 'standard', 'pro', 'cinematic']).default('standard'),
  duration: z.number().min(1).max(60).default(5),
  order: z.number().optional(),
  metadata: sceneMetadataSchema.optional(),
});

const sceneReorderInput = z.object({
  projectId: z.string(),
  sceneIds: z.array(z.string()).max(200),
});

/* ── Project character schema ───────────────────────────────────── */

const characterSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  role: z.string().max(100),
  avatar: z.string().max(10),
  ck: z.string().max(20),
  desc: z.string().max(500),
});

const projectUpdateInput = z.object({
  id: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).max(30).optional(),
  status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).optional(),
  characters: z.array(characterSchema).max(50).optional(),
  thumbnailData: z.record(z.string(), z.unknown()).optional(),
  thumbnailUrl: z.string().nullish(),
});

/* ── YouTube upload schema ──────────────────────────────────────── */

const uploadVideoInput = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  privacyStatus: z.enum(['public', 'private', 'unlisted']).default('private'),
});

/* ── Team schemas ───────────────────────────────────────────────── */

const teamInviteInput = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('EDITOR'),
});

/* ── Tests ──────────────────────────────────────────────────────── */

describe('sceneCreateInput', () => {
  it('accepts valid input with defaults', () => {
    const result = sceneCreateInput.safeParse({ projectId: 'abc123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('standard');
      expect(result.data.duration).toBe(5);
      expect(result.data.prompt).toBe('');
    }
  });

  it('rejects prompt longer than 2000 chars', () => {
    const result = sceneCreateInput.safeParse({
      projectId: 'abc',
      prompt: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid model values', () => {
    for (const model of ['turbo', 'standard', 'pro', 'cinematic']) {
      const result = sceneCreateInput.safeParse({ projectId: 'abc', model });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid model', () => {
    const result = sceneCreateInput.safeParse({ projectId: 'abc', model: 'ultra' });
    expect(result.success).toBe(false);
  });

  it('rejects duration below 1', () => {
    const result = sceneCreateInput.safeParse({ projectId: 'abc', duration: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects duration above 60', () => {
    const result = sceneCreateInput.safeParse({ projectId: 'abc', duration: 61 });
    expect(result.success).toBe(false);
  });

  it('accepts valid metadata', () => {
    const result = sceneCreateInput.safeParse({
      projectId: 'abc',
      metadata: { ck: 'happy', enh: true, chars: ['char1', 'char2'] },
    });
    expect(result.success).toBe(true);
  });

  it('rejects metadata with wrong field types', () => {
    const result = sceneMetadataSchema.safeParse({
      enh: 'not-a-boolean',
    });
    expect(result.success).toBe(false);
  });
});

describe('sceneReorderInput', () => {
  it('accepts valid reorder', () => {
    const result = sceneReorderInput.safeParse({
      projectId: 'proj1',
      sceneIds: ['s1', 's2', 's3'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 200 scene IDs', () => {
    const result = sceneReorderInput.safeParse({
      projectId: 'proj1',
      sceneIds: Array.from({ length: 201 }, (_, i) => `s${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty sceneIds array', () => {
    const result = sceneReorderInput.safeParse({
      projectId: 'proj1',
      sceneIds: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('projectUpdateInput', () => {
  it('accepts minimal update (id only)', () => {
    const result = projectUpdateInput.safeParse({ id: 'proj1' });
    expect(result.success).toBe(true);
  });

  it('rejects title shorter than 1 char', () => {
    const result = projectUpdateInput.safeParse({ id: 'proj1', title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects description over 5000 chars', () => {
    const result = projectUpdateInput.safeParse({
      id: 'proj1',
      description: 'D'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid characters array', () => {
    const result = projectUpdateInput.safeParse({
      id: 'proj1',
      characters: [
        { id: 'c1', name: 'Алиса', role: 'Герой', avatar: '🦸', ck: 'happy', desc: 'Главный герой' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 50 characters', () => {
    const chars = Array.from({ length: 51 }, (_, i) => ({
      id: `c${i}`,
      name: `N${i}`,
      role: 'R',
      avatar: '🤡',
      ck: 'k',
      desc: 'd',
    }));
    const result = projectUpdateInput.safeParse({ id: 'proj1', characters: chars });
    expect(result.success).toBe(false);
  });

  it('rejects character with name over 100 chars', () => {
    const result = projectUpdateInput.safeParse({
      id: 'proj1',
      characters: [
        { id: 'c1', name: 'N'.repeat(101), role: 'R', avatar: '🤡', ck: 'k', desc: 'd' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid thumbnailData record', () => {
    const result = projectUpdateInput.safeParse({
      id: 'proj1',
      thumbnailData: { width: 1280, height: 720, bg: '#000' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid status enums', () => {
    for (const status of ['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']) {
      const result = projectUpdateInput.safeParse({ id: 'proj1', status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status enum', () => {
    const result = projectUpdateInput.safeParse({ id: 'proj1', status: 'DELETED' });
    expect(result.success).toBe(false);
  });
});

describe('uploadVideoInput', () => {
  it('accepts valid upload input', () => {
    const result = uploadVideoInput.safeParse({
      title: 'My Video',
      videoUrl: 'https://example.com/video.mp4',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.privacyStatus).toBe('private');
    }
  });

  it('rejects empty title', () => {
    const result = uploadVideoInput.safeParse({
      title: '',
      videoUrl: 'https://example.com/video.mp4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title over 100 chars', () => {
    const result = uploadVideoInput.safeParse({
      title: 'T'.repeat(101),
      videoUrl: 'https://example.com/video.mp4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid videoUrl', () => {
    const result = uploadVideoInput.safeParse({
      title: 'Test',
      videoUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects tag over 50 chars', () => {
    const result = uploadVideoInput.safeParse({
      title: 'Test',
      videoUrl: 'https://example.com/video.mp4',
      tags: ['X'.repeat(51)],
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 30 tags', () => {
    const result = uploadVideoInput.safeParse({
      title: 'Test',
      videoUrl: 'https://example.com/video.mp4',
      tags: Array.from({ length: 31 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid privacy statuses', () => {
    for (const ps of ['public', 'private', 'unlisted']) {
      const result = uploadVideoInput.safeParse({
        title: 'Test',
        videoUrl: 'https://example.com/video.mp4',
        privacyStatus: ps,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('teamInviteInput', () => {
  it('accepts valid email with default role', () => {
    const result = teamInviteInput.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('EDITOR');
    }
  });

  it('rejects invalid email', () => {
    const result = teamInviteInput.safeParse({ email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid roles', () => {
    for (const role of ['ADMIN', 'EDITOR', 'VIEWER']) {
      const result = teamInviteInput.safeParse({ email: 'a@b.com', role });
      expect(result.success).toBe(true);
    }
  });

  it('rejects OWNER role', () => {
    const result = teamInviteInput.safeParse({ email: 'a@b.com', role: 'OWNER' });
    expect(result.success).toBe(false);
  });
});
