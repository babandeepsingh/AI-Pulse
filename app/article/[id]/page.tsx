import { query } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

const SITE_URL = 'https://yoursite.com'; // ← same as layout.tsx

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await query('SELECT * FROM articles WHERE id = $1', [params.id]);
  const article = result.rows[0];

  if (!article) {
    return { title: 'Article Not Found' };
  }

  return {
    title: article.title,
    description: article.summary || article.content?.slice(0, 160),
    alternates: {
      canonical: `${SITE_URL}/article/${params.id}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary || article.content?.slice(0, 160),
      type: 'article',
      url: `${SITE_URL}/article/${params.id}`,
      publishedTime: article.created_at,
      images: article.image_url
        ? [{ url: article.image_url, alt: article.title }]
        : [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary || article.content?.slice(0, 160),
      images: article.image_url ? [article.image_url] : ['/og-image.png'],
    },
  };
}

export default async function Article({ params }: { params: { id: string } }) {
  const result = await query('SELECT * FROM articles WHERE id = $1', [params.id]);
  const article = result.rows[0];

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="bg-white p-6 shadow">
      <Link href="/" className="text-blue-600 underline mb-4 inline-block">
        ← Back to Home
      </Link>

      {/* JSON-LD for the individual article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            description: article.summary || article.content?.slice(0, 160),
            datePublished: article.created_at,
            image: article.image_url || `${SITE_URL}/og-image.png`,
            url: `${SITE_URL}/article/${params.id}`,
            publisher: {
              '@type': 'Organization',
              name: 'AI Pulse',
              url: SITE_URL,
            },
          }),
        }}
      />

      <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
      <p className="bg-gray-100 italic p-3 mb-4 rounded">{article.summary}</p>

      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-auto mb-4 rounded"
        />
      )}

      <p className="mb-6 whitespace-pre-line">{article.content}</p>

      <div className="flex mt-6 border-t pt-4 items-center justify-between">
        {article.source_name && article.source_url && (
          <div>
            <span className="font-semibold">Source: </span>
            <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {article.source_name}
            </a>
          </div>
        )}
        {article.created_at && (
          <time dateTime={article.created_at} className="text-gray-500">
            Published on:{' '}
            {new Date(article.created_at).toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true,
            })}
          </time>
        )}
      </div>
    </div>
  );
}