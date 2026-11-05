// /llms.txt — a plain-Markdown overview for AI assistants (https://llmstxt.org).
import { getLatestArticles } from '@/lib/articles';
import { SITE_URL, SITE_NAME, EDITOR, articleUrl, articleDescription, formatDate } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  let latest: Awaited<ReturnType<typeof getLatestArticles>> = [];
  try {
    latest = await getLatestArticles(30);
  } catch (err) {
    console.error('llms.txt generation failed:', err);
  }

  const body = `# ${SITE_NAME}

> ${SITE_NAME} (${SITE_URL}) publishes daily news on artificial intelligence, machine learning and frontier models. Articles are generated with AI from public sources, link to their original source, and are reviewed by ${EDITOR.name} before publication.

Every article has a permanent URL of the form ${SITE_URL}/news/<id>-<slug> with the full text, publish date and byline in the HTML.

## Key pages

- [Homepage — latest AI news](${SITE_URL}/): newest articles first
- [About](${SITE_URL}/about): who runs the site and how articles are made
- [Editorial policy](${SITE_URL}/editorial-policy): AI use, source selection, human review and corrections
- [News Intelligence chat](${SITE_URL}/chat): ask questions about the news archive

## Feeds and indexes

- [RSS feed](${SITE_URL}/rss.xml): latest 50 articles with full text
- [Sitemap](${SITE_URL}/sitemap.xml): every published article with last-modified dates
- [Google News sitemap](${SITE_URL}/news-sitemap.xml): articles from the last 48 hours

## Latest articles

${latest.map((a) => `- [${a.title.replace(/[\[\]]/g, '')}](${articleUrl(a)}) (${formatDate(a.created_at)}): ${articleDescription(a)}`).join('\n')}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
