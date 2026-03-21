import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotificationStore, toast } from '@/stores/useNotificationStore';

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  it('should add a toast', () => {
    useNotificationStore.getState().addToast('success', 'Test message');
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    expect(useNotificationStore.getState().toasts[0].type).toBe('success');
    expect(useNotificationStore.getState().toasts[0].message).toBe('Test message');
  });

  it('should remove a toast by id', () => {
    useNotificationStore.getState().addToast('info', 'Remove me');
    const id = useNotificationStore.getState().toasts[0].id;
    useNotificationStore.getState().removeToast(id);
    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });

  it('should auto-dismiss after duration', () => {
    useNotificationStore.getState().addToast('error', 'Auto dismiss', 2000);
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });

  it('should support toast helper functions', () => {
    toast.success('OK');
    toast.error('Fail');
    toast.info('Info');
    toast.warning('Warn');
    expect(useNotificationStore.getState().toasts).toHaveLength(4);
    const types = useNotificationStore.getState().toasts.map((t) => t.type);
    expect(types).toEqual(['success', 'error', 'info', 'warning']);
  });

  it('should use 5s duration for success toasts', () => {
    toast.success('Done');
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(4999);
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });

  it('should use 5s duration for info toasts', () => {
    toast.info('FYI');
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(4999);
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });

  it('should use 8s duration for error toasts', () => {
    toast.error('Oops');
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(7999);
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });

  it('should use 8s duration for warning toasts', () => {
    toast.warning('Careful');
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(7999);
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });
});
