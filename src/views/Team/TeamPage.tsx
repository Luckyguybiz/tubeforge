'use client';

import { useState, useMemo, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { pluralRu } from '@/lib/utils';

/* ---- Role helpers ----------------------------------------- */

function getTeamRoleLabels(t: (key: string) => string): Record<string, string> {
  return {
    OWNER: t('team.role.owner'),
    ADMIN: t('team.role.admin'),
    EDITOR: t('team.role.editor'),
    VIEWER: t('team.role.viewer'),
  };
}

function getRoleDescriptions(t: (key: string) => string): Record<string, string> {
  return {
    OWNER: t('team.roleDesc.owner'),
    ADMIN: t('team.roleDesc.admin'),
    EDITOR: t('team.roleDesc.editor'),
    VIEWER: t('team.roleDesc.viewer'),
  };
}

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  STUDIO: 'Studio',
};

/* ---- Tooltip component ------------------------------------- */

function RoleTooltip({
  label,
  description,
  color,
  icon,
  C,
}: {
  label: string;
  description: string;
  color: string;
  icon: string;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 600,
          color,
          padding: '4px 10px',
          borderRadius: 8,
          background: `${color}12`,
          border: `1px solid ${color}20`,
          whiteSpace: 'nowrap',
          cursor: 'help',
        }}
      >
        <span style={{ fontSize: 10, lineHeight: 1 }}>{icon}</span>
        {label}
      </span>
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            padding: '8px 12px',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: `0 4px 16px ${C.overlay}`,
            fontSize: 12,
            color: C.sub,
            lineHeight: 1.4,
            whiteSpace: 'normal',
            width: 220,
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: C.text, display: 'block', marginBottom: 2 }}>
            {icon} {label}
          </strong>
          {description}
        </div>
      )}
    </div>
  );
}

/* ---- Component --------------------------------------------- */

