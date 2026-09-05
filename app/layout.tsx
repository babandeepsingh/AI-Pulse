import Link from 'next/link';
import './globals.css';
import type { Metadata } from 'next';
import FloatingActions from '@/components/FloatingActions';
import PushNotifications from '@/components/PushNotifications';

const SITE_URL = 'https://news.babandeep.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'News — Daily AI News',
    template: '%s | AI News',
  },
  description: 'AI News delivers daily AI-generated news on artificial intelligence, machine learning, and frontier models. Stay informed every morning.',
  keywords: ['AI news', 'artificial intelligence', 'machine learning', 'daily AI briefing', 'frontier models'],
  authors: [{ name: 'Babandeep Singh' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'AI News',
    title: 'AI News — Daily AI News',
    description: 'AI-generated news on artificial intelligence, delivered daily.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AI News' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI News — Daily AI News',
    description: 'AI-generated news on artificial intelligence, delivered daily.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  manifest: '/manifest.json',
  applicationName: 'AI News',
  appleWebApp: {
    capable: true,
    title: 'AI News',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="5I7cGJDGHUPhfCIW8SKWhdMm3QKBaCOCp1SzB9zPjmk" />
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","w6brwwenwy");`,
            }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsMediaOrganization',
              name: 'AI News',
              url: SITE_URL,
              description: 'Daily AI-generated news on artificial intelligence and machine learning.',
            }),
          }}
        />
      </head>
      <body className="bg-gray-100">
        <nav className="bg-black text-white p-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            News
          </Link>
          <Link href="/chat" className="text-sm text-gray-300 hover:text-white transition-colors tracking-wide">
            News Intelligence
          </Link>
        </nav>
        <div className="max-w-5xl mx-auto p-6">{children}</div>
        <FloatingActions />
        <PushNotifications />
      </body>
    </html>
  );
}




{/* <a href="/admin/login">Admin</a> */ }
