// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic'; // ⚡ make route runtime-only

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const articlesRes = await query('SELECT id, created_at FROM articles ORDER BY created_at DESC');
    const articles = articlesRes.rows;

    return [
      { url: 'https://AI-Pulse.babandeep.in', lastModified: new Date() },
      ...articles.map((a: any) => ({
        url: `https://AI-Pulse.babandeep.in/article/${a.id}`,
        lastModified: new Date(a.created_at),
      })),
    ];
  } catch (err) {
    console.error('Sitemap generation failed:', err);
    return [{ url: 'https://AI-Pulse.babandeep.in', lastModified: new Date() }];
  }
}