export function TeamPage() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const ROLE_LABELS = useMemo(() => getTeamRoleLabels(t), [t]);
  const ROLE_DESCS = useMemo(() => getRoleDescriptions(t), [t]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [teamName, setTeamName] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmCancelInviteId, setConfirmCancelInviteId] = useState<string | null>(null);
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  const profile = trpc.user.getProfile.useQuery();
  const team = trpc.team.getTeam.useQuery(undefined, {
    enabled: profile.data?.plan === 'STUDIO',
  });
  const pendingInvites = trpc.team.getPendingInvites.useQuery(undefined, {
    enabled: !!team.data,
  });
  const activityLog = trpc.team.getActivityLog.useQuery(undefined, {
    enabled: !!team.data,
  });

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      toast.success(t('team.teamCreated'));
      setTeamName('');
      team.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const invite = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success(t('team.inviteSent'));
      setInviteEmail('');
      setShowInviteForm(false);
      team.refetch();
      pendingInvites.refetch();
      activityLog.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success(t('team.memberRemoved'));
      setConfirmRemoveId(null);
      team.refetch();
      activityLog.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRole = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      toast.success(t('team.roleUpdated'));
      team.refetch();
      activityLog.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelInvite = trpc.team.cancelInvite.useMutation({
    onSuccess: () => {
      toast.success(t('team.inviteCancelled'));
      setConfirmCancelInviteId(null);
      pendingInvites.refetch();
      activityLog.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  /* Role-based colors */
  const roleColor = useCallback(
    (role: string) => {
      const map: Record<string, string> = {
        OWNER: C.orange,
        ADMIN: C.purple,
        EDITOR: C.blue,
        VIEWER: C.dim,
      };
      return map[role] || C.sub;
    },
    [C],
  );

  /* Role badge icon */
  const roleIcon = useCallback((role: string) => {
    const map: Record<string, string> = {
      OWNER: '\u2605',
      ADMIN: '\u2666',
      EDITOR: '\u270E',
      VIEWER: '\u25CE',
    };
    return map[role] || '';
  }, []);

  /* Check if current user is owner */
  const isOwner = team.data?.ownerId === profile.data?.id;
  const isAdmin = team.data?.members?.some(
    (m) => m.user.id === profile.data?.id && (m.role === 'OWNER' || m.role === 'ADMIN'),
  );

  /* Locale helper */
  const formatDate = useCallback(
    (date: string | Date) => {
      const loc =
        locale === 'ru' ? 'ru-RU' : locale === 'kk' ? 'kk-KZ' : locale === 'es' ? 'es-ES' : 'en-US';
      return new Date(date).toLocaleDateString(loc, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    },
    [locale],
  );

  const formatDateTime = useCallback(
    (date: string | Date) => {
      const loc =
        locale === 'ru' ? 'ru-RU' : locale === 'kk' ? 'kk-KZ' : locale === 'es' ? 'es-ES' : 'en-US';
      return new Date(date).toLocaleDateString(loc, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    [locale],
  );

  /* Shared styles */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '10px 24px',
    minHeight: 44,
    borderRadius: 10,
    border: 'none',
    background: C.accent,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: `0 2px 12px ${C.accent}22`,
    transition: 'transform 0.1s, box-shadow 0.15s',
    whiteSpace: 'nowrap',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 20px',
    minHeight: 44,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, background 0.15s',
    whiteSpace: 'nowrap',
  };

  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: C.sub,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 12,
  };

  /* ---- Loading state ---------------------------------------- */

  if (profile.isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton width={200} height={28} />
        <Skeleton width={300} height={14} />
        <div style={{ marginTop: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={64} rounded style={{ marginBottom: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Plan restriction ------------------------------------- */

  if (profile.data?.plan !== 'STUDIO') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 480,
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: `linear-gradient(135deg, ${C.purple}15, ${C.blue}15)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.purple}22, ${C.blue}22)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            {'\uD83D\uDC65'}
          </div>
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          {t('team.title')}
        </h2>
        <p
          style={{
            color: C.sub,
            fontSize: 15,
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: 360,
            marginBottom: 8,
          }}
        >
          {t('team.studioRequired')}
        </p>
        <p
          style={{
            color: C.dim,
            fontSize: 13,
            marginBottom: 28,
            textAlign: 'center',
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          {t('team.studioDesc')}
        </p>

        <a
          href="/settings"
          style={{
            padding: '12px 32px',
            borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: `0 4px 20px ${C.accent}33`,
            transition: 'transform 0.1s, box-shadow 0.15s',
          }}
        >
          {t('team.upgradeToStudio')}
        </a>
      </div>
    );
  }

  /* ---- Empty state: create team ----------------------------- */

  if (!team.data) {
    return (
      <div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 6,
            letterSpacing: '-0.02em',
          }}
        >
          {t('team.teamLabel')}
        </h1>
        <p
          style={{
            color: C.sub,
            fontSize: 14,
            marginBottom: 32,
            lineHeight: 1.5,
          }}
        >
          {t('team.createTeamDesc')}
        </p>

        <div
          style={{
            ...cardStyle,
            padding: '28px 24px',
            maxWidth: 440,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: `linear-gradient(135deg, ${C.blue}15, ${C.purple}15)`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                marginBottom: 12,
              }}
            >
              {'\uD83C\uDFAC'}
            </div>
            <p
              style={{
                color: C.sub,
                fontSize: 13,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {t('team.createTeamLong')}
            </p>
          </div>

          <label
            htmlFor="team-name"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.sub,
              display: 'block',
              marginBottom: 6,
            }}
          >
            {t('team.teamNameLabel')}
          </label>
          <input
            id="team-name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={t('team.teamNamePlaceholder')}
            maxLength={100}
            aria-label={t('team.teamNameLabel')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && teamName.trim()) {
                createTeam.mutate({ name: teamName.trim() });
              }
            }}
            style={{
              ...inputStyle,
              marginBottom: 16,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.borderActive)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />
          <button
            onClick={() => teamName.trim() && createTeam.mutate({ name: teamName.trim() })}
            disabled={!teamName.trim() || createTeam.isPending}
            style={{
              ...btnPrimary,
              width: '100%',
              padding: '12px 24px',
              fontSize: 14,
              opacity: !teamName.trim() ? 0.5 : 1,
            }}
          >
            {createTeam.isPending ? t('team.creating') : t('team.createTeam')}
          </button>
        </div>
      </div>
    );
  }

  /* ---- Team exists: full view ------------------------------- */

  const memberCount = team.data.members.length;
  const projectCount = team.data._count.projects;
  const pendingCount = pendingInvites.data?.length ?? 0;

  return (
    <div>
      {/* -- Header -------------------------------------------- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            {team.data.name}
          </h1>
          <p
            style={{
              color: C.sub,
              fontSize: 13,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {pluralRu(memberCount, t('team.member.one'), t('team.member.few'), t('team.member.many'))}
            {' \u00B7 '}
            {pluralRu(projectCount, t('team.project.one'), t('team.project.few'), t('team.project.many'))}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Role info toggle */}
          <button
            onClick={() => setShowRoleInfo(!showRoleInfo)}
            style={{
              ...btnSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              minHeight: 40,
              padding: '8px 14px',
            }}
            title={t('team.roleInfo')}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{'\u2139'}</span>
            {t('team.roleInfo')}
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              style={{
                ...btnPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
              {t('team.inviteToTeam')}
            </button>
          )}
        </div>
      </div>

      {/* -- Role permissions info card (collapsible) ----------- */}
      {showRoleInfo && (
        <div
          style={{
            ...cardStyle,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <div style={sectionTitle}>{t('team.roleInfo')}</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'] as const).map((role) => (
              <div
                key={role}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: `${roleColor(role)}08`,
                  border: `1px solid ${roleColor(role)}18`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 14, color: roleColor(role) }}>{roleIcon(role)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: roleColor(role) }}>
                    {ROLE_LABELS[role]}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
                  {ROLE_DESCS[role]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -- Team overview card --------------------------------- */}
      <div
        style={{
          ...cardStyle,
          padding: '18px 22px',
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: '1 1 160px',
            padding: '4px 20px 4px 0',
            borderRight: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.dim,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {t('team.tabTeam')}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{team.data.name}</div>
        </div>
        <div
          style={{
            flex: '0 1 120px',
            padding: '4px 20px',
            borderRight: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.dim,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {t('team.tabMembers')}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{memberCount}</div>
        </div>
        <div
          style={{
            flex: '0 1 120px',
            padding: '4px 20px',
            borderRight: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.dim,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {t('team.tabProjects')}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{projectCount}</div>
        </div>
        <div
          style={{
            flex: '0 1 120px',
            padding: '4px 0 4px 20px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.dim,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {t('team.tabPlan')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {PLAN_LABELS[profile.data?.plan || 'FREE'] || profile.data?.plan}
            </span>
          </div>
        </div>
      </div>

      {/* -- Invite form (collapsible) -------------------------- */}
      {showInviteForm && isAdmin && (
        <div
          className="tf-team-invite-form"
          style={{
            ...cardStyle,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <div style={sectionTitle}>{t('team.inviteMember')}</div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 220px', minWidth: 180 }}>
              <label
                htmlFor="invite-email"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.dim,
                  display: 'block',
                  marginBottom: 5,
                }}
              >
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                aria-label={t('team.inviteEmailLabel')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inviteEmail.trim()) {
                    invite.mutate({ email: inviteEmail.trim(), role: inviteRole });
                  }
                }}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.borderActive)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <label
                htmlFor="invite-role"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.dim,
                  display: 'block',
                  marginBottom: 5,
                }}
              >
                {t('team.roleLabel')}
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER')}
                aria-label={t('team.memberRole')}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  appearance: 'none' as const,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%237c7c96' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: 32,
                }}
              >
                <option value="EDITOR">{t('team.role.editor')}</option>
                <option value="ADMIN">{t('team.role.admin')}</option>
                <option value="VIEWER">{t('team.role.viewer')}</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() =>
                  inviteEmail.trim() &&
                  invite.mutate({ email: inviteEmail.trim(), role: inviteRole })
                }
                disabled={!inviteEmail.trim() || invite.isPending}
                style={{
                  ...btnPrimary,
                  opacity: !inviteEmail.trim() ? 0.5 : 1,
                }}
              >
                {invite.isPending ? t('team.sending') : t('team.invite')}
              </button>
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                }}
                style={btnSecondary}
              >
                {t('team.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Members list --------------------------------------- */}
      <div style={sectionTitle}>{t('team.membersLabel')}</div>
      <div
        style={{
          ...cardStyle,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Table header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 18px',
              borderBottom: `1px solid ${C.border}`,
              fontSize: 11,
              fontWeight: 600,
              color: C.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              minWidth: 320,
            }}
          >
            <div style={{ width: 36 }} />
            <div style={{ flex: 1 }}>{t('team.memberCol')}</div>
            <div style={{ width: 100, textAlign: 'center' }}>{t('team.roleCol')}</div>
            <div style={{ width: 100, textAlign: 'center' }}>{t('team.joinDateCol')}</div>
            {isOwner && <div style={{ width: 120, textAlign: 'right' }}>{t('team.actionsCol')}</div>}
          </div>

          {/* Member rows */}
          {team.data.members.map((m, idx) => {
            const isLast = idx === team.data!.members.length - 1;
            const initials = (m.user.name || m.user.email || '?')
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const gradients = [
              `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
              `linear-gradient(135deg, ${C.orange}, ${C.accent})`,
              `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
            ];

            const joinedDate = m.joinedAt ? formatDate(m.joinedAt) : '\u2014';

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 18px',
                  borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
                  transition: 'background 0.1s',
                  minWidth: 320,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.cardHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: m.user.image
                      ? `url(${m.user.image}) center/cover`
                      : gradients[idx % gradients.length],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {m.user.image ? (
                    <img
                      src={m.user.image}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.user.name || '\u2014'}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.sub,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.user.email}
                  </div>
                </div>

                {/* Role badge with tooltip */}
                <div style={{ width: 100, textAlign: 'center' }}>
                  <RoleTooltip
                    label={ROLE_LABELS[m.role] || m.role}
                    description={ROLE_DESCS[m.role] || ''}
                    color={roleColor(m.role)}
                    icon={roleIcon(m.role)}
                    C={C}
                  />
                </div>

                {/* Joined date */}
                <div
                  style={{
                    width: 100,
                    textAlign: 'center',
                    fontSize: 12,
                    color: C.sub,
                  }}
                >
                  {joinedDate}
                </div>

                {/* Actions (owner only) */}
                {isOwner && (
                  <div style={{ width: 120, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {m.role !== 'OWNER' ? (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) =>
                            updateRole.mutate({
                              memberId: m.id,
                              role: e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER',
                            })
                          }
                          aria-label={`${t('team.changeRoleFor')} ${m.user.name || m.user.email}`}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 8,
                            border: `1px solid ${C.border}`,
                            background: C.surface,
                            color: C.text,
                            fontSize: 11,
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'border-color 0.15s',
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = C.borderActive)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                        >
                          <option value="EDITOR">{t('team.role.editor')}</option>
                          <option value="ADMIN">{t('team.role.admin')}</option>
                          <option value="VIEWER">{t('team.role.viewer')}</option>
                        </select>

                        {confirmRemoveId === m.id ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => removeMember.mutate({ memberId: m.id })}
                              title={t('team.confirmRemove')}
                              aria-label={t('team.confirmRemove')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: 'none',
                                background: C.accent,
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              {removeMember.isPending ? '...' : t('team.yes')}
                            </button>
                            <button
                              onClick={() => setConfirmRemoveId(null)}
                              title={t('team.cancelBtn')}
                              aria-label={t('team.cancelRemove')}
                              style={{
                                padding: '5px 8px',
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                background: 'transparent',
                                color: C.sub,
                                fontSize: 11,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              {t('team.no')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemoveId(m.id)}
                            title={`${t('team.remove')} ${m.user.name || m.user.email}`}
                            aria-label={`${t('team.remove')} ${m.user.name || m.user.email}`}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              border: `1px solid ${C.border}`,
                              background: 'transparent',
                              color: C.accent,
                              fontSize: 12,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'background 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${C.accent}10`;
                              e.currentTarget.style.borderColor = `${C.accent}40`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = C.border;
                            }}
                          >
                            {'\u2715'}
                          </button>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: C.dim, padding: '5px 0' }}>
                        {'\u2014'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {team.data.members.length === 0 && (
            <div
              style={{
                padding: '32px 18px',
                textAlign: 'center',
                color: C.sub,
                fontSize: 13,
              }}
            >
              {t('team.noMembers')}
            </div>
          )}
        </div>
      </div>

      {/* -- Pending invites ------------------------------------ */}
      {isAdmin && (
        <>
          <div style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('team.pendingInvites')}
            {pendingCount > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  background: C.orange,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '0 6px',
                }}
              >
                {pendingCount}
              </span>
            )}
          </div>
          <div
            style={{
              ...cardStyle,
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            {pendingCount === 0 ? (
              <div
                style={{
                  padding: '24px 18px',
                  textAlign: 'center',
                  color: C.dim,
                  fontSize: 13,
                }}
              >
                {t('team.noPendingInvites')}
              </div>
            ) : (
              pendingInvites.data!.map((inv, idx) => {
                const isLast = idx === pendingInvites.data!.length - 1;
                const initials = (inv.user.name || inv.user.email || '?')
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 18px',
                      borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.cardHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: inv.user.image
                          ? `url(${inv.user.image}) center/cover`
                          : `linear-gradient(135deg, ${C.dim}40, ${C.dim}20)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.sub,
                        flexShrink: 0,
                        overflow: 'hidden',
                        opacity: 0.7,
                      }}
                    >
                      {inv.user.image ? (
                        <img
                          src={inv.user.image}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {inv.user.name || inv.user.email || '\u2014'}
                      </div>
                      <div style={{ fontSize: 11, color: C.dim }}>
                        {t('team.sentAt')}: {formatDate(inv.joinedAt)}
                      </div>
                    </div>

                    {/* Role */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: roleColor(inv.role),
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: `${roleColor(inv.role)}10`,
                      }}
                    >
                      {ROLE_LABELS[inv.role] || inv.role}
                    </span>

                    {/* Pending badge */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.orange,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: `${C.orange}12`,
                        border: `1px solid ${C.orange}20`,
                      }}
                    >
                      {t('team.invitePending')}
                    </span>

                    {/* Cancel button */}
                    {confirmCancelInviteId === inv.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => cancelInvite.mutate({ memberId: inv.id })}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: C.accent,
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {cancelInvite.isPending ? '...' : t('team.yes')}
                        </button>
                        <button
                          onClick={() => setConfirmCancelInviteId(null)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: `1px solid ${C.border}`,
                            background: 'transparent',
                            color: C.sub,
                            fontSize: 11,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {t('team.no')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelInviteId(inv.id)}
                        title={t('team.cancelInvite')}
                        aria-label={t('team.cancelInvite')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          background: 'transparent',
                          color: C.sub,
                          fontSize: 11,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = `${C.accent}10`)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {'\u2715'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* -- Shared projects ------------------------------------ */}
      {projectCount > 0 && (
        <>
          <div style={sectionTitle}>{t('team.sharedProjects')}</div>
          <div
            style={{
              ...cardStyle,
              padding: 18,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.green}20, ${C.cyan}20)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {'\uD83C\uDFAC'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {pluralRu(
                    projectCount,
                    t('team.sharedProject.one'),
                    t('team.sharedProject.few'),
                    t('team.sharedProject.many'),
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                  {t('team.sharedProjectsDesc')}
                </div>
              </div>
              <a
                href="/dashboard"
                style={{
                  marginLeft: 'auto',
                  ...btnSecondary,
                  textDecoration: 'none',
                  fontSize: 12,
                  padding: '8px 16px',
                }}
              >
                {t('team.openDashboard')}
              </a>
            </div>
          </div>
        </>
      )}

      {projectCount === 0 && (
        <>
          <div style={sectionTitle}>{t('team.sharedProjects')}</div>
          <div
            style={{
              ...cardStyle,
              padding: '32px 18px',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>{'\uD83D\uDCC1'}</div>
            <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.5 }}>
              {t('team.noSharedProjects')}
            </div>
          </div>
        </>
      )}

      {/* -- Activity log --------------------------------------- */}
      <div style={sectionTitle}>{t('team.activityLog')}</div>
      <div
        className="tf-team-activity"
        style={{
          ...cardStyle,
          overflow: 'hidden',
        }}
      >
        {!activityLog.data || activityLog.data.length === 0 ? (
          <div
            style={{
              padding: '24px 18px',
              textAlign: 'center',
              color: C.dim,
              fontSize: 13,
            }}
          >
            {t('team.noActivity')}
          </div>
        ) : (
          activityLog.data.map((entry, idx) => {
            const isLast = idx === activityLog.data!.length - 1;
            let meta: Record<string, string> = {};
            try {
              if (entry.meta) meta = JSON.parse(entry.meta);
            } catch {
              /* ignore */
            }

            const actionLabel =
              t(`team.activity.${entry.action}`) !== `team.activity.${entry.action}`
                ? t(`team.activity.${entry.action}`)
                : entry.action;

            // Build detail text from meta
            let detail = '';
            if (meta.email) detail = meta.email;
            else if (meta.title) detail = meta.title;
            else if (meta.name) detail = meta.name;
            if (meta.from && meta.to) {
              detail += ` (${ROLE_LABELS[meta.from] || meta.from} \u2192 ${ROLE_LABELS[meta.to] || meta.to})`;
            }

            // Action icon
            const actionIcon: Record<string, string> = {
              team_created: '\uD83C\uDF1F',
              member_invited: '\uD83D\uDCE8',
              member_removed: '\uD83D\uDEAB',
              role_changed: '\uD83D\uDD04',
              project_shared: '\uD83D\uDD17',
              project_unshared: '\uD83D\uDD13',
              invite_accepted: '\u2705',
              invite_declined: '\u274C',
              invite_cancelled: '\u23F9',
            };

            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 18px',
                  borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
                  fontSize: 13,
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                  {actionIcon[entry.action] || '\u25CF'}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ lineHeight: 1.5 }}>
                    <strong style={{ fontWeight: 600 }}>
                      {entry.actor.name || entry.actor.email}
                    </strong>{' '}
                    <span style={{ color: C.sub }}>{actionLabel}</span>
                    {detail && (
                      <span style={{ color: C.text, fontWeight: 500 }}> {detail}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                    {formatDateTime(entry.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
