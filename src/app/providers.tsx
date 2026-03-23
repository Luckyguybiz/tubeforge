'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import { trpc, getTRPCClient } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,  // 5 minutes
        gcTime: 10 * 60 * 1000,    // 10 minutes
        retry: (failureCount, error) => {
          // Don't retry on auth, forbidden, or rate-limit errors
          const trpcData = (error as unknown as { data?: { httpStatus?: number; code?: string } })?.data;
          const status = trpcData?.httpStatus;
          // Session expired — redirect to login
          if (status === 401 || trpcData?.code === 'UNAUTHORIZED') {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
              window.location.href = '/auth/signin';
            }
            return false;
          }
          if (status === 403 || status === 429) return false;
          if (trpcData?.code === 'TOO_MANY_REQUESTS') return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false, // Never retry mutations automatically
        onError: (error: unknown) => {
          const trpcError = error as { message?: string; data?: { code?: string }; cause?: { code?: string } };
          const code = trpcError.data?.code ?? trpcError.cause?.code;
          const message = trpcError.message ?? '';

          // Rate limit — user-friendly toast instead of raw error
          if (code === 'TOO_MANY_REQUESTS' || message.toLowerCase().includes('too many request')) {
            toast.warning('Please wait a moment before trying again.');
            return;
          }

          // Network / connection failures
          if (
            message.includes('Failed to fetch') ||
            message.includes('NetworkError') ||
            message.includes('Load failed') ||
            message.includes('ECONNREFUSED')
          ) {
            toast.error('Network error — please check your connection and retry.');
            return;
          }

          // Auth errors — redirect to login
          if (code === 'UNAUTHORIZED' || message.includes('UNAUTHORIZED')) {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
              window.location.href = '/auth/signin';
            }
            return;
          }

          if (message) {
            console.error('[mutation error]', message);
            toast.error(message);
          }
        },
      },
    },
  }));
  const [trpcClient] = useState(() => getTRPCClient());

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
