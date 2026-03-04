import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    verifyToken(token);

    const id = parseInt(params.id);

    // Get the submitted article
    const res = await query('SELECT * FROM submitted_article WHERE id=$1', [id]);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const article = res.rows[0];

    // Move to articles table
    await query(
      `INSERT INTO articles (title, content, summary, image_url, source_name, source_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [article.title, article.content, article.summary, article.image_url, article.source_name, article.source_url]
    );

    // Optionally delete from submitted
    await query('DELETE FROM submitted_article WHERE id=$1', [id]);

    // Send email to admin
    await sendEmail(
      'ai.chat.baban@gmail.com',
      `Article Approved: ${article.title}\n\nIt has been moved to the main articles table.`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}