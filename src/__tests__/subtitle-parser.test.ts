import { describe, it, expect } from 'vitest';
import {
  parseSRT,
  parseVTT,
  parseSubtitles,
  toSRT,
  toVTT,
  formatTimestamp,
  parseTimestamp,
} from '@/lib/subtitle-parser';

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:04,000
Hello, world!

2
00:00:05,500 --> 00:00:08,200
This is a subtitle test.

3
00:01:00,000 --> 00:01:03,500
Third entry with longer timestamp.`;

const SAMPLE_VTT = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Hello, world!

2
00:00:05.500 --> 00:00:08.200
This is a subtitle test.

3
00:01:00.000 --> 00:01:03.500
Third entry with longer timestamp.`;

describe('subtitle-parser', () => {
  describe('parseSRT', () => {
    it('parses valid SRT content into subtitle entries', () => {
      const entries = parseSRT(SAMPLE_SRT);

      expect(entries).toHaveLength(3);

      expect(entries[0]).toEqual({
        id: 1,
        startTime: 1,
        endTime: 4,
        text: 'Hello, world!',
      });

      expect(entries[1]).toEqual({
        id: 2,
        startTime: 5.5,
        endTime: 8.2,
        text: 'This is a subtitle test.',
      });

      expect(entries[2]).toEqual({
        id: 3,
        startTime: 60,
        endTime: 63.5,
        text: 'Third entry with longer timestamp.',
      });
    });
  });

  describe('parseVTT', () => {
    it('parses valid VTT content including WEBVTT header', () => {
      const entries = parseVTT(SAMPLE_VTT);

      expect(entries).toHaveLength(3);

      expect(entries[0]).toEqual({
        id: 1,
        startTime: 1,
        endTime: 4,
        text: 'Hello, world!',
      });

      expect(entries[1]).toEqual({
        id: 2,
        startTime: 5.5,
        endTime: 8.2,
        text: 'This is a subtitle test.',
      });

      expect(entries[2]).toEqual({
        id: 3,
        startTime: 60,
        endTime: 63.5,
        text: 'Third entry with longer timestamp.',
      });
    });
  });

  describe('parseSubtitles', () => {
    it('auto-detects SRT format when no WEBVTT header is present', () => {
      const entries = parseSubtitles(SAMPLE_SRT);
      expect(entries).toHaveLength(3);
      expect(entries[0].text).toBe('Hello, world!');
    });

    it('auto-detects VTT format when WEBVTT header is present', () => {
      const entries = parseSubtitles(SAMPLE_VTT);
      expect(entries).toHaveLength(3);
      expect(entries[0].text).toBe('Hello, world!');
    });

    it('returns an empty array for unparseable content', () => {
      const entries = parseSubtitles('this is not a subtitle file');
      expect(entries).toEqual([]);
    });
  });

  describe('toSRT roundtrip', () => {
    it('produces entries equal to the original after parse -> serialize -> parse', () => {
      const original = parseSRT(SAMPLE_SRT);
      const serialized = toSRT(original);
      const reparsed = parseSRT(serialized);

      expect(reparsed).toHaveLength(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(reparsed[i].startTime).toBeCloseTo(original[i].startTime, 2);
        expect(reparsed[i].endTime).toBeCloseTo(original[i].endTime, 2);
        expect(reparsed[i].text).toBe(original[i].text);
      }
    });
  });

  describe('formatTimestamp', () => {
    it('uses comma separator for SRT format', () => {
      const result = formatTimestamp(3661.5, 'srt');
      expect(result).toBe('01:01:01,500');
    });

    it('uses dot separator for VTT format', () => {
      const result = formatTimestamp(3661.5, 'vtt');
      expect(result).toBe('01:01:01.500');
    });

    it('handles zero correctly', () => {
      expect(formatTimestamp(0, 'srt')).toBe('00:00:00,000');
      expect(formatTimestamp(0, 'vtt')).toBe('00:00:00.000');
    });

    it('clamps negative values to zero', () => {
      expect(formatTimestamp(-5, 'srt')).toBe('00:00:00,000');
    });
  });

  describe('parseTimestamp', () => {
    it('parses SRT timestamps with comma separator', () => {
      expect(parseTimestamp('00:00:00,000')).toBe(0);
      expect(parseTimestamp('00:01:30,500')).toBeCloseTo(90.5, 2);
      expect(parseTimestamp('01:00:00,000')).toBe(3600);
    });

    it('parses VTT timestamps with dot separator', () => {
      expect(parseTimestamp('00:00:00.000')).toBe(0);
      expect(parseTimestamp('00:01:30.500')).toBeCloseTo(90.5, 2);
    });

    it('parses VTT short form (MM:SS.mmm)', () => {
      expect(parseTimestamp('01:30.500')).toBeCloseTo(90.5, 2);
    });
  });

  describe('toVTT', () => {
    it('includes WEBVTT header in the output', () => {
      const entries = parseSRT(SAMPLE_SRT);
      const vtt = toVTT(entries);
      expect(vtt).toMatch(/^WEBVTT\n\n/);
    });
  });
});
