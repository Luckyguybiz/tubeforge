import { auth } from '@/server/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, voice, model } = await req.json();

    if (!text || typeof text !== 'string' || text.length > 5000) {
      return NextResponse.json({ error: 'Invalid text input' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TTS service not configured' }, { status: 503 });
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'tts-1',
        input: text,
        voice: voice || 'alloy',
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
