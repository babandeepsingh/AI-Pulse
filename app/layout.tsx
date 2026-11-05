import Link from 'next/link';
import './globals.css';
import type { Metadata } from 'next';
import FloatingActions from '@/components/FloatingActions';
import PushNotifications from '@/components/PushNotifications';
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: 'Babandeep Singh', url: `${SITE_URL}/about` }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  // Site-wide defaults only; each page sets its own canonical, og:url and title.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
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
        <meta name="msvalidate.01" content="D0F5D79A3EF452E2AB1310C98FF69415" />
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","w6brwwenwy");`,
            }}
          />
        )}
        <link rel="alternate" type="application/rss+xml" title={`${SITE_NAME} RSS feed`} href={`${SITE_URL}/rss.xml`} />
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
        <footer className="max-w-5xl mx-auto px-6 pb-10 pt-4 text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-2">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/editorial-policy" className="hover:underline">Editorial Policy</Link>
          <a href="/rss.xml" className="hover:underline">RSS</a>
        </footer>
        <FloatingActions />
        <PushNotifications />
      </body>
    </html>
  );
}




{/* <a href="/admin/login">Admin</a> */ }
