'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageShell, ActionButton, UploadArea } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import type { Theme } from '@/lib/types';

/* ── Constants ──────────────────────────────────────────────── */

const GRADIENT: [string, string] = ['#f43f5e', '#ec4899'];

type TabId = 'generate' | 'recreate' | 'edit' | 'analyze';
type StyleId = 'cinematic' | 'cartoon' | 'minimal' | 'bold' | 'gaming' | 'vlog';

const TABS: { id: TabId; labelKey: string; icon: string }[] = [
  { id: 'generate', labelKey: 'aithumbnail.tab.generate', icon: '\u2728' },
  { id: 'recreate', labelKey: 'aithumbnail.tab.recreate', icon: '\uD83D\uDD04' },
  { id: 'edit', labelKey: 'aithumbnail.tab.edit', icon: '\u270F\uFE0F' },
  { id: 'analyze', labelKey: 'aithumbnail.tab.analyze', icon: '\uD83D\uDCCA' },
];

const STYLES: { id: StyleId; labelKey: string }[] = [
  { id: 'cinematic', labelKey: 'aithumbnail.style.cinematic' },
  { id: 'cartoon', labelKey: 'aithumbnail.style.cartoon' },
  { id: 'minimal', labelKey: 'aithumbnail.style.minimal' },
  { id: 'bold', labelKey: 'aithumbnail.style.bold' },
  { id: 'gaming', labelKey: 'aithumbnail.style.gaming' },
  { id: 'vlog', labelKey: 'aithumbnail.style.vlog' },
];

/* ── Score gauge component ──────────────────────────────────── */

