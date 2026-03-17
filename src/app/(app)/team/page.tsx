'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { Skeleton } from '@/components/ui';
import { pluralRu } from '@/lib/utils';

export default function TeamPage() {
  const C = useThemeStore((s) => s.theme);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [teamName, setTeamName] = useState('');

  const profile = trpc.user.getProfile.useQuery();
  const team = trpc.team.getTeam.useQuery(undefined, {
    enabled: profile.data?.plan === 'STUDIO',
  });

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => { toast.success('Команда создана'); team.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const invite = trpc.team.invite.useMutation({
    onSuccess: () => { toast.success('Участник добавлен'); setInviteEmail(''); team.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => { toast.success('Участник удалён'); team.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const updateRole = trpc.team.updateRole.useMutation({
    onSuccess: () => { toast.success('Роль обновлена'); team.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (profile.isLoading) {
    return (
      <div>
        <Skeleton width="200px" height="28px" />
        <div style={{ marginTop: 20 }}><Skeleton width="100%" height="300px" rounded /></div>
      </div>
    );
  }

  if (profile.data?.plan !== 'STUDIO') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>👥</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Команды</h2>
        <p style={{ color: C.sub, fontSize: 14, marginBottom: 16 }}>Совместная работа доступна только на плане Studio</p>
        <a href="/settings" style={{ padding: '8px 20px', borderRadius: 8, background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Обновить план</a>
      </div>
    );
  }

  if (!team.data) {
    return (
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Команда</h1>
        <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>Создайте команду для совместной работы над проектами</p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 400 }}>
          <label htmlFor="team-name" style={{ fontSize: 11, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 6 }}>Название команды</label>
          <input
            id="team-name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Моя студия"
            maxLength={100}
            aria-label="Название команды"
            style={{ width: '100%', padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: 12 }}
          />
          <button
            onClick={() => teamName.trim() && createTeam.mutate({ name: teamName.trim() })}
            disabled={!teamName.trim() || createTeam.isPending}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !teamName.trim() ? 0.5 : 1 }}
          >
            {createTeam.isPending ? 'Создание...' : 'Создать команду'}
          </button>
        </div>
      </div>
    );
  }

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { OWNER: 'Владелец', ADMIN: 'Админ', EDITOR: 'Редактор', VIEWER: 'Зритель' };
    return map[role] || role;
  };

  const roleColor = (role: string) => {
    const map: Record<string, string> = { OWNER: C.orange, ADMIN: C.purple, EDITOR: C.blue, VIEWER: C.dim };
    return map[role] || C.sub;
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{team.data.name}</h1>
      <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>{pluralRu(team.data.members.length, 'участник', 'участника', 'участников')} · {pluralRu(team.data._count.projects, 'проект', 'проекта', 'проектов')}</p>

      {/* Invite */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'end' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="invite-email" style={{ fontSize: 10, color: C.sub, display: 'block', marginBottom: 4 }}>Email</label>
          <input
            id="invite-email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="user@example.com"
            aria-label="Email для приглашения"
            onKeyDown={(e) => { if (e.key === 'Enter' && inviteEmail.trim()) invite.mutate({ email: inviteEmail.trim(), role: inviteRole }); }}
            style={{ width: '100%', padding: '8px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div style={{ width: 120 }}>
          <label htmlFor="invite-role" style={{ fontSize: 10, color: C.sub, display: 'block', marginBottom: 4 }}>Роль</label>
          <select
            id="invite-role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER')}
            aria-label="Роль участника"
            style={{ width: '100%', padding: '8px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: 'inherit' }}
          >
            <option value="EDITOR">Редактор</option>
            <option value="ADMIN">Админ</option>
            <option value="VIEWER">Зритель</option>
          </select>
        </div>
        <button
          onClick={() => inviteEmail.trim() && invite.mutate({ email: inviteEmail.trim(), role: inviteRole })}
          disabled={!inviteEmail.trim() || invite.isPending}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          {invite.isPending ? '...' : 'Пригласить'}
        </button>
      </div>

      {/* Members */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {team.data.members.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${C.blue},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(m.user.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{m.user.name || '—'}</div>
              <div style={{ fontSize: 12, color: C.sub }}>{m.user.email}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: roleColor(m.role), padding: '3px 10px', borderRadius: 6, background: `${roleColor(m.role)}15` }}>
              {roleLabel(m.role)}
            </span>
            {m.role !== 'OWNER' && team.data!.ownerId === profile.data?.id && (
              <div style={{ display: 'flex', gap: 4 }}>
                <select
                  value={m.role}
                  onChange={(e) => updateRole.mutate({ memberId: m.id, role: e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER' })}
                  aria-label={`Изменить роль ${m.user.name || m.user.email}`}
                  style={{ padding: '4px 6px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, fontFamily: 'inherit' }}
                >
                  <option value="EDITOR">Редактор</option>
                  <option value="ADMIN">Админ</option>
                  <option value="VIEWER">Зритель</option>
                </select>
                <button
                  onClick={() => removeMember.mutate({ memberId: m.id })}
                  title={`Удалить ${m.user.name || m.user.email}`}
                  aria-label={`Удалить ${m.user.name || m.user.email}`}
                  style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.accent, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
