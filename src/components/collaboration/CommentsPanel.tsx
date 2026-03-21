'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import type { Theme } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════
   Comments Panel

   A collapsible bottom panel showing project comments.
   - Add new comments (optionally tied to a scene)
   - Mark comments as resolved
   - Delete own comments
   ═══════════════════════════════════════════════════════════════════ */

interface CommentsPanelProps {
  projectId: string;
  selectedSceneId: string | null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function UserInitials({ name, image, size = 24, C }: { name: string; image: string | null; size?: number; C: Theme }) {
  const initials = useMemo(() => {
    const parts = (name || 'U').split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }, [name]);

  if (image) {
    return (
      <img
        src={image}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${C.accent}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        color: C.accent,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function CommentsPanel({ projectId, selectedSceneId }: CommentsPanelProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [text, setText] = useState('');
  const [filterScene, setFilterScene] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const comments = trpc.comment.list.useQuery(
    { projectId, sceneId: filterScene ? selectedSceneId : undefined },
    { refetchInterval: 10000 },
  );

  const addComment = trpc.comment.add.useMutation({
    onSuccess: () => {
      setText('');
      comments.refetch();
    },
  });

  const resolveComment = trpc.comment.resolve.useMutation({
    onSuccess: () => comments.refetch(),
  });

  const deleteComment = trpc.comment.delete.useMutation({
    onSuccess: () => comments.refetch(),
  });

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    addComment.mutate({
      projectId,
      text: text.trim(),
      sceneId: selectedSceneId,
    });
  }, [text, projectId, selectedSceneId, addComment]);

  const commentList = comments.data ?? [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {t('collab.comments')} ({commentList.length})
        </span>
        {selectedSceneId && (
          <button
            onClick={() => setFilterScene(!filterScene)}
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 4,
              border: `1px solid ${filterScene ? C.accent + '55' : C.border}`,
              background: filterScene ? C.accent + '10' : 'transparent',
              color: filterScene ? C.accent : C.sub,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
            }}
          >
            {t('collab.thisScene')}
          </button>
        )}
      </div>

      {/* Comment list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {commentList.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 10px',
              color: C.dim,
              fontSize: 11,
              textAlign: 'center',
            }}
          >
            {t('collab.noComments')}
          </div>
        )}
        {commentList.map((comment) => (
          <div
            key={comment.id}
            style={{
              padding: '6px 8px',
              borderRadius: 8,
              background: comment.resolved ? C.surface : C.card,
              border: `1px solid ${comment.resolved ? C.border : 'transparent'}`,
              opacity: comment.resolved ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <UserInitials name={comment.userName} image={comment.userImage} size={18} C={C} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text, flex: 1 }}>
                {comment.userName}
              </span>
              <span style={{ fontSize: 8, color: C.dim }}>
                {timeAgo(comment.createdAt)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4, paddingLeft: 24, wordBreak: 'break-word' }}>
              {comment.text}
            </div>
            {comment.sceneId && (
              <div style={{ fontSize: 8, color: C.dim, paddingLeft: 24, marginTop: 2 }}>
                Scene: {comment.sceneId.slice(0, 8)}...
              </div>
            )}
            <div style={{ display: 'flex', gap: 4, paddingLeft: 24, marginTop: 4 }}>
              <button
                onClick={() => resolveComment.mutate({ projectId, commentId: comment.id, resolved: !comment.resolved })}
                style={{
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 4,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: comment.resolved ? C.green : C.sub,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                {comment.resolved ? t('collab.reopen') : t('collab.resolve')}
              </button>
              <button
                onClick={() => deleteComment.mutate({ projectId, commentId: comment.id })}
                style={{
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 4,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.accent,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                {t('collab.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '6px 8px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={t('collab.addComment')}
          maxLength={2000}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontSize: 11,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || addComment.isPending}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: text.trim() ? C.accent : C.dim,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            cursor: text.trim() ? 'pointer' : 'default',
            fontFamily: 'inherit',
            opacity: text.trim() ? 1 : 0.4,
            whiteSpace: 'nowrap',
          }}
        >
          {addComment.isPending ? '...' : t('collab.send')}
        </button>
      </div>
    </div>
  );
}
