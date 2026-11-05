'use client';
import { useEffect, useRef, useState } from 'react';
import { articlePath, formatDate, toISO } from '@/lib/site';

const PAGE_SIZE = 6;

interface Props {
  initialNews: any[];
}

/**
 * Interactive part of the homepage. The first batch of articles arrives
 * server-rendered via `initialNews`, so crawlers and no-JS clients see real
 * content; infinite scroll and search continue client-side as before.
 */
export default function HomeFeed({ initialNews }: Props) {
  const [news, setNews] = useState<any[]>(initialNews);
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  // A full final page means there may be more to load.
  const initialHasMore = initialNews.length > 0 && initialNews.length % PAGE_SIZE === 0;
  const [noMore, setNoMore] = useState(!initialHasMore);
  const [searchLoading, setSearchLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  // Server rendered PAGE_SIZE * n articles, i.e. pages 1..n are already loaded.
  const pageRef = useRef(Math.max(1, Math.ceil(initialNews.length / PAGE_SIZE)));
  const hasMoreRef = useRef(initialHasMore);
  const fetchingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const firstSearchRun = useRef(true);

  const fetchNews = async (pageNumber: number) => {
    if (fetchingRef.current) return;
    if (!hasMoreRef.current && pageNumber > 1) return;

    fetchingRef.current = true;
    if (pageNumber > 1) setLoadingMore(true);

    try {
      const res = await fetch(`/api/news?limit=${PAGE_SIZE}&page=${pageNumber}`, { cache: 'no-store' });
      const data = await res.json();

      const more = data.length >= PAGE_SIZE;
      hasMoreRef.current = more;
      setNoMore(!more);

      pageRef.current = pageNumber;
      setNews(prev => (pageNumber === 1 ? data : [...prev, ...data]));
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  };

  // Attach observer to sentinel div via callback ref
  const sentinelRef = (el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingRef.current && hasMoreRef.current) {
          fetchNews(pageRef.current + 1);
        }
      },
      { rootMargin: '100px' }
    );
    observerRef.current.observe(el);
  };

  // Debounced search (skipped on mount — the server already rendered page 1)
  useEffect(() => {
    if (firstSearchRun.current) {
      firstSearchRun.current = false;
      return;
    }
    const debounce = setTimeout(async () => {
      if (search.trim() === '') {
        pageRef.current = 1;
        hasMoreRef.current = true;
        setNoMore(false);
        fetchNews(1);
        return;
      }
      setSearchLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setNews(data);
      hasMoreRef.current = false;
      setNoMore(true);
      setSearchLoading(false);
    }, 1000);

    return () => clearTimeout(debounce);
  }, [search]);

  const subscribe = async () => {
    if (!email) return;
    setSubscribeLoading(true);
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSubscribeLoading(false);
    setEmail('');
    alert('Subscribed!');
  };

  return (
    <>
      {/* Search */}
      <div className="mb-6">
        <input
          className="border p-2 w-full"
          placeholder="Search by title or tag..."
          aria-label="Search articles"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searchLoading && <div className="text-gray-500 text-sm mt-1">Searching...</div>}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {news.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No articles found.</div>
          ) : (
            <>
              {news.map((item: any) => {
                const href = articlePath(item);
                const iso = toISO(item.created_at);
                return (
                  <article key={item.id} className="bg-white p-4 mb-4 shadow rounded">
                    <a href={href} className="hover:underline">
                      <h2 className="text-xl font-bold">{item.title}</h2>
                    </a>
                    {iso && (
                      <time dateTime={iso} className="block text-xs text-gray-500 mt-1">
                        {formatDate(item.created_at)}
                      </time>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-gray-600 truncate mr-4">{item.summary || item.content}</p>
                      <a href={href} className="text-blue-500 flex-shrink-0" aria-label={`Read more: ${item.title}`}>
                        Read More →
                      </a>
                    </div>
                  </article>
                );
              })}

              {/* Sentinel — only renders after articles, uses callback ref */}
              {!noMore && (
                <div ref={sentinelRef} className="mb-5">
                  {loadingMore && (
                    <div className="bg-white p-4 mb-4 shadow rounded">
                      <div className="flex animate-pulse space-x-4">
                        <div className="size-10 rounded-full bg-gray-200"></div>
                        <div className="flex-1 space-y-6 py-1">
                          <div className="h-2 rounded bg-gray-200"></div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                              <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                            </div>
                            <div className="h-2 rounded bg-gray-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {noMore && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  You&apos;ve reached the end
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden md:block">
          <div className="sticky top-6 bg-white p-6 shadow rounded">
            <h3 className="text-lg font-bold mb-4">Subscribe to Daily Summary</h3>
            <input
              className="border p-2 w-full mb-3"
              placeholder="Enter email"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={subscribe}
              disabled={subscribeLoading}
              className="bg-green-600 text-white w-full py-2 disabled:opacity-50 rounded"
            >
              {subscribeLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
