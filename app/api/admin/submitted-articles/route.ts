// app/api/admin/submitted-articles/route.ts
export const dynamic = 'force-dynamic'; // ⚡ tells Next.js this route is dynamic

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Extract token from Authorization header
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verifyToken(token); // throws if invalid

    const articles = await query(
      'SELECT * FROM submitted_article ORDER BY created_at DESC'
    );

    return NextResponse.json(articles.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}