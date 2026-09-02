// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ env: { AUTH_GOOGLE_ID: 'cid', AUTH_GOOGLE_SECRET: 'csecret', YOUTUBE_API_KEY: '' } }));
vi.mock('@/server/db', () => ({ db: {} }));

import { extractVideoId, isoDurationToSeconds } from '@/lib/youtube/api';
import { extractBearerKey } from '@/lib/api-auth';
import { hasScope, YOUTUBE_MANAGE_SCOPE, YOUTUBE_READONLY_SCOPE, YOUTUBE_UPLOAD_SCOPE, YT_ANALYTICS_READONLY_SCOPE, YOUTUBE_FULL_SCOPE } from '@/lib/youtube/token';

describe('extractVideoId', () => {
  it.each([
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ?feature=share', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('%s → %s', (input, expected) => {
    expect(extractVideoId(input)).toBe(expected);
  });

  it('rejects non-video input', () => {
    expect(extractVideoId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(extractVideoId('not a video')).toBeNull();
    expect(extractVideoId('https://www.youtube.com/channel/UCaaaaaaaaaaaaaaaaaaaaaa')).toBeNull();
  });
});

describe('isoDurationToSeconds', () => {
  it.each([
    ['PT59S', 59],
    ['PT1M5S', 65],
    ['PT1H2M3S', 3723],
    ['P1DT1S', 86401],
    ['PT3M', 180],
  ])('%s → %d', (iso, secs) => {
    expect(isoDurationToSeconds(iso)).toBe(secs);
  });
  it('returns null for garbage', () => {
    expect(isoDurationToSeconds('nope')).toBeNull();
    expect(isoDurationToSeconds(undefined)).toBeNull();
  });
});

describe('extractBearerKey', () => {
  it('accepts only tf_ keys', () => {
    expect(extractBearerKey('Bearer tf_abc123')).toBe('tf_abc123');
    expect(extractBearerKey('bearer tf_abc123 ')).toBe('tf_abc123');
    expect(extractBearerKey('Bearer sk_live_123')).toBeNull();
    expect(extractBearerKey('Basic dXNlcjpwYXNz')).toBeNull();
    expect(extractBearerKey(null)).toBeNull();
  });
});

describe('hasScope', () => {
  it('honours implied scopes', () => {
    expect(hasScope([YOUTUBE_MANAGE_SCOPE], YOUTUBE_READONLY_SCOPE)).toBe(true);
    expect(hasScope([YOUTUBE_MANAGE_SCOPE], YOUTUBE_UPLOAD_SCOPE)).toBe(true);
    expect(hasScope([YOUTUBE_FULL_SCOPE], YOUTUBE_MANAGE_SCOPE)).toBe(true);
    expect(hasScope([YOUTUBE_FULL_SCOPE], YT_ANALYTICS_READONLY_SCOPE)).toBe(false);
    expect(hasScope([YOUTUBE_READONLY_SCOPE, YOUTUBE_UPLOAD_SCOPE], YOUTUBE_MANAGE_SCOPE)).toBe(false);
  });
});
