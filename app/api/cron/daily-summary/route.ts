import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateSummary } from '@/lib/openai';
import { sendEmail } from '@/lib/mailer';

export async function GET() {
  const articles = await query(
    `SELECT * FROM articles 
     WHERE DATE(created_at) = CURRENT_DATE`
  );

  if (articles.rows.length === 0) {
    return NextResponse.json({ message: 'No news today' });
  }

  const combined = articles.rows.map((a) => a.content).join('\n\n');

  const summary = await generateSummary(combined);

  const summaryInsert = await query(
    `INSERT INTO daily_summaries (summary_date, summary_content)
     VALUES (CURRENT_DATE, $1)
     RETURNING *`,
    [summary]
  );

  const subscribers = await query(
    'SELECT * FROM subscribers WHERE is_active = true'
  );

  for (const sub of subscribers.rows) {
    await sendEmail(sub.email, summary ||'');
  }

  return NextResponse.json({ success: true });
}
