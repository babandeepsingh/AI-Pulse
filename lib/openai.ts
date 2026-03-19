import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NewsDigest {
  subject: string;
  htmlBody: string;
  plainText: string;
}

export async function generateSummary(content: string): Promise<NewsDigest> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert news editor for a professional daily news digest service at news.babandeep.in.

Your task is to transform raw news content into a polished daily briefing. Respond ONLY with valid JSON in exactly this structure:
{
  "subject": "...",
  "sections": [
    {
      "headline": "...",
      "summary": "...",
      "category": "..."
    }
  ],
  "closing": "..."
}

Rules:
- "subject": A compelling, specific email subject line (max 60 chars). Examples: "Markets Tumble, AI Breakthrough, Geopolitical Shifts — Your Briefing", "5 Stories Shaping the World Today"
- "sections": Array of 3-6 key stories, each with:
  - "headline": Crisp, journalistic headline (max 80 chars)
  - "summary": 2-3 sentence professional summary of the story
  - "category": One of: World, Business, Technology, Science, Politics, Health, Culture
- "closing": One forward-looking sentence teasing what to watch tomorrow (max 120 chars)

Tone: Authoritative, neutral, concise. No filler phrases like "In today's fast-paced world."`,
      },
      {
        role: 'user',
        content: `Summarize the following news content into a structured daily digest:\n\n${content}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{}';
  const parsed = JSON.parse(raw);

  const { subject, sections = [], closing = '' } = parsed;

  const htmlBody = buildEmailHtml(sections, closing);
  const plainText = buildPlainText(subject, sections, closing);

  return { subject, htmlBody, plainText };
}

// ─── HTML Email Template ──────────────────────────────────────────────────────

interface Section {
  headline: string;
  summary: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  World:      '#2563EB',
  Business:   '#059669',
  Technology: '#7C3AED',
  Science:    '#0891B2',
  Politics:   '#DC2626',
  Health:     '#D97706',
  Culture:    '#DB2777',
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? '#6B7280';
}

function buildEmailHtml(sections: Section[], closing: string): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const storiesHtml = sections.map((s) => {
    const color = categoryColor(s.category);
    return `
      <tr>
        <td style="padding: 0 0 28px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <span style="
                  display: inline-block;
                  background-color: ${color}18;
                  color: ${color};
                  font-family: 'Georgia', 'Times New Roman', serif;
                  font-size: 10px;
                  font-weight: 700;
                  letter-spacing: 1.5px;
                  text-transform: uppercase;
                  padding: 3px 10px;
                  border-radius: 2px;
                  border-left: 3px solid ${color};
                ">${s.category}</span>
              </td>
            </tr>
            <tr>
              <td style="
                font-family: 'Georgia', 'Times New Roman', serif;
                font-size: 18px;
                font-weight: 700;
                color: #111827;
                line-height: 1.35;
                padding-bottom: 8px;
              ">${s.headline}</td>
            </tr>
            <tr>
              <td style="
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 15px;
                color: #4B5563;
                line-height: 1.7;
              ">${s.summary}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 28px;">
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;" />
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daily News Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Helvetica Neue', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F4F6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
              padding: 36px 40px 32px;
              border-radius: 8px 8px 0 0;
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="https://news.babandeep.in" style="text-decoration: none;">
                      <span style="
                        font-family: 'Georgia', 'Times New Roman', serif;
                        font-size: 26px;
                        font-weight: 700;
                        color: #F8FAFC;
                        letter-spacing: -0.5px;
                      ">AI News</span>
                      <span style="
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                        font-size: 12px;
                        color: #64748B;
                        display: block;
                        margin-top: 3px;
                        letter-spacing: 0.5px;
                      ">news.babandeep.in</span>
                    </a>
                  </td>
                  <td align="right" style="vertical-align: bottom;">
                    <span style="
                      font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 12px;
                      color: #94A3B8;
                      letter-spacing: 0.3px;
                    ">${today}</span>
                  </td>
                </tr>
              </table>
              <!-- Thin accent bar -->
              <div style="height: 2px; background: linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899); margin-top: 20px; border-radius: 1px;"></div>
            </td>
          </tr>

          <!-- ── INTRO STRIP ── -->
          <tr>
            <td style="background-color: #1E293B; padding: 14px 40px;">
              <p style="
                margin: 0;
                font-family: 'Georgia', 'Times New Roman', serif;
                font-size: 14px;
                font-style: italic;
                color: #94A3B8;
                letter-spacing: 0.2px;
              ">Your curated briefing — what matters today, nothing that doesn't.</p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 36px 40px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${storiesHtml}
              </table>
            </td>
          </tr>

          <!-- ── CLOSING ── -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 0 40px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="
                    background-color: #F8FAFC;
                    border-left: 4px solid #3B82F6;
                    padding: 16px 20px;
                    border-radius: 0 4px 4px 0;
                  ">
                    <p style="
                      margin: 0;
                      font-family: 'Georgia', 'Times New Roman', serif;
                      font-size: 14px;
                      font-style: italic;
                      color: #374151;
                      line-height: 1.6;
                    ">👀 <strong>Watch tomorrow:</strong> ${closing}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CTA BUTTON ── -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 0 40px 36px;" align="center">
              <a href="https://news.babandeep.in" style="
                display: inline-block;
                background: linear-gradient(135deg, #1D4ED8, #4F46E5);
                color: #FFFFFF;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                font-weight: 600;
                letter-spacing: 0.3px;
                text-decoration: none;
                padding: 13px 32px;
                border-radius: 6px;
              ">Read Full Coverage →</a>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="
              background-color: #F9FAFB;
              border-top: 1px solid #E5E7EB;
              padding: 24px 40px;
              border-radius: 0 0 8px 8px;
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="
                      margin: 0 0 6px;
                      font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 12px;
                      color: #9CA3AF;
                    ">
                      You're receiving this because you subscribed to AI News.
                    </p>
                    <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9CA3AF;">
                      <a href="https://news.babandeep.in" style="color: #6B7280; text-decoration: underline;">Visit site</a>
                      &nbsp;·&nbsp;
                      <a href="https://news.babandeep.in/unsubscribe" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                  <td align="right">
                    <span style="
                      font-family: 'Georgia', 'Times New Roman', serif;
                      font-size: 18px;
                      font-weight: 700;
                      color: #D1D5DB;
                    ">AI news</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

function buildPlainText(subject: string, sections: Section[], closing: string): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const stories = sections.map((s, i) =>
    `${i + 1}. [${s.category.toUpperCase()}] ${s.headline}\n${s.summary}`
  ).join('\n\n');

  return `AI News — ${today}
news.babandeep.in
${'─'.repeat(50)}

${subject}

${stories}

${'─'.repeat(50)}
Watch tomorrow: ${closing}

Read the full coverage at https://news.babandeep.in
To unsubscribe: https://news.babandeep.in/unsubscribe`;
}