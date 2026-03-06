import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const result = await query('SELECT * FROM admin_users WHERE username = $1', [
    username,
  ]);

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const user = result.rows[0];

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = generateToken({ id: user.id });

  return NextResponse.json({ token });
}