function ScoreGauge({ label, score, C }: { label: string; score: number; C: Theme }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? '#22c55e' : score >= 4 ? '#eab308' : '#ef4444';
  return (
    <div style={{ flex: '1 1 140px', minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{score}/10</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 4,
          background: color, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

/* ── Image preview component ────────────────────────────────── */

function ImagePreview({ src, alt, C, maxH = 400 }: { src: string; alt: string; C: Theme; maxH?: number }) {
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}`,
      background: C.card, display: 'flex', justifyContent: 'center', alignItems: 'center',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: '100%', maxHeight: maxH, objectFit: 'contain' }} />
    </div>
  );
}

/* ── File-to-base64 helper ──────────────────────────────────── */

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data:...;base64, prefix
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Main Component ─────────────────────────────────────────── */

export function AiThumbnailEditor() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const { canUseAI } = usePlanLimits();

  const [activeTab, setActiveTab] = useState<TabId>('generate');

  /* ── Generate state ── */
  const [genPrompt, setGenPrompt] = useState('');
  const [genStyle, setGenStyle] = useState<StyleId>('cinematic');
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  /* ── Recreate state ── */
  const [recUrl, setRecUrl] = useState('');
  const [recStyle, setRecStyle] = useState<StyleId>('cinematic');
  const [recOriginal, setRecOriginal] = useState<string | null>(null);
  const [recResult, setRecResult] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  /* ── Edit state ── */
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editResult, setEditResult] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  /* ── Analyze state ── */
  const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
  const [analyzePreview, setAnalyzePreview] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<{
    overall: number;
    color: number;
    text: number;
    emotion: number;
    composition: number;
    suggestions: string[];
  } | null>(null);

  /* ── tRPC for Generate tab ── */
  const generateMutation = trpc.ai.generateImage.useMutation({
    onSuccess: (data) => {
      setGenResult(data.url);
      setGenLoading(false);
      toast.success(t('aithumbnail.toast.generated'));
    },
    onError: (err) => {
      setGenLoading(false);
      toast.error(err.message);
    },
  });

  /* ── Handlers ── */

  const handleGenerate = useCallback(() => {
    if (!genPrompt.trim() || genLoading) return;
    if (!canUseAI) { toast.error(t('aithumbnail.toast.limitReached')); return; }
    setGenLoading(true);
    setGenResult(null);

    const styleMap: Record<StyleId, string> = {
      cinematic: 'cinematic movie-style, dramatic lighting, epic composition',
      cartoon: 'cartoon illustration, vibrant colors, fun style',
      minimal: 'clean minimalist, simple shapes, modern design',
      bold: 'bold typography, high contrast, eye-catching',
      gaming: 'gaming aesthetic, neon colors, dynamic energy',
      vlog: 'lifestyle vlog, bright warm colors, friendly feel',
    };

    generateMutation.mutate({
      prompt: `YouTube thumbnail, ${styleMap[genStyle]}, 1280x720, ${genPrompt.trim()}`,
      style: 'cinematic',
      size: '1792x1024',
    });
  }, [genPrompt, genStyle, genLoading, canUseAI, t, generateMutation]);

  const handleRecreate = useCallback(async () => {
    if (!recUrl.trim() || recLoading) return;
    if (!canUseAI) { toast.error(t('aithumbnail.toast.limitReached')); return; }
    setRecLoading(true);
    setRecResult(null);
    setRecOriginal(null);
    try {
      const res = await fetch('/api/tools/thumbnail-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recreate', url: recUrl.trim(), style: recStyle }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }
      const data = await res.json();
      setRecOriginal(data.originalUrl ?? null);
      setRecResult(data.resultUrl ?? null);
      toast.success(t('aithumbnail.toast.recreated'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setRecLoading(false);
    }
  }, [recUrl, recStyle, recLoading, canUseAI, t]);

  const handleEdit = useCallback(async () => {
    if (!editFile || !editInstruction.trim() || editLoading) return;
    if (!canUseAI) { toast.error(t('aithumbnail.toast.limitReached')); return; }
    setEditLoading(true);
    setEditResult(null);
    try {
      const base64 = await fileToBase64(editFile);
      const res = await fetch('/api/tools/thumbnail-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', imageBase64: base64, instruction: editInstruction.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }
      const data = await res.json();
      setEditResult(data.resultUrl ?? null);
      toast.success(t('aithumbnail.toast.edited'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setEditLoading(false);
    }
  }, [editFile, editInstruction, editLoading, canUseAI, t]);

  const handleAnalyze = useCallback(async () => {
    if (!analyzeFile || analyzeLoading) return;
    if (!canUseAI) { toast.error(t('aithumbnail.toast.limitReached')); return; }
    setAnalyzeLoading(true);
    setAnalyzeResult(null);
    try {
      const base64 = await fileToBase64(analyzeFile);
      const res = await fetch('/api/tools/thumbnail-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', imageBase64: base64 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }
      const data = await res.json();
      setAnalyzeResult(data.analysis ?? null);
      toast.success(t('aithumbnail.toast.analyzed'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setAnalyzeLoading(false);
    }
  }, [analyzeFile, analyzeLoading, canUseAI, t]);

  const handleDownload = useCallback(async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Download failed');
    }
  }, []);

  const handleEditFile = useCallback((file: File) => {
    setEditFile(file);
    setEditResult(null);
    const url = URL.createObjectURL(file);
    setEditPreview(url);
  }, []);

  const handleAnalyzeFile = useCallback((file: File) => {
    setAnalyzeFile(file);
    setAnalyzeResult(null);
    const url = URL.createObjectURL(file);
    setAnalyzePreview(url);
  }, []);

  /* ── Style selector sub-component ──────────────────────── */

  const StyleSelector = ({ value, onChange }: { value: StyleId; onChange: (s: StyleId) => void }) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {STYLES.map((s) => (
        <button key={s.id} onClick={() => onChange(s.id)} style={{
          padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${value === s.id ? GRADIENT[0] : C.border}`,
          background: value === s.id ? `${GRADIENT[0]}18` : C.card,
          color: value === s.id ? GRADIENT[0] : C.text,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s ease', fontFamily: 'inherit', outline: 'none',
        }}>
          {t(s.labelKey)}
        </button>
      ))}
    </div>
  );

  /* ── Input field sub-component ─────────────────────────── */

  const InputField = ({ value, onChange, placeholder, multiline }: {
    value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean;
  }) => {
    const Tag = multiline ? 'textarea' : 'input';
    return (
      <Tag
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12,
          border: `1.5px solid ${C.border}`, background: C.surface,
          color: C.text, fontSize: 14, fontFamily: 'inherit',
          outline: 'none', resize: multiline ? 'vertical' : undefined,
          minHeight: multiline ? 80 : undefined,
          transition: 'border-color 0.2s ease', boxSizing: 'border-box',
        }}
        onFocus={(e) => { (e.target as HTMLElement).style.borderColor = GRADIENT[0]; }}
        onBlur={(e) => { (e.target as HTMLElement).style.borderColor = C.border; }}
      />
    );
  };

  /* ── Render tabs ───────────────────────────────────────── */

  return (
    <ToolPageShell
      title={t('aithumbnail.title')}
      subtitle={t('aithumbnail.subtitle')}
      badge="AI"
      gradient={GRADIENT}
    >
      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, padding: 4, borderRadius: 14,
        background: C.surface, border: `1px solid ${C.border}`,
        marginBottom: 24, overflowX: 'auto',
      }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: '1 1 0', minWidth: 100, padding: '10px 16px', borderRadius: 10,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease',
            outline: 'none', whiteSpace: 'nowrap',
            background: activeTab === tab.id ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})` : 'transparent',
            color: activeTab === tab.id ? '#fff' : C.sub,
          }}>
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* ═══ TAB: Generate ═══ */}
      {activeTab === 'generate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
              {t('aithumbnail.generate.promptLabel')}
            </label>
            <InputField
              value={genPrompt}
              onChange={setGenPrompt}
              placeholder={t('aithumbnail.generate.promptPlaceholder')}
              multiline
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
              {t('aithumbnail.generate.styleLabel')}
            </label>
            <StyleSelector value={genStyle} onChange={setGenStyle} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ActionButton
              label={genLoading ? t('aithumbnail.generating') : t('aithumbnail.generate.btn')}
              gradient={GRADIENT}
              onClick={handleGenerate}
              disabled={!genPrompt.trim()}
              loading={genLoading}
            />
            <span style={{ fontSize: 12, color: C.dim }}>1280 x 720 (YouTube)</span>
          </div>

          {genResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ImagePreview src={genResult} alt="Generated thumbnail" C={C} />
              <button onClick={() => handleDownload(genResult, 'ai-thumbnail.png')} style={{
                alignSelf: 'flex-start', padding: '10px 24px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card, color: C.text,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                outline: 'none',
              }}>
                {t('aithumbnail.download')}
              </button>
            </div>
          )}

          {!genResult && !genLoading && (
            <div style={{
              padding: '48px 24px', borderRadius: 16, border: `1px solid ${C.border}`,
              background: C.card, textAlign: 'center',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.4}>
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              <p style={{ fontSize: 13, color: C.dim, marginTop: 12 }}>{t('aithumbnail.generate.placeholder')}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Recreate ═══ */}
      {activeTab === 'recreate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
              {t('aithumbnail.recreate.urlLabel')}
            </label>
            <InputField
              value={recUrl}
              onChange={setRecUrl}
              placeholder={t('aithumbnail.recreate.urlPlaceholder')}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
              {t('aithumbnail.recreate.styleLabel')}
            </label>
            <StyleSelector value={recStyle} onChange={setRecStyle} />
          </div>

          <ActionButton
            label={recLoading ? t('aithumbnail.recreating') : t('aithumbnail.recreate.btn')}
            gradient={GRADIENT}
            onClick={handleRecreate}
            disabled={!recUrl.trim()}
            loading={recLoading}
          />

          {(recOriginal || recResult) && (
            <div style={{
              display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
            }}>
              {recOriginal && (
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>{t('aithumbnail.recreate.original')}</p>
                  <ImagePreview src={recOriginal} alt="Original thumbnail" C={C} maxH={300} />
                </div>
              )}
              {recOriginal && recResult && (
                <div style={{ fontSize: 28, color: C.dim, flexShrink: 0 }}>{'\u2192'}</div>
              )}
              {recResult && (
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>{t('aithumbnail.recreate.recreated')}</p>
                  <ImagePreview src={recResult} alt="Recreated thumbnail" C={C} maxH={300} />
                  <button onClick={() => handleDownload(recResult, 'recreated-thumbnail.png')} style={{
                    marginTop: 10, padding: '8px 20px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.card, color: C.text,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                  }}>
                    {t('aithumbnail.download')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Edit ═══ */}
      {activeTab === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!editPreview ? (
            <UploadArea C={C} accept="image/*" onFile={handleEditFile} label={t('aithumbnail.edit.uploadLabel')} />
          ) : (
            <div style={{ position: 'relative' }}>
              <ImagePreview src={editPreview} alt="Upload preview" C={C} maxH={300} />
              <button onClick={() => { setEditFile(null); setEditPreview(null); setEditResult(null); }} style={{
                position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8,
                background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontFamily: 'inherit',
                outline: 'none',
              }}>
                {'\u2715'}
              </button>
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
              {t('aithumbnail.edit.instructionLabel')}
            </label>
            <InputField
              value={editInstruction}
              onChange={setEditInstruction}
              placeholder={t('aithumbnail.edit.instructionPlaceholder')}
              multiline
            />
          </div>

          <ActionButton
            label={editLoading ? t('aithumbnail.applying') : t('aithumbnail.edit.btn')}
            gradient={GRADIENT}
            onClick={handleEdit}
            disabled={!editFile || !editInstruction.trim()}
            loading={editLoading}
          />

          {editResult && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>{t('aithumbnail.edit.result')}</p>
              <ImagePreview src={editResult} alt="Edited thumbnail" C={C} />
              <button onClick={() => handleDownload(editResult, 'edited-thumbnail.png')} style={{
                marginTop: 10, padding: '8px 20px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card, color: C.text,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
              }}>
                {t('aithumbnail.download')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Analyze ═══ */}
      {activeTab === 'analyze' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!analyzePreview ? (
            <UploadArea C={C} accept="image/*" onFile={handleAnalyzeFile} label={t('aithumbnail.analyze.uploadLabel')} />
          ) : (
            <div style={{ position: 'relative' }}>
              <ImagePreview src={analyzePreview} alt="Analyze preview" C={C} maxH={300} />
              <button onClick={() => { setAnalyzeFile(null); setAnalyzePreview(null); setAnalyzeResult(null); }} style={{
                position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8,
                background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontFamily: 'inherit',
                outline: 'none',
              }}>
                {'\u2715'}
              </button>
            </div>
          )}

          <ActionButton
            label={analyzeLoading ? t('aithumbnail.analyzing') : t('aithumbnail.analyze.btn')}
            gradient={GRADIENT}
            onClick={handleAnalyze}
            disabled={!analyzeFile}
            loading={analyzeLoading}
          />

          {analyzeResult && (
            <div style={{
              padding: 20, borderRadius: 16, border: `1px solid ${C.border}`,
              background: C.card, display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              {/* Overall score large */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 48, fontWeight: 800, lineHeight: 1,
                  color: analyzeResult.overall >= 7 ? '#22c55e' : analyzeResult.overall >= 4 ? '#eab308' : '#ef4444',
                }}>
                  {analyzeResult.overall}
                  <span style={{ fontSize: 20, fontWeight: 500, color: C.sub }}>/10</span>
                </div>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{t('aithumbnail.analyze.overallCtr')}</p>
              </div>

              {/* Individual scores */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <ScoreGauge label={t('aithumbnail.analyze.colorContrast')} score={analyzeResult.color} C={C} />
                <ScoreGauge label={t('aithumbnail.analyze.textReadability')} score={analyzeResult.text} C={C} />
                <ScoreGauge label={t('aithumbnail.analyze.emotionalImpact')} score={analyzeResult.emotion} C={C} />
                <ScoreGauge label={t('aithumbnail.analyze.composition')} score={analyzeResult.composition} C={C} />
              </div>

              {/* Suggestions */}
              {analyzeResult.suggestions.length > 0 && (
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                    {t('aithumbnail.analyze.suggestions')}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {analyzeResult.suggestions.map((s, i) => (
                      <li key={i} style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
