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
