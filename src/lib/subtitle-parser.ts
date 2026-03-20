/**
 * SRT / VTT subtitle parser and serializer.
 *
 * Handles both SubRip (.srt) and WebVTT (.vtt) formats with auto-detection.
 */

export interface SubtitleEntry {
  id: number;
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
}

/* ── Timestamp helpers ─────────────────────────────────────────────────── */

/**
 * Parse a timestamp string (SRT: "HH:MM:SS,mmm" / VTT: "HH:MM:SS.mmm") to
 * seconds.  Also tolerates "MM:SS.mmm" (common in VTT short form).
 */
export function parseTimestamp(ts: string): number {
  const cleaned = ts.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseFloat(parts[2]) || 0;
    return h * 3600 + m * 60 + s;
  }

  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseFloat(parts[1]) || 0;
    return m * 60 + s;
  }

  return parseFloat(cleaned) || 0;
}

/**
 * Format seconds to a timestamp string.
 *  - `srt` → "HH:MM:SS,mmm"
 *  - `vtt` → "HH:MM:SS.mmm"
 */
export function formatTimestamp(seconds: number, format: 'srt' | 'vtt'): string {
  const totalMs = Math.round(Math.max(0, seconds) * 1000);
  const h = Math.floor(totalMs / 3_600_000);
  const m = Math.floor((totalMs % 3_600_000) / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;

  const sep = format === 'srt' ? ',' : '.';
  return (
    String(h).padStart(2, '0') +
    ':' +
    String(m).padStart(2, '0') +
    ':' +
    String(s).padStart(2, '0') +
    sep +
    String(ms).padStart(3, '0')
  );
}

/* ── Parsers ───────────────────────────────────────────────────────────── */

const TIMESTAMP_SEP = /\s*-->\s*/;

/** Parse SubRip (.srt) text into subtitle entries. */
export function parseSRT(content: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = [];
  // Normalize line endings and split into blocks separated by blank lines
  const blocks = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .split(/\n\n+/);

  let nextId = 1;
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // First line is the sequence number (skip it), second line is the timestamps
    let tsLineIdx = 0;
    if (TIMESTAMP_SEP.test(lines[0])) {
      tsLineIdx = 0;
    } else if (lines.length >= 2 && TIMESTAMP_SEP.test(lines[1])) {
      tsLineIdx = 1;
    } else {
      continue; // no valid timestamp line
    }

    const tsLine = lines[tsLineIdx];
    const [startStr, endStr] = tsLine.split(TIMESTAMP_SEP);
    if (!startStr || !endStr) continue;

    const startTime = parseTimestamp(startStr);
    const endTime = parseTimestamp(endStr);
    const text = lines
      .slice(tsLineIdx + 1)
      .join('\n')
      .trim();

    if (text.length === 0 && startTime === 0 && endTime === 0) continue;

    entries.push({ id: nextId++, startTime, endTime, text });
  }

  return entries;
}

/** Parse WebVTT (.vtt) text into subtitle entries. */
export function parseVTT(content: string): SubtitleEntry[] {
  // Strip the WEBVTT header and any metadata before the first blank line
  let body = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const headerEnd = body.indexOf('\n\n');
  if (headerEnd !== -1) {
    const firstLine = body.substring(0, body.indexOf('\n')).trim();
    if (firstLine.startsWith('WEBVTT')) {
      body = body.substring(headerEnd).trim();
    }
  }

  // NOTE and STYLE blocks
  const blocks = body.split(/\n\n+/);
  const entries: SubtitleEntry[] = [];
  let nextId = 1;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length === 0) continue;
    // Skip NOTE blocks
    if (lines[0].startsWith('NOTE')) continue;
    // Skip STYLE blocks
    if (lines[0].startsWith('STYLE')) continue;

    let tsLineIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 2); i++) {
      if (TIMESTAMP_SEP.test(lines[i])) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsLine = lines[tsLineIdx];
    // VTT timestamps may have position/alignment settings after the end timestamp
    const tsParts = tsLine.split(TIMESTAMP_SEP);
    if (tsParts.length < 2) continue;

    const startStr = tsParts[0].trim();
    // End timestamp may be followed by cue settings separated by spaces
    const endParts = tsParts[1].trim().split(/\s+/);
    const endStr = endParts[0];

    const startTime = parseTimestamp(startStr);
    const endTime = parseTimestamp(endStr);
    // Strip VTT tags like <b>, <i>, etc. for plain text editing
    const text = lines
      .slice(tsLineIdx + 1)
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (text.length === 0 && startTime === 0 && endTime === 0) continue;

    entries.push({ id: nextId++, startTime, endTime, text });
  }

  return entries;
}

/**
 * Auto-detect format (SRT or VTT) and parse.
 * Returns an empty array if parsing yields no entries.
 */
export function parseSubtitles(content: string): SubtitleEntry[] {
  const trimmed = content.trim();
  if (trimmed.startsWith('WEBVTT')) {
    return parseVTT(trimmed);
  }
  // Try SRT first (most common)
  const srtResult = parseSRT(trimmed);
  if (srtResult.length > 0) return srtResult;
  // Fallback: try VTT without header
  const vttResult = parseVTT(trimmed);
  if (vttResult.length > 0) return vttResult;
  return [];
}

/* ── Serializers ───────────────────────────────────────────────────────── */

/** Serialize entries to SubRip (.srt) format. */
export function toSRT(entries: SubtitleEntry[]): string {
  return entries
    .map(
      (e, i) =>
        `${i + 1}\n${formatTimestamp(e.startTime, 'srt')} --> ${formatTimestamp(e.endTime, 'srt')}\n${e.text}`,
    )
    .join('\n\n');
}

/** Serialize entries to WebVTT (.vtt) format. */
export function toVTT(entries: SubtitleEntry[]): string {
  const cues = entries
    .map(
      (e, i) =>
        `${i + 1}\n${formatTimestamp(e.startTime, 'vtt')} --> ${formatTimestamp(e.endTime, 'vtt')}\n${e.text}`,
    )
    .join('\n\n');
  return `WEBVTT\n\n${cues}`;
}
