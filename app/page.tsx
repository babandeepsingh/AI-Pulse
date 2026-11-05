import type { Metadata } from 'next';
import HomeFeed from '@/components/HomeFeed';
import { getLatestArticles } from '@/lib/articles';
import {
  SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, DEFAULT_OG_IMAGE, LOGO_URL, EDITOR, jsonLd,
} from '@/lib/site';

// ISR: regenerated at most every 5 minutes, and immediately on publish via
// revalidatePath('/') in lib/publish.ts.
export const revalidate = 300;

const INITIAL_ARTICLES = 12;

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function Home() {
  const articles = await getLatestArticles(INITIAL_ARTICLES);
  // Plain, serialisable rows for the client component.
  const initialNews = JSON.parse(JSON.stringify(articles));

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
      description: SITE_DESCRIPTION,
      founder: { '@type': 'Person', name: EDITOR.name },
      publishingPrinciples: `${SITE_URL}/editorial-policy`,
      ethicsPolicy: `${SITE_URL}/editorial-policy`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <h1 className="text-2xl font-bold mb-4">Daily AI News</h1>
      <HomeFeed initialNews={initialNews} />
    </div>
  );
}
