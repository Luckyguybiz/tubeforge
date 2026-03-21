import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

  // Plan check: FREE users limited to 3 TTS requests per day
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.plan === 'FREE') {
    const dailyRl = await rateLimit({
      identifier: `tts-daily:${session.user.id}`,
      limit: 3,
      window: 86400,
    });
    if (!dailyRl.success) {
      return NextResponse.json(
        {
          error:
            'Free plan limit reached (3 per day). Upgrade to PRO or STUDIO for unlimited TTS.',
        },
        { status: 429 },
      );
    }
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
