// app/robots.ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Search engines and AI search/assistant crawlers we explicitly welcome.
const ALLOWED_BOTS = [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'Claude-User',
  'Claude-SearchBot',
  'ClaudeBot',
  'PerplexityBot',
];

const PRIVATE_PATHS = ['/admin', '/api/', '/unsubscribe'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ALLOWED_BOTS, allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  };
}
