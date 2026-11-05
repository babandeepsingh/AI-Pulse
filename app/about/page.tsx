import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME, EDITOR, jsonLd } from '@/lib/site';

// PLACEHOLDER COPY — edit the text below to describe the site in your own words.

const title = 'About';
const description = `About ${SITE_NAME}: a daily, AI-generated news briefing on artificial intelligence, reviewed by ${EDITOR.name}.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: { type: 'website', url: `${SITE_URL}/about`, siteName: SITE_NAME, title, description, images: ['/og-image.png'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
};

export default function AboutPage() {
  return (
    <article className="bg-white p-6 shadow space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            url: `${SITE_URL}/about`,
            name: title,
            about: { '@id': `${SITE_URL}/#organization` },
          }),
        }}
      />
      <h1 className="text-2xl font-bold">About {SITE_NAME}</h1>

      <p>
        {SITE_NAME} is a daily news briefing covering artificial intelligence, machine learning and
        frontier models. Each day we publish short, factual summaries of the most important AI stories
        so you can stay informed in a few minutes.
      </p>

      <h2 className="text-xl font-bold pt-2">How articles are made</h2>
      <p>
        Articles on {SITE_NAME} are <strong>generated with AI</strong>. An AI system drafts each article
        from publicly available reporting and primary sources, and every article links to the source it is
        based on. Before publication, articles are reviewed by a human editor.
      </p>

      <h2 className="text-xl font-bold pt-2">Who runs the site</h2>
      <p>
        {SITE_NAME} is run and edited by <strong>{EDITOR.name}</strong>, who reviews articles before they are
        published and is responsible for corrections. [Add a short bio here: background, expertise, location,
        links to your profiles.]
      </p>

      <h2 className="text-xl font-bold pt-2">Contact</h2>
      <p>
        For corrections, feedback or tips, contact [add your contact email here]. You can also suggest a story
        using the &ldquo;Submit News&rdquo; button on any page.
      </p>

      <p>
        Read our <a href="/editorial-policy" className="text-blue-600 underline">editorial policy</a> for details
        on how sources are chosen and how articles are reviewed.
      </p>
    </article>
  );
}
