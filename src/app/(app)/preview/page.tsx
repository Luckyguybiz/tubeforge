'use client';
import { Suspense, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

const PreviewSave = dynamic(
  () => import('@/views/Preview/PreviewSave').then((m) => ({ default: m.PreviewSave })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

const Metadata = dynamic(
  () => import('@/views/Metadata/Metadata').then((m) => ({ default: m.Metadata })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

const ContentPlanner = dynamic(
  () => import('@/views/Tools/ContentPlanner').then((m) => ({ default: m.ContentPlanner })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

type TabId = 'preview' | 'seo' | 'planner';

const TABS: { id: TabId; icon: string }[] = [
  { id: 'preview', icon: '\uD83C\uDFAC' },
  { id: 'seo', icon: '\uD83D\uDD0D' },
  { id: 'planner', icon: '\uD83D\uDCC5' },
];

const TAB_LABEL_KEYS: Record<TabId, string> = {
  preview: 'publish.tabPreview',
  seo: 'publish.tabSeo',
  planner: 'publish.tabPlanner',
};

function isValidTab(val: string | null): val is TabId {
  return val === 'preview' || val === 'seo' || val === 'planner';
}

function PublishContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const projectId = searchParams.get('projectId');
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<TabId>(isValidTab(tabParam) ? tabParam : 'preview');

  const switchTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/preview?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  return (
    <div>
      {/* Tab pills */}
      <div
        className="tf-publish-tabs"
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 24,
          padding: 4,
          borderRadius: 12,
          background: C.surface,
          border: `1px solid ${C.border}`,
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              style={{
                padding: '8px 20px',
                borderRadius: 9,
                border: isActive ? 'none' : `1px solid transparent`,
                background: isActive ? '#6366f1' : 'transparent',
                color: isActive ? '#fff' : C.dim,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .2s ease',
                letterSpacing: '-.01em',
              }}
            >
              {tab.icon} {t(TAB_LABEL_KEYS[tab.id])}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'preview' && <PreviewSave projectId={projectId} />}
      {activeTab === 'seo' && <Metadata projectId={projectId} />}
      {activeTab === 'planner' && <ContentPlanner />}
    </div>
  );
}

export default function PublishPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <PublishContent />
      </Suspense>
    </ErrorBoundary>
  );
}
