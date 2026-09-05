import webpush from 'web-push';
import { query } from '@/lib/db';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  image?: string;
  tag?: string;
}

let configured = false;

/**
 * Lazily configure web-push. Returns false when VAPID keys are missing so the
 * caller can skip sending instead of throwing inside an admin request.
 */
function configure(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) return false;

  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:ai.chat.baban@gmail.com',
      publicKey,
      privateKey
    );
    configured = true;
  }

  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/**
 * Sends a notification to every active subscription. Endpoints the push
 * service reports as gone (404/410) are deactivated so they are not retried.
 */
export async function sendPushToAll(payload: PushPayload) {
  if (!configure()) {
    console.warn('[push] VAPID keys are not configured — skipping push send');
    return { sent: 0, failed: 0, removed: 0, skipped: true as const };
  }

  const subscribers = await query(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE is_active = true'
  );

  if (subscribers.rows.length === 0) {
    return { sent: 0, failed: 0, removed: 0, skipped: false as const };
  }

  const body = JSON.stringify(payload);
  const stale: string[] = [];
  const errors: { endpoint: string; statusCode?: number; message: string }[] = [];

  const results = await Promise.allSettled(
    subscribers.rows.map((row: { endpoint: string; p256dh: string; auth: string }) =>
      webpush
        .sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body,
          { TTL: 24 * 60 * 60 }
        )
        .catch((err: any) => {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            stale.push(row.endpoint);
          }
          errors.push({
            endpoint: row.endpoint.slice(0, 60) + '…',
            statusCode: err?.statusCode,
            message: String(err?.body || err?.message || err).slice(0, 200),
          });
          throw err;
        })
    )
  );

  if (stale.length > 0) {
    await query(
      'UPDATE push_subscriptions SET is_active = false, updated_at = NOW() WHERE endpoint = ANY($1::text[])',
      [stale]
    );
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - sent;

  return { sent, failed, removed: stale.length, skipped: false as const, errors };
}

/**
 * Fire-and-forget wrapper: a push failure must never fail the admin request
 * that published the article.
 */
export async function notifyNewArticle(article: {
  id?: number | string;
  title: string;
  summary?: string | null;
  slug?: string | null;
  image_url?: string | null;
}) {
  try {
    const url = article.id ? `/article/${article.id}` : '/';
    const result = await sendPushToAll({
      title: 'New on AI News',
      body: article.title,
      url,
      image: article.image_url || undefined,
      tag: `article-${article.id ?? 'new'}`,
    });
    console.log('[push] new article notification', result);
    return result;
  } catch (err) {
    console.error('[push] failed to notify subscribers', err);
    return null;
  }
}
