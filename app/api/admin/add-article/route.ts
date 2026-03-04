import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { title, content, summary, tags, imageUrl, sourceName, sourceUrl } =
    await req.json();

  const slug = title.toLowerCase().replace(/\s+/g, '-');

  const article = await query(
    `INSERT INTO articles 
     (title, content, summary, slug, image_url, source_name, source_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title, content, summary, slug, imageUrl, sourceName, sourceUrl]
  );

  const articleId = article.rows[0].id;

  for (const tagName of tags) {
    const tagRes = await query(
      'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id',
      [tagName]
    );

    await query(
      'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2)',
      [articleId, tagRes.rows[0].id]
    );
  }

  return NextResponse.json({ success: true });
}
