'use client';

import { useMemo, useState, useCallback } from 'react';
import { usePresenceStore, type PresenceUser } from '@/stores/usePresenceStore';
import { useThemeStore } from '@/stores/useThemeStore';

/* ═══════════════════════════════════════════════════════════════════
   OnlineUsers

   Shows avatars of users currently viewing the same project.
   - Max 5 visible avatars + "+N more" overflow
   - Pulsing green dot for active connection
   - Tooltip with name on hover
   - Colored ring matching user's collaboration color
   ═══════════════════════════════════════════════════════════════════ */

const MAX_VISIBLE = 5;
const AVATAR_SIZE = 28;
const DOT_SIZE = 8;

function UserAvatar({
  user,
  size = AVATAR_SIZE,
  showDot = true,
}: {
  user: PresenceUser;
  size?: number;
  showDot?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const C = useThemeStore((s) => s.theme);

  const initials = useMemo(() => {
    const parts = (user.name || 'A').split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }, [user.name]);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar circle with colored ring */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${user.color}`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: user.color + '22',
          flexShrink: 0,
          cursor: 'default',
        }}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            style={{
              fontSize: size * 0.38,
              fontWeight: 700,
              color: user.color,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Green active dot */}
      {showDot && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: '50%',
            background: '#22c55e',
            border: `2px solid ${C.surface}`,
            animation: 'presence-pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            padding: '4px 8px',
            borderRadius: 6,
            background: C.card,
            border: `1px solid ${C.border}`,
            color: C.text,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,.2)',
          }}
        >
          {user.name}
        </div>
      )}
    </div>
  );
}

export function OnlineUsers() {
  const C = useThemeStore((s) => s.theme);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const selfUser = usePresenceStore((s) => s.selfUser);
  const connected = usePresenceStore((s) => s.connected);

  // Combine self + others
  const allUsers = useMemo(() => {
    const users: PresenceUser[] = [];
    if (selfUser) users.push(selfUser);
    for (const u of onlineUsers) {
      if (u.id !== selfUser?.id) users.push(u);
    }
    return users;
  }, [selfUser, onlineUsers]);

  const [showOverflow, setShowOverflow] = useState(false);

  const visibleUsers = allUsers.slice(0, MAX_VISIBLE);
  const overflowCount = Math.max(0, allUsers.length - MAX_VISIBLE);
  const overflowUsers = allUsers.slice(MAX_VISIBLE);

  const handleOverflowEnter = useCallback(() => setShowOverflow(true), []);
  const handleOverflowLeave = useCallback(() => setShowOverflow(false), []);

  if (!connected && allUsers.length === 0) return null;

  return (
    <>
      {/* Inject pulse animation */}
      <style>{`
        @keyframes presence-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* User count */}
        <span
          style={{
            fontSize: 10,
            color: connected ? C.green : C.dim,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: connected ? '#22c55e' : C.dim,
              flexShrink: 0,
              animation: connected ? 'presence-pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          {allUsers.length}
        </span>

        {/* Avatar stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {visibleUsers.map((user, i) => (
            <div
              key={user.id}
              style={{
                marginLeft: i === 0 ? 0 : -8,
                zIndex: MAX_VISIBLE - i,
                position: 'relative',
              }}
            >
              <UserAvatar user={user} showDot={i === 0 && user.id === selfUser?.id} />
            </div>
          ))}

          {/* Overflow indicator */}
          {overflowCount > 0 && (
            <div
              style={{
                position: 'relative',
                marginLeft: -8,
                zIndex: 0,
              }}
              onMouseEnter={handleOverflowEnter}
              onMouseLeave={handleOverflowLeave}
            >
              <div
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: '50%',
                  border: `2px solid ${C.border}`,
                  background: C.card,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.sub,
                  }}
                >
                  +{overflowCount}
                </span>
              </div>

              {/* Overflow tooltip */}
              {showOverflow && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: 6,
                    padding: 8,
                    borderRadius: 10,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,.2)',
                    minWidth: 120,
                  }}
                >
                  {overflowUsers.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 0',
                      }}
                    >
                      <UserAvatar user={user} size={20} showDot={false} />
                      <span style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
