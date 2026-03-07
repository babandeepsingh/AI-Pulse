import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || 10);
  const page = Number(searchParams.get('page') || 1);
  const offset = (page - 1) * limit
  const limitNum = Math.min(Number(limit), 50)
  const result = await query(
    `SELECT * FROM articles 
     WHERE is_published = true 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`, [limitNum, offset]
  );

  return NextResponse.json(result.rows);
}
