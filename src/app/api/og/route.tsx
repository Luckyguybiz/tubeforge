import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? 'TubeForge';
  const subtitle =
    searchParams.get('subtitle') ?? 'AI Studio for YouTube Creators';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #312e81 0%, #6d28d9 50%, #7c3aed 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-120px',
            left: '-60px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '180px',
            left: '100px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
          }}
        />

        {/* Logo / Icon area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '88px',
            height: '88px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.15)',
            marginBottom: '32px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Play-triangle icon */}
          <svg
            width="40"
            height="46"
            viewBox="0 0 40 46"
            fill="none"
          >
            <path
              d="M38 20.402c2.667 1.54 2.667 5.39 0 6.928L6 47.033c-2.667 1.54-6-.385-6-3.464V3.164C0 .084 3.333-1.84 6 -.3L38 20.402z"
              fill="white"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-2px',
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '2px',
                background: 'rgba(255, 255, 255, 0.4)',
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: '28px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.85)',
                letterSpacing: '0.5px',
                display: 'flex',
              }}
            >
              {subtitle}
            </div>
            <div
              style={{
                width: '40px',
                height: '2px',
                background: 'rgba(255, 255, 255, 0.4)',
                display: 'flex',
              }}
            />
          </div>
        </div>

        {/* Bottom domain tag */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34d399',
              display: 'flex',
            }}
          />
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
            }}
          >
            tubeforge.co
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
