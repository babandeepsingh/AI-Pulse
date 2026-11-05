// RSS 2.0 feed of the latest 50 published articles.
import { getLatestArticles, lastModified } from '@/lib/articles';
import {
  SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, ARTICLE_AUTHOR, LOGO_URL,
  articleUrl, articleDescription, escapeXml,
} from '@/lib/site';

export const dynamic = 'force-dynamic';

const cdata = (s: string) => `<![CDATA[${(s || '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export async function GET() {
  let articles: Awaited<ReturnType<typeof getLatestArticles>> = [];
  try {
    articles = await getLatestArticles(50);
  } catch (err) {
    console.error('RSS generation failed:', err);
  }

  const lastBuild = articles[0] ? lastModified(articles[0]) : new Date();

  const items = articles
    .map((a) => {
      const url = articleUrl(a);
      const html = (a.content || '')
        .split(/\n+/)
        .filter((p) => p.trim())
        .map((p) => `<p>${escapeXml(p)}</p>`)
        .join('');
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(a.created_at).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(ARTICLE_AUTHOR.name)}</dc:creator>
      <description>${escapeXml(articleDescription(a))}</description>
      <content:encoded>${cdata(html)}</content:encoded>${
        a.image_url ? `\n      <media:content url="${escapeXml(a.image_url)}" medium="image"/>` : ''
      }
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${LOGO_URL}</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${SITE_URL}/</link>
    </image>
    <ttl>60</ttl>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
