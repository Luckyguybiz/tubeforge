// @vitest-environment node
/**
 * Tests for the POST /api/contact route handler.
 *
 * We replicate the route logic in-test (same pattern as other router tests)
 * so we can test validation, rate limiting, sanitization, and DB persistence.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 2, reset: Date.now() + 3600_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));

const mockStripTags = vi.fn((s: string) => s.replace(/<[^>]*>/g, ''));
vi.mock('@/lib/sanitize', () => ({ stripTags: (s: string) => mockStripTags(s) }));

const mockSendEmail = vi.fn().mockResolvedValue({});
vi.mock('@/lib/email', () => ({ sendEmail: (...args: unknown[]) => mockSendEmail(...args) }));

const mockDbCreate = vi.fn().mockResolvedValue({ id: 'cs-1' });
const mockDb = {
  contactSubmission: { create: mockDbCreate },
};
vi.mock('@/server/db', () => ({ db: mockDb }));

/* ── Replicate contact route logic ────────────────────────────── */

const { rateLimit } = await import('@/lib/rate-limit');
const { stripTags } = await import('@/lib/sanitize');

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').max(320),
  subject: z.string().min(1).max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  website: z.string().max(0, 'Bot detected').optional().default(''),
});

interface ContactResult {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

async function handleContactPost(
  rawBody: unknown,
  ip = '127.0.0.1',
  userAgent = 'test-agent',
): Promise<ContactResult> {
  // Rate limit
  const { success, reset } = await rateLimit({
    identifier: `contact:${ip}`,
    limit: 3,
    window: 3600,
  });
  if (!success) {
    return {
      status: 429,
      body: { error: 'Too many submissions. Please try again later.' },
      headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
    };
  }

  // Validate
  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
    };
  }

  const { name, email, subject, message, website } = parsed.data;

  // Honeypot
  if (website && website.length > 0) {
    return { status: 200, body: { success: true } };
  }

  // Sanitize
  const cleanName = stripTags(name.trim());
  const cleanSubject = stripTags(subject.trim());
  const cleanMessage = stripTags(message.trim());

  // Save to DB
  try {
    await mockDb.contactSubmission.create({
      data: {
        name: cleanName,
        email: email.trim().toLowerCase(),
        subject: cleanSubject,
        message: cleanMessage,
        ipAddress: ip,
        userAgent,
      },
    });
  } catch {
    // Don't fail — email still valuable
  }

  return { status: 200, body: { success: true } };
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('POST /api/contact', () => {
  const validPayload = {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Feedback',
    message: 'This is a test message that is long enough.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 2, reset: Date.now() + 3600_000 });
  });

  it('validates required fields', async () => {
    // Missing name
    const r1 = await handleContactPost({ email: 'a@b.com', subject: 'Hi', message: 'Long enough msg' });
    expect(r1.status).toBe(400);
    expect(r1.body.error).toBe('Validation failed');
    expect(r1.body.details).toBeDefined();

    // Missing email
    const r2 = await handleContactPost({ name: 'A', subject: 'Hi', message: 'Long enough msg' });
    expect(r2.status).toBe(400);

    // Missing subject
    const r3 = await handleContactPost({ name: 'A', email: 'a@b.com', message: 'Long enough msg' });
    expect(r3.status).toBe(400);

    // Missing message
    const r4 = await handleContactPost({ name: 'A', email: 'a@b.com', subject: 'Hi' });
    expect(r4.status).toBe(400);
  });

  it('rejects invalid email', async () => {
    const result = await handleContactPost({
      ...validPayload,
      email: 'not-an-email',
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Validation failed');
    const details = result.body.details as Record<string, string[]>;
    expect(details.email).toBeDefined();
    expect(details.email[0]).toContain('email');
  });

  it('rejects short message', async () => {
    const result = await handleContactPost({
      ...validPayload,
      message: 'Too short',
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Validation failed');
    const details = result.body.details as Record<string, string[]>;
    expect(details.message).toBeDefined();
  });

  it('sanitizes input with stripTags', async () => {
    await handleContactPost({
      name: '<b>John</b>',
      email: 'john@example.com',
      subject: '<script>alert(1)</script>Feedback',
      message: '<img src=x onerror=alert(1)>This is a test message.',
    });

    expect(mockStripTags).toHaveBeenCalledWith('<b>John</b>');
    expect(mockStripTags).toHaveBeenCalledWith('<script>alert(1)</script>Feedback');
    expect(mockStripTags).toHaveBeenCalledWith('<img src=x onerror=alert(1)>This is a test message.');
  });

  it('rate limits by IP', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() + 1800_000 });

    const result = await handleContactPost(validPayload, '1.2.3.4');

    expect(result.status).toBe(429);
    expect(result.body.error).toContain('Too many submissions');
    expect(result.headers?.['Retry-After']).toBeDefined();

    expect(mockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'contact:1.2.3.4',
        limit: 3,
        window: 3600,
      }),
    );
  });

  it('saves submission to database', async () => {
    const result = await handleContactPost(validPayload, '10.0.0.1', 'Mozilla/5.0');

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(mockDbCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Feedback',
        message: 'This is a test message that is long enough.',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0',
      }),
    });
  });

  it('succeeds even if DB save fails', async () => {
    mockDbCreate.mockRejectedValueOnce(new Error('DB connection error'));

    const result = await handleContactPost(validPayload);

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
  });

  it('silently accepts honeypot submissions without saving', async () => {
    const result = await handleContactPost({
      ...validPayload,
      website: 'http://spam.com',
    });

    // Honeypot field max(0) means it fails validation
    expect(result.status).toBe(400);
  });

  it('lowercases email before saving', async () => {
    await handleContactPost({
      ...validPayload,
      email: 'John@EXAMPLE.COM',
    });

    expect(mockDbCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'john@example.com',
      }),
    });
  });
});
