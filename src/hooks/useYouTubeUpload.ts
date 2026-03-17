import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export function useYouTubeUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const initUpload = trpc.youtube.uploadVideo.useMutation();

  const upload = async (params: {
    title: string;
    description?: string;
    tags?: string[];
    videoUrl: string;
    thumbnailUrl?: string;
    privacyStatus?: 'public' | 'private' | 'unlisted';
  }) => {
    setStatus('uploading');
    try {
      const result = await initUpload.mutateAsync(params);
      setStatus('done');
      toast.success('Видео загружено на YouTube');
      return result.uploadUrl;
    } catch (err) {
      setStatus('error');
      toast.error('Ошибка загрузки на YouTube');
      return null;
    }
  };

  return { upload, status, isUploading: status === 'uploading' };
}
