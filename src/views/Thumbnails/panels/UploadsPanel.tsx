'use client';

import { useRef, useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { Skeleton } from '@/components/ui';
import { MAX_UPLOAD_SIZE } from '@/lib/constants';

export function UploadsPanel() {
  const C = useThemeStore((s) => s.theme);
  const addImage = useThumbnailStore((s) => s.addImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const assets = trpc.asset.list.useQuery({ page: 1, limit: 50 });
  const createAsset = trpc.asset.create.useMutation({
    onSuccess: () => assets.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const deleteAsset = trpc.asset.delete.useMutation({
    onSuccess: () => assets.refetch(),
    onError: (err) => toast.error(err.message),
  });

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Поддерживаются только изображения (PNG, JPG, WebP)');
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error('Файл слишком большой. Максимум 10 МБ.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) { toast.error('Ошибка загрузки'); return; }
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.url) {
        await createAsset.mutateAsync({
          url: data.url,
          filename: file.name,
          type: file.type,
          size: file.size,
        });
      }
    } catch (err) {
      toast.error('Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(uploadFile);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    Array.from(files).forEach(uploadFile);
  };

  const handleAddToCanvas = (url: string) => {
    addImage(url);
  };

  const handleDragStart = (e: React.DragEvent, url: string) => {
    e.dataTransfer.setData('text/uri-list', url);
    e.dataTransfer.setData('application/x-tubeforge-asset', url);
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Загрузить изображение. Перетащите файл или нажмите"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
        style={{
          border: `2px dashed ${dragOver ? C.accent : C.border}`,
          borderRadius: 10,
          padding: '28px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? `${C.accent}0a` : 'transparent',
          transition: 'all .15s',
          marginBottom: 14,
        }}
      >
        <div style={{ marginBottom: 6, opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
          {uploading ? <span style={{ fontSize: 24 }}>...</span> : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
        </div>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>
          {uploading ? 'Загрузка...' : 'Перетащите или нажмите'}
        </div>
        <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>
          PNG, JPG, WebP до 10 МБ
        </div>
      </div>

      {/* Assets grid */}
      {assets.isError ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: C.dim, fontSize: 12 }}>
          <div style={{ marginBottom: 8, opacity: 0.3, display: 'flex', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <div style={{ marginBottom: 10, color: C.accent }}>Не удалось загрузить ассеты</div>
          <button
            onClick={() => assets.refetch()}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Повторить
          </button>
        </div>
      ) : assets.isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height="80px" rounded />
          ))}
        </div>
      ) : assets.data && assets.data.items.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {assets.data.items.map((asset) => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => handleDragStart(e, asset.url)}
              onClick={() => handleAddToCanvas(asset.url)}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                border: `1px solid ${C.border}`,
                cursor: 'pointer',
                aspectRatio: '1',
                background: C.surface,
              }}
            >
              <img
                src={asset.url}
                alt={asset.filename}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAsset.mutate({ id: asset.id });
                }}
                title="Удалить"
                aria-label={`Удалить ${asset.filename}`}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: 'none',
                  background: 'rgba(0,0,0,.6)',
                  color: '#fff',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity .15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
              >
                &times;
              </button>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,.6))',
                padding: '12px 6px 4px',
                fontSize: 9,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {asset.filename}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: C.dim, fontSize: 12 }}>
          <div style={{ marginBottom: 8, opacity: 0.3, display: 'flex', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
          <div style={{ marginBottom: 10 }}>Нет загруженных изображений</div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Загрузить
          </button>
        </div>
      )}
    </div>
  );
}
