import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getArticleById, lastModified } from '@/lib/articles';
import {
  SITE_URL, SITE_NAME, ARTICLE_AUTHOR, EDITOR, DEFAULT_OG_IMAGE, LOGO_URL,
  articlePath, articleUrl, articleDescription, parseArticleSegment, formatDate, toISO, jsonLd,
} from '@/lib/site';

// Rendered on first request, cached, then refreshed hourly or on publish.
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

type Props = { params: { slug: string } };

async function load(segment: string) {
  const id = parseArticleSegment(segment);
  return id ? getArticleById(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await load(params.slug);
  if (!article) return { title: 'Article Not Found', robots: { index: false } };

  const url = articleUrl(article);
  const description = articleDescription(article);
  const image = article.image_url || DEFAULT_OG_IMAGE;
  const published = toISO(article.created_at);
  const modified = toISO(lastModified(article));

  return {
    title: article.title,
    description,
    authors: [{ name: ARTICLE_AUTHOR.name, url: ARTICLE_AUTHOR.url }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title: article.title,
      description,
      publishedTime: published,
      modifiedTime: modified,
      authors: [ARTICLE_AUTHOR.url],
      images: article.image_url
        ? [{ url: image, alt: article.title }]
        : [{ url: image, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [image],
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const article = await load(params.slug);
  if (!article) notFound();

  // Canonicalise the slug so every article has exactly one URL.
  const canonicalPath = articlePath(article);
  if (`/news/${params.slug}` !== canonicalPath) permanentRedirect(canonicalPath);

  const url = articleUrl(article);
  const published = toISO(article.created_at);
  const modified = toISO(lastModified(article));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title.slice(0, 110),
    description: articleDescription(article),
    articleBody: article.content,
    datePublished: published,
    dateModified: modified,
    author: [{ '@type': 'Organization', name: ARTICLE_AUTHOR.name, url: ARTICLE_AUTHOR.url }],
    editor: { '@type': 'Person', name: EDITOR.name, url: EDITOR.url },
    publisher: {
      '@type': 'NewsMediaOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
    },
    image: [article.image_url || DEFAULT_OG_IMAGE],
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: 'en',
    isAccessibleForFree: true,
    ...(article.source_url
      ? { isBasedOn: { '@type': 'CreativeWork', name: article.source_name || undefined, url: article.source_url } }
      : {}),
  };

  return (
    <article className="bg-white p-6 shadow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <Link href="/" className="text-blue-600 underline mb-4 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-2xl font-bold mb-2">{article.title}</h1>

      <p className="text-sm text-gray-500 mb-4">
        By{' '}
        <a href="/about" rel="author" className="underline">
          {ARTICLE_AUTHOR.name}
        </a>{' '}
        · Reviewed by {EDITOR.name}
        {published && (
          <>
            {' '}· <time dateTime={published}>{formatDate(article.created_at)}</time>
          </>
        )}
      </p>

      {article.summary && <p className="bg-gray-100 italic p-3 mb-4 rounded">{article.summary}</p>}

      {article.image_url && (
        <img src={article.image_url} alt={article.title} className="w-full h-auto mb-4 rounded" />
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
        {published && (
          <time dateTime={published} className="text-gray-500">
            Published on: {formatDate(article.created_at, true)}
          </time>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        This article was generated with AI and reviewed by a human editor.{' '}
        <a href="/editorial-policy" className="underline">Read our editorial policy</a>.
      </p>
    </article>
  );
}
