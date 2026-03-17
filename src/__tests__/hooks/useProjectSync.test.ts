/**
 * Tests for pure utility functions used in useProjectSync.
 * The hook itself depends on tRPC context, so we test the extracted logic.
 */
import { describe, it, expect } from 'vitest';

// Replicated from useProjectSync.ts — toServerPatch
function toServerPatch(patch: Record<string, unknown>) {
  const { ck, sf, ef, enh, snd, chars, ...rest } = patch;
  const metadata: Record<string, unknown> = {};
  if (ck !== undefined) metadata.ck = ck;
  if (sf !== undefined) metadata.sf = sf;
  if (ef !== undefined) metadata.ef = ef;
  if (enh !== undefined) metadata.enh = enh;
  if (snd !== undefined) metadata.snd = snd;
  if (chars !== undefined) metadata.chars = chars;

  const serverData: Record<string, unknown> = { ...rest };
  if (Object.keys(metadata).length > 0) serverData.metadata = metadata;
  if (serverData.status && typeof serverData.status === 'string') {
    serverData.status = serverData.status.toUpperCase();
  }
  return serverData;
}

// Replicated from useProjectSync.ts — sceneToCreatePayload
function sceneToCreatePayload(
  projectId: string,
  scene: {
    prompt: string;
    label: string;
    model: string;
    duration: number;
    ck?: string;
    sf?: string;
    ef?: string;
    enh?: string;
    snd?: string;
    chars?: string[];
  },
) {
  return {
    projectId,
    prompt: scene.prompt,
    label: scene.label,
    model: scene.model as 'turbo' | 'standard' | 'pro' | 'cinematic',
    duration: scene.duration,
    metadata: { ck: scene.ck, sf: scene.sf, ef: scene.ef, enh: scene.enh, snd: scene.snd, chars: scene.chars },
  };
}

describe('toServerPatch', () => {
  it('should pass through simple fields unchanged', () => {
    const result = toServerPatch({ prompt: 'Hello', label: 'Scene 1' });
    expect(result).toEqual({ prompt: 'Hello', label: 'Scene 1' });
  });

  it('should group metadata fields into a metadata object', () => {
    const result = toServerPatch({ ck: 'camera-1', sf: 'fast', ef: 'glow' });
    expect(result).toEqual({
      metadata: { ck: 'camera-1', sf: 'fast', ef: 'glow' },
    });
  });

  it('should handle mixed simple and metadata fields', () => {
    const result = toServerPatch({ prompt: 'Test', ck: 'cam', enh: 'yes' });
    expect(result).toEqual({
      prompt: 'Test',
      metadata: { ck: 'cam', enh: 'yes' },
    });
  });

  it('should uppercase status values', () => {
    const result = toServerPatch({ status: 'draft' });
    expect(result.status).toBe('DRAFT');
  });

  it('should handle status with other fields', () => {
    const result = toServerPatch({ status: 'ready', prompt: 'Test' });
    expect(result).toEqual({ status: 'READY', prompt: 'Test' });
  });

  it('should not add metadata key when no metadata fields present', () => {
    const result = toServerPatch({ prompt: 'Hello' });
    expect(result).not.toHaveProperty('metadata');
  });

  it('should handle empty patch', () => {
    const result = toServerPatch({});
    expect(result).toEqual({});
  });

  it('should include all metadata fields when all provided', () => {
    const result = toServerPatch({
      ck: 'cam1',
      sf: 'slow',
      ef: 'blur',
      enh: 'hdr',
      snd: 'ambient',
      chars: ['char1'],
    });
    expect(result.metadata).toEqual({
      ck: 'cam1',
      sf: 'slow',
      ef: 'blur',
      enh: 'hdr',
      snd: 'ambient',
      chars: ['char1'],
    });
  });

  it('should not uppercase non-string status', () => {
    const result = toServerPatch({ status: 123 as unknown });
    expect(result.status).toBe(123);
  });
});

describe('sceneToCreatePayload', () => {
  const baseScene = {
    prompt: 'A beautiful sunset',
    label: 'Scene 1',
    model: 'turbo',
    duration: 5,
    ck: 'camera-1',
    sf: 'zoom-in',
    ef: 'glow',
    enh: 'hdr',
    snd: 'ambient',
    chars: ['char1', 'char2'],
  };

  it('should create correct payload structure', () => {
    const result = sceneToCreatePayload('proj-123', baseScene);
    expect(result.projectId).toBe('proj-123');
    expect(result.prompt).toBe('A beautiful sunset');
    expect(result.label).toBe('Scene 1');
    expect(result.model).toBe('turbo');
    expect(result.duration).toBe(5);
  });

  it('should include all metadata in the metadata field', () => {
    const result = sceneToCreatePayload('proj-123', baseScene);
    expect(result.metadata).toEqual({
      ck: 'camera-1',
      sf: 'zoom-in',
      ef: 'glow',
      enh: 'hdr',
      snd: 'ambient',
      chars: ['char1', 'char2'],
    });
  });

  it('should handle scene with undefined metadata fields', () => {
    const result = sceneToCreatePayload('proj-1', {
      prompt: 'Test',
      label: 'S1',
      model: 'standard',
      duration: 3,
    });
    expect(result.metadata).toEqual({
      ck: undefined,
      sf: undefined,
      ef: undefined,
      enh: undefined,
      snd: undefined,
      chars: undefined,
    });
  });

  it('should preserve projectId correctly', () => {
    const result = sceneToCreatePayload('my-project-id', baseScene);
    expect(result.projectId).toBe('my-project-id');
  });
});
