'use client';

import { useState, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { toast } from '@/stores/useNotificationStore';
import { Z_INDEX } from '@/lib/constants';

/* ── Inline icons ─────────────────────────────────────── */

function IconUpload({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconX({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconFile({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

/* ── Types ────────────────────────────────────────────── */

interface ImportData {
  formatVersion: number;
  exportedAt?: string;
  project: {
    title: string;
    description?: string | null;
    tags?: string[];
    status?: string;
    thumbnailData?: Record<string, unknown> | null;
    characters?: Array<{
      id: string;
      name: string;
      role: string;
      avatar: string;
      ck: string;
      desc: string;
    }> | null;
  };
  scenes: Array<{
    prompt?: string | null;
    label: string;
    duration: number;
    order: number;
    model: string;
    metadata?: Record<string, unknown> | null;
  }>;
}

type ImportStep = 'select' | 'preview' | 'importing';

/* ── Component ────────────────────────────────────────── */

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('select');
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hovBtn, setHovBtn] = useState<string | null>(null);

  const importMutation = trpc.project.import.useMutation({
    onSuccess: (result) => {
      toast.success(`${t('dashboard.importSuccess')}: ${result.title}`);
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
      handleReset();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message);
      setStep('preview');
    },
  });

  const handleReset = useCallback(() => {
    setStep('select');
    setImportData(null);
    setError(null);
    setIsDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const parseFile = useCallback(async (file: File) => {
    setError(null);

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('dashboard.importFileTooLarge'));
      return;
    }

    // Validate extension
    if (!file.name.endsWith('.json') && !file.name.endsWith('.tubeforge.json')) {
      setError(t('dashboard.importInvalidFormat'));
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ImportData;

      // Basic structure validation
      if (!parsed.formatVersion || !parsed.project || !Array.isArray(parsed.scenes)) {
        setError(t('dashboard.importInvalidStructure'));
        return;
      }

      if (parsed.formatVersion > 1) {
        setError(t('dashboard.importUnsupportedVersion'));
        return;
      }

      if (!parsed.project.title) {
        setError(t('dashboard.importMissingTitle'));
        return;
      }

      setImportData(parsed);
      setStep('preview');
    } catch {
      setError(t('dashboard.importParseError'));
    }
  }, [t]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleConfirmImport = useCallback(() => {
    if (!importData) return;
    setStep('importing');
    importMutation.mutate({
      formatVersion: importData.formatVersion,
      project: {
        title: importData.project.title,
        description: importData.project.description,
        tags: importData.project.tags ?? [],
        status: (importData.project.status as 'DRAFT') ?? 'DRAFT',
        thumbnailData: importData.project.thumbnailData,
        characters: importData.project.characters,
      },
      scenes: importData.scenes.map((scene) => ({
        prompt: scene.prompt,
        label: scene.label ?? '',
        duration: scene.duration ?? 5,
        order: scene.order ?? 0,
        model: (scene.model as 'standard') ?? 'standard',
        metadata: scene.metadata,
      })),
    });
  }, [importData, importMutation]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => { if (step !== 'importing') { handleReset(); onClose(); } }}
        style={{
          position: 'fixed', inset: 0,
          background: C.overlay,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: Z_INDEX.MODAL_BACKDROP,
          animation: 'fadeIn .2s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        width: '90%', maxWidth: 520,
        maxHeight: '85vh',
        overflow: 'auto',
        zIndex: Z_INDEX.MODAL_BACKDROP + 1,
        boxShadow: '0 24px 80px rgba(0,0,0,.3)',
        animation: 'fadeIn .2s ease',
        fontFamily: 'var(--font-sans), sans-serif',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 0',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>
            {t('dashboard.importProject')}
          </h2>
          <button
            onClick={() => { if (step !== 'importing') { handleReset(); onClose(); } }}
            disabled={step === 'importing'}
            style={{
              background: 'none', border: 'none',
              color: C.sub, cursor: step === 'importing' ? 'not-allowed' : 'pointer',
              padding: 4, display: 'flex', borderRadius: 6,
            }}
            aria-label={t('dashboard.close')}
          >
            <IconX size={18} color={C.sub} />
          </button>
        </div>

        <div style={{ padding: '16px 22px 22px' }}>

          {/* Step 1: File selection */}
          {step === 'select' && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? C.accent : C.border}`,
                  borderRadius: 12,
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all .2s ease',
                  background: isDragOver ? C.accentDim : C.card,
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `${C.accent}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <IconUpload size={26} color={C.accent} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: C.text }}>
                  {t('dashboard.importDropFile')}
                </p>
                <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>
                  {t('dashboard.importFileHint')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.tubeforge.json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {error && (
                <div style={{
                  marginTop: 12, padding: '10px 14px',
                  background: '#ef444412', border: '1px solid #ef444430',
                  borderRadius: 10, fontSize: 13, color: '#ef4444',
                }}>
                  {error}
                </div>
              )}
            </>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && importData && (
            <>
              <div style={{
                background: C.card, borderRadius: 12,
                border: `1px solid ${C.border}`, padding: '16px 18px',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: `${C.blue}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IconFile size={22} color={C.blue} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 700, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {importData.project.title}
                    </div>
                    {importData.project.description && (
                      <div style={{
                        fontSize: 12, color: C.sub, marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 300,
                      }}>
                        {importData.project.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.sub, fontWeight: 500, marginBottom: 2 }}>
                      {t('dashboard.importScenes')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      {importData.scenes.length}
                    </div>
                  </div>
                  {importData.project.tags && importData.project.tags.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: C.sub, fontWeight: 500, marginBottom: 2 }}>
                        {t('dashboard.importTags')}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        {importData.project.tags.length}
                      </div>
                    </div>
                  )}
                  {importData.project.characters && importData.project.characters.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: C.sub, fontWeight: 500, marginBottom: 2 }}>
                        {t('dashboard.importCharacters')}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        {importData.project.characters.length}
                      </div>
                    </div>
                  )}
                  {importData.exportedAt && (
                    <div>
                      <div style={{ fontSize: 11, color: C.sub, fontWeight: 500, marginBottom: 2 }}>
                        {t('dashboard.importExportedAt')}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {new Date(importData.exportedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scene list preview */}
              {importData.scenes.length > 0 && (
                <div style={{
                  background: C.card, borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  marginBottom: 16, maxHeight: 200, overflow: 'auto',
                }}>
                  <div style={{
                    padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
                    fontSize: 12, fontWeight: 600, color: C.sub,
                  }}>
                    {t('dashboard.importSceneList')}
                  </div>
                  {importData.scenes.slice(0, 20).map((scene, i) => (
                    <div key={i} style={{
                      padding: '8px 14px',
                      borderBottom: i < Math.min(importData.scenes.length, 20) - 1 ? `1px solid ${C.border}` : 'none',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: C.dim,
                        width: 24, textAlign: 'center', flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{
                        fontSize: 13, color: C.text,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {scene.label || scene.prompt?.slice(0, 60) || t('dashboard.importEmptyScene')}
                      </span>
                      <span style={{
                        fontSize: 11, color: C.sub, marginLeft: 'auto', flexShrink: 0,
                      }}>
                        {scene.duration}s
                      </span>
                    </div>
                  ))}
                  {importData.scenes.length > 20 && (
                    <div style={{ padding: '8px 14px', fontSize: 12, color: C.sub, textAlign: 'center' }}>
                      +{importData.scenes.length - 20} {t('dashboard.importMoreScenes')}
                    </div>
                  )}
                </div>
              )}

              <p style={{ fontSize: 12, color: C.sub, margin: '0 0 16px', lineHeight: 1.5 }}>
                {t('dashboard.importNote')}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={handleReset}
                  onMouseEnter={() => setHovBtn('cancel')}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: hovBtn === 'cancel' ? C.card : 'transparent',
                    color: C.text, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .15s ease',
                  }}
                >
                  {t('dashboard.importCancel')}
                </button>
                <button
                  onClick={handleConfirmImport}
                  onMouseEnter={() => setHovBtn('import')}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    padding: '10px 24px', borderRadius: 10,
                    border: 'none',
                    background: C.accent, color: '#fff',
                    fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: hovBtn === 'import' ? `0 6px 20px ${C.accent}44` : `0 4px 12px ${C.accent}33`,
                    transition: 'all .2s ease',
                    transform: hovBtn === 'import' ? 'translateY(-1px)' : 'none',
                  }}
                >
                  {t('dashboard.importConfirm')}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
            }}>
              {/* Spinner */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: `3px solid ${C.border}`,
                borderTopColor: C.accent,
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: C.text }}>
                {t('dashboard.importImporting')}
              </p>
              <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>
                {t('dashboard.importPleaseWait')}
              </p>

              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
