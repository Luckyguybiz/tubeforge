import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPlanLimits } from '@/lib/constants';

const ttsSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z
    .enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
    .default('alloy'),
  model: z.enum(['tts-1', 'tts-1-hd']).default('tts-1'),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 10 requests per minute per user
  const rl = await rateLimit({
    identifier: `tts:${session.user.id}`,
    limit: 10,
    window: 60,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rl.reset),
        },
      },
    );
  }

  // Plan check: enforce monthly TTS limits per plan
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const limits = getPlanLimits(user.plan ?? 'FREE');

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const ttsCount = await db.auditLog.count({
    where: {
      userId: session.user.id,
      action: 'TOOL_USAGE',
      target: 'tts',
      createdAt: { gte: monthStart },
    },
  });

  if (ttsCount >= limits.ttsGenerations) {
    return NextResponse.json(
      {
        error: 'TTS limit reached for this month. Upgrade your plan for more.',
        code: 'LIMIT_REACHED',
        limit: limits.ttsGenerations,
        used: ttsCount,
      },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const parsed = ttsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { text, voice, model } = parsed.data;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 503 },
      );
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => 'Unknown error');
      console.error('OpenAI TTS error:', response.status, err);
      return NextResponse.json(
        { error: 'TTS generation failed' },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const audioBuffer = await response.arrayBuffer();

    // Log TTS usage for plan limit tracking
    try {
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'TOOL_USAGE',
          target: 'tts',
          metadata: {
            tool: 'tts',
            voice,
            model,
            textLength: text.length,
          },
        },
      });
    } catch {
      // Non-blocking: don't fail the request if audit log fails
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="voiceover.mp3"',
      },
    });
  } catch (err) {
    console.error('TTS route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
