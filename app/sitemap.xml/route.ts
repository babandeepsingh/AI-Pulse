// /sitemap.xml — every published article (with lastmod) plus static pages.
// A route handler (not app/sitemap.ts) so it is always rendered at request
// time and new articles appear immediately.
import { getArticleIndex, lastModified } from '@/lib/articles';
import { SITE_URL, articleUrl, escapeXml } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Entry = { loc: string; lastmod?: Date; changefreq?: string; priority?: number };

export async function GET() {
  const entries: Entry[] = [];
  try {
    const articles = await getArticleIndex();
    entries.push({
      loc: `${SITE_URL}/`,
      lastmod: articles[0] ? lastModified(articles[0]) : undefined,
      changefreq: 'hourly',
      priority: 1,
    });
    for (const a of articles) {
      entries.push({ loc: articleUrl(a), lastmod: lastModified(a), changefreq: 'weekly', priority: 0.7 });
    }
  } catch (err) {
    console.error('Sitemap generation failed:', err);
    entries.push({ loc: `${SITE_URL}/`, changefreq: 'hourly', priority: 1 });
  }
  for (const path of ['/about', '/editorial-policy', '/chat']) {
    entries.push({ loc: `${SITE_URL}${path}`, changefreq: 'monthly', priority: 0.3 });
  }

  const body = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeXml(e.loc)}</loc>` +
        (e.lastmod ? `\n    <lastmod>${e.lastmod.toISOString()}</lastmod>` : '') +
        (e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : '') +
        (e.priority !== undefined ? `\n    <priority>${e.priority}</priority>` : '') +
        `\n  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
