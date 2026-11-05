import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME, EDITOR, jsonLd } from '@/lib/site';

// PLACEHOLDER COPY — edit the text below to match how you actually work.

const title = 'Editorial Policy';
const description = `How ${SITE_NAME} uses AI to write articles, how sources are chosen, and how ${EDITOR.name} reviews and corrects them.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/editorial-policy` },
  openGraph: { type: 'website', url: `${SITE_URL}/editorial-policy`, siteName: SITE_NAME, title, description, images: ['/og-image.png'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
};

export default function EditorialPolicyPage() {
  return (
    <article className="bg-white p-6 shadow space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            url: `${SITE_URL}/editorial-policy`,
            name: title,
            publisher: { '@id': `${SITE_URL}/#organization` },
          }),
        }}
      />
      <h1 className="text-2xl font-bold">Editorial Policy</h1>

      <h2 className="text-xl font-bold pt-2">AI-generated content</h2>
      <p>
        Articles on {SITE_NAME} are written with the help of AI. An AI model produces a draft summary of a news
        story based on the source material. We label this clearly on every article. AI can make mistakes, which is
        why every article is reviewed by a person before it is published.
      </p>

      <h2 className="text-xl font-bold pt-2">How sources are chosen</h2>
      <p>
        We prioritise primary sources (official announcements, research papers, company blogs, regulatory filings)
        and established news organisations with a record of accurate reporting. Each article links to the source it
        is based on. Reader submissions made through &ldquo;Submit News&rdquo; are checked against original sources
        before publication. [Edit this section to list the outlets and criteria you actually use.]
      </p>

      <h2 className="text-xl font-bold pt-2">Human review</h2>
      <p>
        Every article is reviewed by <strong>{EDITOR.name}</strong> before publication. The review checks that the
        headline and summary reflect the source accurately, that names, numbers and dates are correct, and that the
        article does not include speculation presented as fact. [Describe your review steps here.]
      </p>

      <h2 className="text-xl font-bold pt-2">Corrections</h2>
      <p>
        If you spot an error, please contact us at [add your contact email here]. We correct factual errors promptly
        and update the article&apos;s modified date when we do.
      </p>

      <h2 className="text-xl font-bold pt-2">Independence</h2>
      <p>
        {SITE_NAME} does not accept payment for coverage. [Add details about advertising, sponsorships or
        affiliations if any apply.]
      </p>
    </article>
  );
}
