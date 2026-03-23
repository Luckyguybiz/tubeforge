'use client';
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        fetch(url, options) {
          const timeout = AbortSignal.timeout(120_000);
          const signal = options?.signal
            ? AbortSignal.any([options.signal, timeout])
            : timeout;
          return fetch(url, { ...options, signal });
        },
      }),
    ],
  });
}
