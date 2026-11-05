// IndexNow (https://www.indexnow.org) — tells Bing, Yandex, Seznam, Naver etc.
// that URLs changed. The key is public by design: it is served from
// /public/<key>.txt so search engines can verify site ownership.
import { SITE_URL } from '@/lib/site';

// Must match the filename and contents of public/<key>.txt.
export const INDEXNOW_KEY = 'ace67c80488da5c51604e54a04045b98';
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';

export async function pingIndexNow(urls: string[]) {
  if (process.env.INDEXNOW_DISABLED === '1' || process.env.NODE_ENV !== 'production') {
    return { skipped: true as const };
  }
  // Preview deployments must not report production URLs as changed.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { skipped: true as const };
  }

  const urlList = Array.from(new Set(urls.filter(Boolean)));
  if (urlList.length === 0) return { skipped: true as const };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok && res.status !== 202) {
      console.warn('[indexnow] ping failed', res.status, await res.text().catch(() => ''));
    }
    return { skipped: false as const, status: res.status };
  } catch (err) {
    console.warn('[indexnow] ping error', (err as Error).message);
    return { skipped: false as const, error: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
