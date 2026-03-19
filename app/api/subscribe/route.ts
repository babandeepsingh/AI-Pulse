import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  const { email } = await req.json();

  await query(
    `
    INSERT INTO subscribers (email)
    VALUES ($1)
    ON CONFLICT (email)
    DO UPDATE SET is_active = true
    `,
    [email]
  );

  return NextResponse.json({ message: 'Subscribed successfully' });
}


// ── DELETE /api/subscribe ─────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  const { email } = await req.json();
 
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
  }
 
  const result = await query(
    `UPDATE subscribers
     SET is_active = false
     WHERE email = $1
     RETURNING email`,
    [email]
  );
 
  if (result.rows.length === 0) {
    return NextResponse.json({ message: 'Email not found' }, { status: 404 });
  }
 
  return NextResponse.json({ message: 'Unsubscribed successfully' });
}
 
// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}