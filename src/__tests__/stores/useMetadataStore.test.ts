import { describe, it, expect, beforeEach } from 'vitest';
import { useMetadataStore } from '@/stores/useMetadataStore';

describe('useMetadataStore', () => {
  beforeEach(() => {
    useMetadataStore.getState().reset();
  });

  it('should start empty', () => {
    const state = useMetadataStore.getState();
    expect(state.title).toBe('');
    expect(state.desc).toBe('');
    expect(state.tags).toEqual([]);
  });

  it('should load from project', () => {
    useMetadataStore.getState().loadFromProject({
      id: 'proj-1',
      title: 'Test Title',
      description: 'Test desc',
      tags: ['tag1', 'tag2'],
    });
    const state = useMetadataStore.getState();
    expect(state.projectId).toBe('proj-1');
    expect(state.title).toBe('Test Title');
    expect(state.desc).toBe('Test desc');
    expect(state.tags).toEqual(['tag1', 'tag2']);
  });

  it('should add and remove tags', () => {
    useMetadataStore.getState().addTag('new-tag');
    expect(useMetadataStore.getState().tags).toContain('new-tag');

    useMetadataStore.getState().removeTag('new-tag');
    expect(useMetadataStore.getState().tags).not.toContain('new-tag');
  });

  it('should not add duplicate tags', () => {
    useMetadataStore.getState().addTag('dup');
    useMetadataStore.getState().addTag('dup');
    expect(useMetadataStore.getState().tags.filter((t) => t === 'dup')).toHaveLength(1);
  });
});
