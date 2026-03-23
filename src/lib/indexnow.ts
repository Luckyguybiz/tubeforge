/**
 * IndexNow API utility — automatic URL submission to search engines.
 *
 * IndexNow is a protocol that allows website owners to instantly notify
 * search engines (Bing, Yandex, Seznam, Naver, etc.) about content changes.
 *
 * Usage:
 *   import { submitToIndexNow } from '@/lib/indexnow';
 *   submitToIndexNow(['https://tubeforge.co/blog/new-post']);
 *
 * This is fire-and-forget: errors are logged but never thrown.
 */

import { createLogger } from '@/lib/logger';

const log = createLogger('indexnow');

/** Fixed IndexNow API key (must match /public/indexnow-key.txt) */
const INDEXNOW_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';

const HOST = 'tubeforge.co';
const KEY_LOCATION = `https://${HOST}/indexnow-key.txt`;

/**
 * IndexNow API endpoints to submit to.
 * Submitting to api.indexnow.org propagates to all participating engines,
 * but we also submit directly to Bing for faster indexing.
 */
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
] as const;

/**
 * Submit URLs to IndexNow for instant search engine indexing.
 *
 * Fire-and-forget: logs errors but never throws.
 *
 * @param urls - Array of fully-qualified URLs to submit (max 10,000 per call)
 */
export function submitToIndexNow(urls: string[]): void {
  if (!urls.length) {
    log.debug('No URLs to submit, skipping');
    return;
  }

  // Filter to only URLs on our host
  const validUrls = urls.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname === HOST;
    } catch {
      log.warn('Invalid URL skipped', { url });
      return false;
    }
  });

  if (!validUrls.length) {
    log.warn('No valid URLs after filtering', { originalCount: urls.length });
    return;
  }

  log.info('Submitting URLs to IndexNow', { count: validUrls.length });

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: validUrls,
  };

  // Submit to all endpoints in parallel (fire-and-forget)
  for (const endpoint of ENDPOINTS) {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    })
      .then((res) => {
        if (res.ok || res.status === 202) {
          log.info('IndexNow submission accepted', {
            endpoint,
            status: res.status,
            urlCount: validUrls.length,
          });
        } else {
          log.warn('IndexNow submission rejected', {
            endpoint,
            status: res.status,
            statusText: res.statusText,
          });
        }
      })
      .catch((err: unknown) => {
        log.error('IndexNow submission failed', {
          endpoint,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  }
}
