import { Skeleton } from '@/components/ui/Skeleton';

/** Blog page loading skeleton — Apple editorial style */
export default function BlogLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#1d1d1f',
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          padding: '48px 24px 32px',
          maxWidth: 980,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Skeleton height={40} width={120} />
        <Skeleton height={17} width={320} />
      </div>

      {/* Category pills skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          padding: '0 24px 48px',
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={36} width={80 + i * 12} rounded />
        ))}
      </div>

      {/* Blog cards grid skeleton */}
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: '0 24px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
          gap: 24,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5ea',
              borderRadius: 16,
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <Skeleton height={12} width={60} />
            <Skeleton height={21} width="90%" />
            <Skeleton height={15} width="100%" />
            <Skeleton height={15} width="75%" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <Skeleton height={13} width={100} />
              <Skeleton height={13} width={60} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
