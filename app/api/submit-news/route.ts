import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { title, content, summary, imageUrl, sourceName, sourceUrl } =
      await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // 1️⃣ Save to DB
    await query(
      `INSERT INTO submitted_article
       (title, content, summary, image_url, source_name, source_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, content, summary, imageUrl, sourceName, sourceUrl]
    );

    // 2️⃣ Send email to admin
    await sendEmail(
      'ai.chat.baban@gmail.com',
      `
New Article Submitted 🚀

Title: ${title}

Summary:
${summary || 'No summary provided'}

Source: ${sourceName || 'N/A'}
URL: ${sourceUrl || 'N/A'}

Content Preview:
${content.substring(0, 500)}...

Please review in admin panel.
      `
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}