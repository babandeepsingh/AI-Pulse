// Google News sitemap: articles published in the last 48 hours (max 1000).
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
import { getArticlesSince, getLatestArticles, lastModified } from '@/lib/articles';
import { SITE_URL } from '@/lib/site';
import { SITE_NAME, SITE_LANGUAGE, articleUrl, escapeXml, toISO } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  let articles: Awaited<ReturnType<typeof getArticlesSince>> = [];
  try {
    articles = await getArticlesSince(48, 1000);
  } catch (err) {
    console.error('News sitemap generation failed:', err);
  }

  let urls = articles
    .map(
      (a) => `  <url>
    <loc>${escapeXml(articleUrl(a))}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>${SITE_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${toISO(a.created_at)}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
  </url>`
    )
    .join('\n');

  // An empty <urlset> is rejected by Search Console ("Missing XML tag: url").
  // With nothing from the last 48h, list the newest article (or the homepage)
  // as a plain URL without <news:news>, so no stale article is claimed as news.
  if (!urls) {
    let fallback = { loc: `${SITE_URL}/`, lastmod: new Date() };
    try {
      const [latest] = await getLatestArticles(1);
      if (latest) fallback = { loc: articleUrl(latest), lastmod: lastModified(latest) };
    } catch (err) {
      console.error('News sitemap fallback failed:', err);
    }
    urls = `  <url>
    <loc>${escapeXml(fallback.loc)}</loc>
    <lastmod>${fallback.lastmod.toISOString()}</lastmod>
  </url>`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
