// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch('https://AI-Pulse.babandeep.in/api/news');
  const articles = await res.json();

  return [
    { url: 'https://AI-Pulse.babandeep.in', lastModified: new Date() },
    ...articles.map((a: any) => ({
      url: `https://AI-Pulse.babandeep.in/article/${a.id}`,
      lastModified: new Date(a.created_at),
    })),
  ];
}