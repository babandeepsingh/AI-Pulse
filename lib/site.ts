// Site-wide constants and pure helpers. Safe to import from client components
// (no server-only dependencies).

export const SITE_URL = 'https://news.babandeep.in';
export const SITE_NAME = 'AI News';
export const SITE_TITLE = 'AI News — Daily AI News';
export const SITE_DESCRIPTION =
  'AI News delivers daily AI-generated news on artificial intelligence, machine learning, and frontier models, reviewed by Babandeep Singh.';
export const SITE_LANGUAGE = 'en';

/** Byline shown on every article and used as JSON-LD author. */
export const ARTICLE_AUTHOR = { name: 'AI News Desk', url: `${SITE_URL}/about` };
/** Human editor who reviews articles. */
export const EDITOR = { name: 'Babandeep Singh', url: `${SITE_URL}/about` };

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO_URL = `${SITE_URL}/icon-512.png`;

export function slugify(text: string): string {
  return (text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/**
 * Permanent article path: /news/<id>-<slug>. The numeric id is the stable key;
 * the slug is cosmetic and a mismatched slug redirects to the canonical one.
 */
export function articlePath(article: { id: number | string; title?: string | null }): string {
  const slug = slugify(article.title || '');
  return `/news/${article.id}${slug ? `-${slug}` : ''}`;
}

export function articleUrl(article: { id: number | string; title?: string | null }): string {
  return `${SITE_URL}${articlePath(article)}`;
}

/** Parse the id out of a "/news/<id>-<slug>" segment. */
export function parseArticleSegment(segment: string): number | null {
  const m = /^(\d+)(?:-|$)/.exec(segment || '');
  return m ? Number(m[1]) : null;
}

export function excerpt(text: string | null | undefined, max = 160): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function articleDescription(article: { summary?: string | null; content?: string | null }): string {
  return excerpt(article.summary || article.content, 160);
}

export function toISO(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Deterministic date formatting (fixed locale + UTC) so server-rendered HTML
 * and client hydration always agree.
 */
export function formatDate(value: string | Date | null | undefined, withTime = false): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' } : {}),
    timeZone: 'UTC',
  });
}

export function escapeXml(value: string | null | undefined): string {
  return (value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Serialize JSON-LD safely for embedding inside a <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
