import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface BrowserSubscription {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

function readSubscription(payload: any): BrowserSubscription | null {
  const sub = payload?.subscription ?? payload;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return null;
  return sub;
}

// ── POST /api/push/subscribe ─────────────────────────────────────────────────
export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const subscription = readSubscription(payload);
  if (!subscription) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await query(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE
       SET p256dh = EXCLUDED.p256dh,
           auth = EXCLUDED.auth,
           user_agent = EXCLUDED.user_agent,
           is_active = true,
           updated_at = NOW()`,
    [
      subscription.endpoint,
      subscription.keys!.p256dh,
      subscription.keys!.auth,
      req.headers.get('user-agent'),
    ]
  );

  return NextResponse.json({ success: true });
}

// ── DELETE /api/push/subscribe ───────────────────────────────────────────────
export async function DELETE(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const endpoint = payload?.endpoint ?? payload?.subscription?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await query(
    `UPDATE push_subscriptions
     SET is_active = false, updated_at = NOW()
     WHERE endpoint = $1`,
    [endpoint]
  );

  return NextResponse.json({ success: true });
}
