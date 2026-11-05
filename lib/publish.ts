// Call after an article is published or updated: refreshes cached pages/feeds
// and notifies IndexNow. Never throws, so it can't fail the admin request.
import { revalidatePath } from 'next/cache';
import { SITE_URL, articlePath, articleUrl } from '@/lib/site';
import { pingIndexNow } from '@/lib/indexnow';

export async function onArticlePublished(article: { id: number; title: string }) {
  const paths = ['/', articlePath(article), '/sitemap.xml', '/news-sitemap.xml', '/rss.xml', '/llms.txt'];
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch (err) {
      console.warn('[publish] revalidatePath failed', p, (err as Error).message);
    }
  }

  const indexNow = await pingIndexNow([articleUrl(article), `${SITE_URL}/`]);
  return { revalidated: paths, indexNow };
}
