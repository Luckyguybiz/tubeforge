'use client';

import { useState, useCallback, useRef } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';

type TabId = 'my' | 'stock';
type FilterType = 'all' | 'image' | 'video' | 'audio';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MediaLibrary() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const planInfo = usePlanLimits();

  const [tab, setTab] = useState<TabId>('my');
  const [search, setSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [stockQuery, setStockQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Queries ──────────────────────────────────────── */
  const assets = trpc.media.list.useQuery(
    { search: search || undefined, type: filterType, page, limit: 30 },
    { enabled: tab === 'my' },
  );

  const storage = trpc.media.storageStats.useQuery(undefined, {
    enabled: tab === 'my',
  });

  const stockResults = trpc.stock.searchPhotos.useQuery(
    { query: stockQuery, page: stockPage, perPage: 20 },
    { enabled: tab === 'stock' && stockQuery.length > 0 },
  );

  const createAsset = trpc.asset.create.useMutation({
    onSuccess: () => {
      toast.success(t('media.uploadSuccess'));
      assets.refetch();
      storage.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAsset = trpc.asset.delete.useMutation({
    onSuccess: () => {
      toast.success(t('media.deleteSuccess'));
      assets.refetch();
      storage.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  /* ── Handlers ─────────────────────────────────────── */
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        toast.error(data.error || t('media.uploadError'));
        return;
      }

      createAsset.mutate({
        url: data.url,
        filename: file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
      });
    } catch {
      toast.error(t('media.uploadError'));
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [createAsset, t]);

  const handleStockSearch = useCallback(() => {
    if (stockSearch.trim()) {
      setStockQuery(stockSearch.trim());
      setStockPage(1);
    }
  }, [stockSearch]);

  const handleAddStockToProject = useCallback((photoUrl: string, photographer: string) => {
    toast.success(`${t('media.stockAdded')} (${photographer})`);
    // In a real implementation, this would save the URL to the current project/scene
    void photoUrl;
  }, [t]);

  /* ── Styles ───────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 20,
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: 10,
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}12` : 'transparent',
    color: active ? C.accent : C.sub,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .15s',
  });

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 8,
    border: 'none',
    background: active ? `${C.accent}15` : 'transparent',
    color: active ? C.accent : C.dim,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const storagePercent = storage.data
    ? Math.min(100, Math.round((storage.data.usedBytes / storage.data.totalBytes) * 100))
    : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 12px', boxSizing: 'border-box' }}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text, letterSpacing: '-0.02em' }}>
            {t('media.title')}
          </h1>
          <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0' }}>
            {t('media.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={createAsset.isPending}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: createAsset.isPending ? 'wait' : 'pointer',
              fontFamily: 'inherit', transition: 'all .15s',
              opacity: createAsset.isPending ? 0.6 : 1,
            }}
          >
            {createAsset.isPending ? t('media.uploading') : t('media.upload')}
          </button>
        </div>
      </div>

      {/* ── Storage bar ─────────────────────────────── */}
      {storage.data && (
        <div style={{ ...cardStyle, marginBottom: 20, padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>
              {t('media.storageUsed')}: {formatBytes(storage.data.usedBytes)} {t('media.of')} {formatBytes(storage.data.totalBytes)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.dim }}>
              {storage.data.fileCount} {t('media.files')}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.surface, overflow: 'hidden' }}>
            <div style={{
              width: `${storagePercent}%`,
              height: '100%',
              borderRadius: 3,
              background: storagePercent > 90 ? C.accent : storagePercent > 70 ? C.orange : `linear-gradient(90deg, ${C.accent}, ${C.blue})`,
              transition: 'width .4s ease',
            }} />
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabBtnStyle(tab === 'my')} onClick={() => setTab('my')}>
          {t('media.myFiles')}
        </button>
        <button style={tabBtnStyle(tab === 'stock')} onClick={() => setTab('stock')}>
          {t('media.stockPhotos')}
        </button>
      </div>

      {/* ── My Files Tab ────────────────────────────── */}
      {tab === 'my' && (
        <>
          {/* Search + filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('media.searchPlaceholder')}
              style={{
                flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 13, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'image', 'video', 'audio'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  style={filterBtnStyle(filterType === f)}
                  onClick={() => { setFilterType(f); setPage(1); }}
                >
                  {t(`media.filter.${f}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Assets grid */}
          {assets.isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ ...cardStyle, padding: 0, height: 200, background: C.surface }} />
              ))}
            </div>
          ) : assets.data && assets.data.items.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {assets.data.items.map((asset) => (
                  <div
                    key={asset.id}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'border-color .15s',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      aspectRatio: '4/3',
                      background: C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {asset.type === 'image' && asset.url ? (
                        <img
                          src={asset.url}
                          alt={asset.filename}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <span style={{ fontSize: 28, opacity: 0.2 }}>
                          {asset.type === 'video' ? '\u{1F3AC}' : asset.type === 'audio' ? '\u{1F3B5}' : '\u{1F4C4}'}
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: C.text,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: 4,
                      }}>
                        {asset.filename}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: C.dim }}>
                          {formatBytes(asset.size)} &middot; {formatDate(asset.createdAt)}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(t('media.confirmDelete'))) {
                              deleteAsset.mutate({ id: asset.id });
                            }
                          }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 14, color: C.dim, padding: '2px 4px',
                            fontFamily: 'inherit', transition: 'color .15s',
                          }}
                          title={t('media.delete')}
                        >
                          &#10005;
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {assets.data.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                      background: 'transparent', color: page <= 1 ? C.dim : C.text,
                      fontSize: 12, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', opacity: page <= 1 ? 0.5 : 1,
                    }}
                  >
                    {t('media.prev')}
                  </button>
                  <span style={{ padding: '8px 12px', fontSize: 12, color: C.sub, fontWeight: 600 }}>
                    {page} / {assets.data.pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(assets.data!.pages, page + 1))}
                    disabled={page >= assets.data.pages}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                      background: 'transparent', color: page >= assets.data.pages ? C.dim : C.text,
                      fontSize: 12, fontWeight: 600, cursor: page >= assets.data.pages ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', opacity: page >= assets.data.pages ? 0.5 : 1,
                    }}
                  >
                    {t('media.next')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              ...cardStyle,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>{'\u{1F4C1}'}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                {search ? t('media.noResults') : t('media.empty')}
              </div>
              <div style={{ fontSize: 13, color: C.sub, maxWidth: 300 }}>
                {search ? t('media.tryAnotherSearch') : t('media.emptyHint')}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Stock Photos Tab ────────────────────────── */}
      {tab === 'stock' && (
        <>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              type="text"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStockSearch(); }}
              placeholder={t('media.stockSearchPlaceholder')}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 13, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={handleStockSearch}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: C.accent, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('media.search')}
            </button>
          </div>

          {/* Attribution */}
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 16 }}>
            {t('media.poweredByPexels')}
          </div>

          {/* Stock results */}
          {stockResults.isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ ...cardStyle, padding: 0, height: 200, background: C.surface }} />
              ))}
            </div>
          ) : stockResults.data?.note ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 14, color: C.sub }}>{stockResults.data.note}</div>
            </div>
          ) : stockResults.data && stockResults.data.photos.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {stockResults.data.photos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                      <img
                        src={photo.src.medium}
                        alt={photo.alt}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>
                        {t('media.photoBy')}{' '}
                        <a
                          href={photo.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: C.accent, textDecoration: 'none' }}
                        >
                          {photo.photographer}
                        </a>
                      </div>
                      <button
                        onClick={() => handleAddStockToProject(photo.src.large, photo.photographer)}
                        style={{
                          width: '100%', padding: '7px 0', borderRadius: 8,
                          border: `1px solid ${C.border}`, background: 'transparent',
                          color: C.text, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                        }}
                      >
                        {t('media.addToProject')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stock pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                <button
                  onClick={() => setStockPage(Math.max(1, stockPage - 1))}
                  disabled={stockPage <= 1}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                    background: 'transparent', color: stockPage <= 1 ? C.dim : C.text,
                    fontSize: 12, fontWeight: 600, cursor: stockPage <= 1 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: stockPage <= 1 ? 0.5 : 1,
                  }}
                >
                  {t('media.prev')}
                </button>
                <span style={{ padding: '8px 12px', fontSize: 12, color: C.sub, fontWeight: 600 }}>
                  {t('media.page')} {stockPage}
                </span>
                <button
                  onClick={() => setStockPage(stockPage + 1)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.text,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {t('media.next')}
                </button>
              </div>
            </>
          ) : stockQuery ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 14, color: C.sub }}>{t('media.noStockResults')}</div>
            </div>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>{'\u{1F50D}'}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                {t('media.stockHint')}
              </div>
              <div style={{ fontSize: 13, color: C.sub }}>
                {t('media.stockHintDesc')}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
