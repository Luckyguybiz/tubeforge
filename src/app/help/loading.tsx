import { Skeleton } from '@/components/ui/Skeleton';

/** Help center loading skeleton — Apple editorial style */
export default function HelpLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1d1d1f' }}>
      {/* Header skeleton */}
      <div
        style={{
          borderBottom: '1px solid #e5e5ea',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Skeleton height={32} width={140} rounded />
        <Skeleton height={32} width={100} rounded />
      </div>

      {/* Hero / search section skeleton */}
      <div
        style={{
          padding: '56px 24px 36px',
          maxWidth: 700,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Skeleton height={40} width={240} />
        <Skeleton height={17} width={360} />
        <Skeleton height={52} width="100%" rounded style={{ maxWidth: 640, marginTop: 12 }} />
      </div>

      {/* Category tabs skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          padding: '0 24px 28px',
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={36} width={90 + i * 8} rounded />
        ))}
      </div>

      {/* Articles list skeleton */}
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '0 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5ea',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Skeleton height={36} width={36} rounded />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton height={15} width={`${70 - i * 4}%`} />
              <Skeleton height={13} width={`${50 - i * 3}%`} />
            </div>
            <Skeleton height={16} width={16} rounded />
          </div>
        ))}
      </div>
    </div>
  );
}
