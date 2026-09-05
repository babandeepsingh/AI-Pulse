import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { isPushConfigured, sendPushToAll } from '@/lib/push';

export const dynamic = 'force-dynamic';

function authorize(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return 'Unauthorized';
  try {
    verifyToken(token);
    return null;
  } catch {
    return 'Invalid token';
  }
}

// ── GET /api/push/test ───────────────────────────────────────────────────────
// Reports whether push is wired up on THIS deployment, and how many
// subscriptions the database holds.
export async function GET(req: Request) {
  const error = authorize(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const counts = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE is_active)::int AS active
     FROM push_subscriptions`
  );

  const recent = await query(
    `SELECT endpoint, is_active, created_at
     FROM push_subscriptions
     ORDER BY created_at DESC
     LIMIT 5`
  );

  return NextResponse.json({
    vapidConfigured: isPushConfigured(),
    subscriptions: counts.rows[0],
    recent: recent.rows.map((r: any) => ({
      // Endpoint host identifies the push service (Apple, Google, Mozilla).
      service: (() => {
        try {
          return new URL(r.endpoint).host;
        } catch {
          return 'unknown';
        }
      })(),
      isActive: r.is_active,
      createdAt: r.created_at,
    })),
  });
}

// ── POST /api/push/test ──────────────────────────────────────────────────────
// Sends a test notification to every active subscription.
export async function POST(req: Request) {
  const error = authorize(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const result = await sendPushToAll({
    title: 'AI News test',
    body: 'If you can see this, push notifications are working.',
    url: '/',
    tag: 'push-test',
  });

  return NextResponse.json(result);
}
