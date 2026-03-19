import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateSummary } from '@/lib/openai';
import { sendEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Fetch today's articles
  const articles = await query(
    `SELECT * FROM articles WHERE DATE(created_at) = CURRENT_DATE`
  );

  if (articles.rows.length === 0) {
    return NextResponse.json({ message: 'No news today' });
  }

  const combined = articles.rows.map((a: { content: string }) => a.content).join('\n\n');

  // 2. Generate structured digest (subject + html + plaintext)
  const digest = await generateSummary(combined);

  // 3. Persist the plain-text version to DB
  await query(
    `INSERT INTO daily_summaries (summary_date, summary_content)
     VALUES (CURRENT_DATE, $1)
     ON CONFLICT (summary_date) DO UPDATE SET summary_content = EXCLUDED.summary_content
     RETURNING *`,
    [digest.plainText]
  );

  // 4. Send to all active subscribers
  const subscribers = await query(
    'SELECT email FROM subscribers WHERE is_active = true'
  );

  const results = await Promise.allSettled(
    subscribers.rows.map((sub: { email: string }) => sendEmail(sub.email, digest))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({
    success: true,
    subject: digest.subject,
    articles: articles.rows.length,
    emails: { sent: succeeded, failed },
  });
}