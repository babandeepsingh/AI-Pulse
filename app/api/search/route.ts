import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = searchParams.get('q');

  const result = await query(
    `
    SELECT DISTINCT a.*
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON t.id = at.tag_id
    WHERE LOWER(a.title) LIKE LOWER($1)
       OR LOWER(t.name) LIKE LOWER($1)
    ORDER BY a.created_at DESC
    `,
    [`%${term}%`]
  );

  return NextResponse.json(result.rows);
}
