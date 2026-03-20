'use client';

import { useMemo, useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';

/* ═══════════════════════════════════════════════════════════════════
   Project Collaborators

   Shows avatars of users who have access to the project (via team).
   Displayed in the editor header.
   ═══════════════════════════════════════════════════════════════════ */

const ROLE_COLORS: Record<string, string> = {
  OWNER: '#f59e0b',
  ADMIN: '#a855f7',
  EDITOR: '#3b82f6',
  VIEWER: '#6b7280',
};

interface CollaboratorAvatarProps {
  name: string;
  image: string | null;
  role: string;
  size?: number;
}

function CollaboratorAvatar({ name, image, role, size = 24 }: CollaboratorAvatarProps) {
  const C = useThemeStore((s) => s.theme);
  const [hovered, setHovered] = useState(false);
  const t = useLocaleStore((s) => s.t);

  const initials = useMemo(() => {
    const parts = (name || 'U').split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }, [name]);

  const borderColor = ROLE_COLORS[role] || C.border;

  const roleLabel = (() => {
    switch (role) {
      case 'OWNER': return t('team.role.owner');
      case 'ADMIN': return t('team.role.admin');
      case 'EDITOR': return t('team.role.editor');
      case 'VIEWER': return t('team.role.viewer');
      default: return role;
    }
  })();

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${borderColor}`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: image ? 'transparent' : `${borderColor}22`,
          flexShrink: 0,
          cursor: 'default',
        }}
      >
        {image ? (
          <img
            src={image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            style={{
              fontSize: size * 0.38,
              fontWeight: 700,
              color: borderColor,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {initials}
          </span>
        )}
      </div>

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
            fontSize: 10,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,.2)',
          }}
        >
          {name} &middot; <span style={{ color: borderColor }}>{roleLabel}</span>
        </div>
      )}
    </div>
  );
}

export function ProjectCollaborators({ projectId }: { projectId: string }) {
  const C = useThemeStore((s) => s.theme);

  const { data } = trpc.team.getProjectCollaborators.useQuery(
    { projectId },
    { staleTime: 30000 },
  );

  if (!data || (!data.owner && data.members.length === 0)) return null;

  const allCollaborators = [
    ...(data.owner ? [data.owner] : []),
    ...data.members,
  ];

  if (allCollaborators.length <= 1) return null; // Only owner, no team sharing

  const MAX_SHOW = 4;
  const visible = allCollaborators.slice(0, MAX_SHOW);
  const overflow = allCollaborators.length - MAX_SHOW;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {visible.map((user, i) => (
        <div key={user.id} style={{ marginLeft: i === 0 ? 0 : -6, zIndex: MAX_SHOW - i, position: 'relative' }}>
          <CollaboratorAvatar
            name={user.name || user.email || 'User'}
            image={user.image ?? null}
            role={user.role}
            size={22}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            marginLeft: -6,
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: `2px solid ${C.border}`,
            background: C.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            fontWeight: 700,
            color: C.sub,
            zIndex: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
