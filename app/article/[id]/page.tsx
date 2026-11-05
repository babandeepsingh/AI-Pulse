import { notFound, permanentRedirect } from 'next/navigation';
import { getArticleById } from '@/lib/articles';
import { articlePath } from '@/lib/site';

// Legacy URL (/article/<id>) — 308 permanent redirect to /news/<id>-<slug>.
export const dynamic = 'force-dynamic';

export default async function LegacyArticle({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const article = Number.isSafeInteger(id) ? await getArticleById(id) : null;
  if (!article) notFound();
  permanentRedirect(articlePath(article));
}
