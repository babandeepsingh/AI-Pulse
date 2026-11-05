import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/site';

const title = 'News Intelligence — Ask about AI news';
const description = 'Chat with the AI News archive: ask about today’s AI headlines, weekly summaries, and specific topics.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/chat` },
  openGraph: { type: 'website', url: `${SITE_URL}/chat`, siteName: SITE_NAME, title, description, images: ['/og-image.png'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
