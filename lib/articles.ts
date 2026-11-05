// Server-side article queries shared by pages, feeds and sitemaps.
import { query } from '@/lib/db';

export interface Article {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  slug: string | null;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  is_published: boolean;
  created_at: string | Date;
  updated_at?: string | Date | null;
}

const isBuildPhase = () => process.env.NEXT_PHASE === 'phase-production-build';

/**
 * During `next build` the database may be unreachable (e.g. CI without
 * DATABASE_URL). In that case fall back so the build succeeds; the page is
 * regenerated on the first request. At runtime errors propagate, so ISR keeps
 * serving the last good page instead of caching an empty one.
 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isBuildPhase()) {
      console.warn('[articles] DB unavailable during build, using fallback:', (err as Error).message);
      return fallback;
    }
    throw err;
  }
}

export function getLatestArticles(limit = 12, offset = 0): Promise<Article[]> {
  return safe(async () => {
    const res = await query(
      `SELECT * FROM articles WHERE is_published = true
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows as Article[];
  }, []);
}

export async function getArticleById(id: number): Promise<Article | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const res = await query('SELECT * FROM articles WHERE id = $1 AND is_published = true', [id]);
  return (res.rows[0] as Article) || null;
}

/** Lightweight rows for sitemaps / llms.txt. */
export async function getArticleIndex(limit = 50000): Promise<Article[]> {
  const res = await query(
    `SELECT * FROM articles WHERE is_published = true ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows as Article[];
}

export async function getArticlesSince(hours: number, limit = 1000): Promise<Article[]> {
  const res = await query(
    `SELECT * FROM articles
     WHERE is_published = true AND created_at >= NOW() - make_interval(hours => $1::int)
     ORDER BY created_at DESC LIMIT $2`,
    [hours, limit]
  );
  return res.rows as Article[];
}

export function lastModified(a: Pick<Article, 'created_at' | 'updated_at'>): Date {
  return new Date(a.updated_at || a.created_at);
}
