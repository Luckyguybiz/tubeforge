'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useRouter } from 'next/navigation';

export function BrandKit() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const planInfo = usePlanLimits();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#ec4899');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isStudio = planInfo.plan === 'STUDIO';

  /* ── Queries ──────────────────────────────────────── */
  const brandKit = trpc.brand.getBrandKit.useQuery(undefined, {
    enabled: isStudio,
  });

  const saveMutation = trpc.brand.saveBrandKit.useMutation({
    onSuccess: () => {
      toast.success(t('brand.saved'));
      setSaving(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSaving(false);
    },
  });

  /* ── Load brand kit data ──────────────────────────── */
  useEffect(() => {
    if (brandKit.data) {
      setPrimaryColor(brandKit.data.primaryColor);
      setSecondaryColor(brandKit.data.secondaryColor);
      setAccentColor(brandKit.data.accentColor);
      setLogoUrl(brandKit.data.logoUrl);
    }
  }, [brandKit.data]);

  /* ── Handlers ─────────────────────────────────────── */
  const handleSave = useCallback(() => {
    if (!isStudio) return;
    setSaving(true);
    saveMutation.mutate({
      primaryColor,
      secondaryColor,
      accentColor,
      logoUrl,
    });
  }, [isStudio, primaryColor, secondaryColor, accentColor, logoUrl, saveMutation]);

  const handleApplyToProject = useCallback(() => {
    toast.success(t('brand.appliedToProject'));
  }, [t]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        toast.error(data.error || t('brand.uploadError'));
        return;
      }

      setLogoUrl(data.url);
      toast.success(t('brand.logoUploaded'));
    } catch {
      toast.error(t('brand.uploadError'));
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [t]);

  /* ── Styles ───────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 24,
  };

  const inputLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 8,
    display: 'block',
  };

  const hexInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px 10px 44px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 600,
    outline: 'none',
  };

  /* ── STUDIO gate ──────────────────────────────────── */
  if (!isStudio && !planInfo.isLoading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', width: '100%', padding: '60px 12px', textAlign: 'center', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{'\u{1F3A8}'}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
          {t('brand.title')}
        </h1>
        <p style={{ fontSize: 14, color: C.sub, marginBottom: 24, lineHeight: 1.6 }}>
          {t('brand.studioOnly')}
        </p>
        <div style={{
          ...cardStyle, marginBottom: 24,
          background: `linear-gradient(135deg, ${C.card}, ${C.accent}08)`,
          border: `1px solid ${C.accent}20`,
        }}>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>
            {t('brand.studioFeatures')}
          </div>
          <ul style={{ textAlign: 'left', fontSize: 13, color: C.text, lineHeight: 2, listStyle: 'none', padding: 0, margin: 0 }}>
            <li>&bull; {t('brand.feature.colors')}</li>
            <li>&bull; {t('brand.feature.logo')}</li>
            <li>&bull; {t('brand.feature.apply')}</li>
          </ul>
        </div>
        <button
          onClick={() => router.push('/billing')}
          style={{
            padding: '14px 32px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: `0 6px 24px ${C.accent}33`,
          }}
        >
          {t('brand.upgradeTo')} Studio
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', padding: '0 12px', boxSizing: 'border-box' }}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text, letterSpacing: '-0.02em' }}>
          {t('brand.title')}
        </h1>
        <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0' }}>
          {t('brand.subtitle')}
        </p>
      </div>

      {/* ── Colors section ──────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: C.text,
          textTransform: 'uppercase', letterSpacing: '0.01em', marginBottom: 20,
        }}>
          {t('brand.colors')}
        </div>

        <div className="tf-brand-colors-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {/* Primary color */}
          <div>
            <label style={inputLabelStyle}>{t('brand.primaryColor')}</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: 6,
                background: primaryColor, border: `1px solid ${C.border}`,
              }} />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={hexInputStyle}
                maxLength={7}
              />
            </div>
          </div>

          {/* Secondary color */}
          <div>
            <label style={inputLabelStyle}>{t('brand.secondaryColor')}</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: 6,
                background: secondaryColor, border: `1px solid ${C.border}`,
              }} />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                style={hexInputStyle}
                maxLength={7}
              />
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label style={inputLabelStyle}>{t('brand.accentColor')}</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: 6,
                background: accentColor, border: `1px solid ${C.border}`,
              }} />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={hexInputStyle}
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Color preview */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <div style={{ flex: 1, height: 40, borderRadius: 8, background: primaryColor }} />
          <div style={{ flex: 1, height: 40, borderRadius: 8, background: secondaryColor }} />
          <div style={{ flex: 1, height: 40, borderRadius: 8, background: accentColor }} />
        </div>
      </div>

      {/* ── Logo section ────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: C.text,
          textTransform: 'uppercase', letterSpacing: '0.01em', marginBottom: 16,
        }}>
          {t('brand.logo')}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleLogoUpload}
        />

        {logoUrl ? (
          <div className="tf-brand-logo-area" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 12,
              border: `1px solid ${C.border}`, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: C.surface,
            }}>
              <img
                src={logoUrl}
                alt={t('brand.logoAlt')}
                loading="lazy"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.text, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6,
                  display: 'block',
                }}
              >
                {t('brand.changeLogo')}
              </button>
              <button
                onClick={() => setLogoUrl(null)}
                style={{
                  background: 'none', border: 'none', color: C.dim,
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                {t('brand.removeLogo')}
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${C.border}`,
              borderRadius: 12,
              padding: '30px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color .15s',
              background: C.surface,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.2 }}>{'\u{1F3A8}'}</div>
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>
              {t('brand.uploadLogo')}
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
              {t('brand.logoFormats')}
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────── */}
      <div className="tf-brand-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={saving || saveMutation.isPending}
          style={{
            padding: '14px 32px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            opacity: saving ? 0.6 : 1,
            boxShadow: `0 6px 24px ${C.accent}33`,
            transition: 'all .15s',
          }}
        >
          {saving ? t('brand.saving') : t('brand.save')}
        </button>

        <button
          onClick={handleApplyToProject}
          style={{
            padding: '14px 24px', borderRadius: 12,
            border: `1px solid ${C.border}`, background: 'transparent',
            color: C.text, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s',
          }}
        >
          {t('brand.applyToProject')}
        </button>
      </div>
    </div>
  );
}
