import Link from 'next/link';
import './globals.css';
import type { Metadata } from 'next';

const SITE_URL = 'https://AI-Pulse.babandeep.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AI Pulse — Daily AI News',
    template: '%s | AI Pulse',
  },
  description: 'AI Pulse delivers daily AI-generated news on artificial intelligence, machine learning, and frontier models. Stay informed every morning.',
  keywords: ['AI news', 'artificial intelligence', 'machine learning', 'daily AI briefing', 'frontier models'],
  authors: [{ name: 'AI Pulse' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'AI Pulse',
    title: 'AI Pulse — Daily AI News',
    description: 'AI-generated news on artificial intelligence, delivered daily.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AI Pulse' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Pulse — Daily AI News',
    description: 'AI-generated news on artificial intelligence, delivered daily.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsMediaOrganization',
              name: 'AI Pulse',
              url: SITE_URL,
              description: 'Daily AI-generated news on artificial intelligence and machine learning.',
            }),
          }}
        />
      </head>
      <body className="bg-gray-100">
        <nav className="bg-black text-white p-4 flex justify-between">
          <Link href="/" className="text-xl font-bold">
            AI-Pulse
          </Link>
        </nav>
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}




{/* <a href="/admin/login">Admin</a> */ }
