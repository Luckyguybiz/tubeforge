'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#8b5cf6', '#a78bfa'];
const CONTENT_TYPES = ['YouTube Video', 'Short', 'Podcast', 'Blog'];

const AUDIENCES = [
  'General Audience', 'Teens (13-17)', 'Young Adults (18-24)',
  'Adults (25-44)', 'Professionals', 'Gamers', 'Tech Enthusiasts', 'Parents',
];

interface Idea {
  title: string;
  description: string;
  views: string;
  tags: string[];
}

const SAMPLE_IDEAS: Idea[] = [
  { title: 'I Tried AI for 30 Days — Here\'s What Happened', description: 'Document a month-long journey using AI tools for every aspect of daily life, from cooking to work productivity.', views: '250K-500K', tags: ['AI', 'Challenge', 'Lifestyle'] },
  { title: 'The Hidden Psychology Behind Viral Videos', description: 'Deep dive into the psychological triggers that make content go viral, with real examples and expert interviews.', views: '150K-300K', tags: ['Psychology', 'Education', 'Viral'] },
  { title: '5 Tools That Replaced My Entire Team', description: 'Showcase AI and automation tools that can handle tasks typically requiring multiple team members.', views: '400K-800K', tags: ['Productivity', 'Tools', 'Business'] },
  { title: 'Why Everyone Is Wrong About Remote Work', description: 'Present contrarian data and insights about remote work effectiveness that challenge popular narratives.', views: '200K-400K', tags: ['Remote Work', 'Career', 'Debate'] },
  { title: 'I Built a Business in 48 Hours Using Only AI', description: 'Speed-run creating a complete online business using AI for branding, website, content, and marketing.', views: '500K-1M', tags: ['Business', 'AI', 'Challenge'] },
  { title: 'The $0 Marketing Strategy That Got 1M Views', description: 'Break down organic marketing techniques that generated massive reach without any ad spend.', views: '300K-600K', tags: ['Marketing', 'Growth', 'Strategy'] },
  { title: 'What YouTube Doesn\'t Want You to Know About the Algorithm', description: 'Insider insights into how the recommendation algorithm actually works, with actionable tips.', views: '600K-1.2M', tags: ['YouTube', 'Algorithm', 'Growth'] },
  { title: 'Reacting to My First Video — 5 Years Later', description: 'Nostalgic reaction and analysis of your earliest content, showing growth and lessons learned.', views: '100K-250K', tags: ['Nostalgia', 'Reaction', 'Personal'] },
  { title: 'I Interviewed 100 Millionaires — The #1 Pattern', description: 'Compile insights from conversations with successful people, revealing the most common trait they share.', views: '800K-1.5M', tags: ['Success', 'Interview', 'Money'] },
  { title: 'The Morning Routine That Changed Everything', description: 'A science-backed morning routine tested over 90 days with documented before/after productivity metrics.', views: '350K-700K', tags: ['Productivity', 'Health', 'Routine'] },
];

export function Brainstormer() {
  const C = useThemeStore((s) => s.theme);
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredUse, setHoveredUse] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleGenerate = useCallback(() => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setSavedIds(new Set());
    setCopiedId(null);
    setTimeout(() => {
      setLoading(false);
      setIdeas(SAMPLE_IDEAS);
    }, 2000);
  }, [topic, loading]);

  const handleSave = useCallback((idx: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleUseIdea = useCallback((idx: number) => {
    setCopiedId(idx);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(ideas[idx]?.title ?? '');
    }
    setTimeout(() => setCopiedId(null), 2000);
  }, [ideas]);

  return (
    <ToolPageShell
      comingSoon
      title="AI Brainstormer"
      subtitle="Generate creative content ideas tailored to your niche and audience"
      gradient={GRADIENT}
    >
      {/* Controls row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Topic input */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 10 }}>Topic / Niche</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="e.g. AI productivity, fitness, personal finance..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>

          {/* Audience + Content Type row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Audience */}
            <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 10 }}>Target Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  cursor: 'pointer', transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              >
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Content Type */}
            <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 10 }}>Content Type</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setContentType(ct)}
                    style={{
                      padding: '8px 14px', borderRadius: 10,
                      border: `1px solid ${contentType === ct ? GRADIENT[0] : C.border}`,
                      background: contentType === ct ? `${GRADIENT[0]}22` : C.surface,
                      color: contentType === ct ? GRADIENT[0] : C.sub,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <ActionButton label="Generate Ideas" gradient={GRADIENT} onClick={handleGenerate} loading={loading} disabled={!topic.trim()} />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          padding: 48, textAlign: 'center', borderRadius: 16,
          border: `1px solid ${C.border}`, background: C.card,
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1.2s linear infinite' }}>
            <circle cx="20" cy="20" r="16" stroke={`${GRADIENT[0]}33`} strokeWidth="3" fill="none" />
            <path d="M20 4a16 16 0 0111.31 4.69" stroke={GRADIENT[0]} strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
          <p style={{ fontSize: 14, color: C.sub, marginTop: 16, fontWeight: 600 }}>Brainstorming ideas...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && ideas.length === 0 && (
        <div style={{
          padding: 48, textAlign: 'center', borderRadius: 16,
          border: `1px solid ${C.border}`, background: C.card,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p style={{ fontSize: 14, color: C.dim, marginTop: 16 }}>Enter a topic and click &ldquo;Generate Ideas&rdquo; to get started</p>
        </div>
      )}

      {/* Ideas list */}
      {ideas.length > 0 && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{ideas.length} Ideas Generated</span>
            <span style={{ fontSize: 12, color: C.dim }}>For &ldquo;{topic}&rdquo; &middot; {contentType}</span>
          </div>
          {ideas.map((idea, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: 20, borderRadius: 14,
                border: `1px solid ${hoveredCard === i ? GRADIENT[0] + '55' : C.border}`,
                background: hoveredCard === i ? `${GRADIENT[0]}08` : C.card,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: 8,
                      background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{idea.title}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.sub, margin: '8px 0 0 34px', lineHeight: 1.5 }}>{idea.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginLeft: 34, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: '#10b98122', color: '#10b981',
                    }}>
                      Est. {idea.views} views
                    </span>
                    {idea.tags.map((tag) => (
                      <span key={tag} style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                        background: C.border, color: C.sub,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 2 }}>
                  <button
                    onClick={() => handleUseIdea(i)}
                    onMouseEnter={() => setHoveredUse(i)}
                    onMouseLeave={() => setHoveredUse(null)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${GRADIENT[0]}`,
                      background: copiedId === i ? `${GRADIENT[0]}33` : hoveredUse === i ? `${GRADIENT[0]}22` : `${GRADIENT[0]}11`,
                      color: GRADIENT[0], cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {copiedId === i ? 'Copied!' : 'Use this idea'}
                  </button>
                  <button
                    onClick={() => handleSave(i)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${savedIds.has(i) ? '#10b981' : C.border}`,
                      background: savedIds.has(i) ? '#10b98122' : C.surface,
                      color: savedIds.has(i) ? '#10b981' : C.sub,
                      cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => { if (!savedIds.has(i)) e.currentTarget.style.borderColor = C.text; }}
                    onMouseLeave={(e) => { if (!savedIds.has(i)) e.currentTarget.style.borderColor = C.border; }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {savedIds.has(i) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolPageShell>
  );
}
