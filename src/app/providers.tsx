'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import { trpc, getTRPCClient } from '@/lib/trpc';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,  // 5 minutes
        gcTime: 10 * 60 * 1000,    // 10 minutes
        retry: (failureCount, error) => {
          // Don't retry on auth or forbidden errors — redirect to login instead
          const status = (error as unknown as { data?: { httpStatus?: number } })?.data?.httpStatus;
          if (status === 401 || status === 403) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false, // Никогда не повторять мутации автоматически
        onError: (error: unknown) => {
          // Логировать только неожиданные ошибки, не перенаправления по авторизации
          const message = (error as { message?: string })?.message;
          if (message && !message.includes('UNAUTHORIZED')) {
            console.error('[mutation error]', message);
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
