/**
 * Shared pieces of the /api/v1/mobile routes: device-key auth, one error
 * shape ({ error: { code, message } }, same as the rest of /api/v1) and
 * body parsing.
 */
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { authenticateApiRequest, type ApiAuthContext } from '@/lib/api-auth';

export function fail(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** X-Forge-Key of a device (or any key of the user). */
export async function requireUser(req: Request): Promise<ApiAuthContext | NextResponse> {
  return authenticateApiRequest(req);
}

export async function readBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }> {
  let raw: unknown = {};
  const text = await req.text().catch(() => '');
  if (text.trim()) {
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false, response: fail(400, 'invalid_json', 'Body must be JSON') };
    }
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: fail(400, 'invalid_input', parsed.error.issues[0]?.message ?? 'Validation failed', {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      }),
    };
  }
  return { ok: true, data: parsed.data };
}

export function clientIp(req: Request): string {
  return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
