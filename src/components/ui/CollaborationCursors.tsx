'use client';

import { useMemo } from 'react';
import { usePresenceStore, type RemoteCursor } from '@/stores/usePresenceStore';

/* ═══════════════════════════════════════════════════════════════════
   CollaborationCursors

   Renders remote collaborator cursors on a canvas overlay.
   Each cursor shows a colored arrow + the user's name.
   Positions are smoothly interpolated in the presence store.
   ═══════════════════════════════════════════════════════════════════ */

function CursorArrow({ cursor }: { cursor: RemoteCursor }) {
  const { user, x, y } = cursor;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 999,
        transition: 'opacity 0.2s',
      }}
    >
      {/* SVG cursor arrow */}
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.3))' }}
      >
        <path
          d="M0.5 0.5L15 10L8 11L5 19.5L0.5 0.5Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name label */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 12,
          padding: '2px 6px',
          borderRadius: 4,
          background: user.color,
          color: '#fff',
          fontSize: 10,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          lineHeight: '14px',
          boxShadow: '0 1px 4px rgba(0,0,0,.2)',
          userSelect: 'none',
        }}
      >
        {user.name}
      </div>
    </div>
  );
}

export function CollaborationCursors({
  canvasW,
  canvasH,
  containerW,
  containerH,
}: {
  /** Canvas logical width */
  canvasW: number;
  /** Canvas logical height */
  canvasH: number;
  /** Container (viewport) width in px */
  containerW: number;
  /** Container (viewport) height in px */
  containerH: number;
}) {
  const remoteCursors = usePresenceStore((s) => s.remoteCursors);

  const cursors = useMemo(() => {
    const result: RemoteCursor[] = [];
    for (const cursor of remoteCursors.values()) {
      result.push(cursor);
    }
    return result;
  }, [remoteCursors]);

  if (cursors.length === 0) return null;

  // Scale factor from canvas coords to container coords
  const scaleX = containerW / canvasW;
  const scaleY = containerH / canvasH;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {cursors.map((cursor) => (
        <CursorArrow
          key={cursor.userId}
          cursor={{
            ...cursor,
            x: cursor.x * scaleX,
            y: cursor.y * scaleY,
          }}
        />
      ))}
    </div>
  );
}
