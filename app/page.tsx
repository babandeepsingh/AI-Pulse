'use client';
import { useEffect, useRef, useState } from 'react';

// Module-level guards — survive StrictMode remounts
let isFetching = false;
let currentPage = 1;
let hasMore = true;

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const limit = 6;

  const [submitTitle, setSubmitTitle] = useState('');
  const [submitContent, setSubmitContent] = useState('');
  const [submitSummary, setSubmitSummary] = useState('');
  const [submitImage, setSubmitImage] = useState('');
  const [submitSourceName, setSubmitSourceName] = useState('');
  const [submitSourceUrl, setSubmitSourceUrl] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchNews = async (pageNumber: number) => {
    if (isFetching) return;
    if (!hasMore && pageNumber > 1) return;

    isFetching = true;
    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await fetch(`/api/news?limit=${limit}&page=${pageNumber}`, { cache: 'no-store' });
      const data = await res.json();

      if (data.length === 0 || data.length < limit) {
        hasMore = false;
        setNoMore(true);
      }

      currentPage = pageNumber;
      setNews(prev => pageNumber === 1 ? data : [...prev, ...data]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetching = false;
    }
  };

  // Initial load
  useEffect(() => {
    isFetching = false;
    currentPage = 1;
    hasMore = true;
    setNoMore(false);
    fetchNews(1);
  }, []);

  // 🔑 Attach observer to sentinel div via callback ref
  // This fires every time the div mounts/unmounts — guarantees fresh observation
  const sentinelRef = (el: HTMLDivElement | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!el) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching && hasMore) {
          fetchNews(currentPage + 1);
        }
      },
      { rootMargin: '100px' }
    );

    observerRef.current.observe(el);
  };

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (search.trim() === '') {
        currentPage = 1;
        hasMore = true;
        setNoMore(false);
        fetchNews(1);
        return;
      }
      setSearchLoading(true);
      const res = await fetch(`/api/search?q=${search}`);
      const data = await res.json();
      setNews(data);
      hasMore = false;
      setNoMore(true);
      setSearchLoading(false);
    }, 1000);

    return () => clearTimeout(debounce);
  }, [search]);

  const submitArticle = async () => {
    if (!submitTitle || !submitContent) {
      alert('Title and content required');
      return;
    }
    setSubmitLoading(true);
    const res = await fetch('/api/submit-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: submitTitle,
        content: submitContent,
        summary: submitSummary,
        imageUrl: submitImage,
        sourceName: submitSourceName,
        sourceUrl: submitSourceUrl,
      }),
    });
    setSubmitLoading(false);
    if (res.ok) {
      setIsModalOpen(false);
      setSubmitTitle(''); setSubmitContent(''); setSubmitSummary('');
      setSubmitImage(''); setSubmitSourceName(''); setSubmitSourceUrl('');
      alert('Article submitted for review!');
    } else {
      alert('Something went wrong.');
    }
  };

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Search */}
      <div className="mb-6">
        <input
          className="border p-2 w-full"
          placeholder="Search by title or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searchLoading && <div className="text-gray-500 text-sm mt-1">Searching...</div>}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading articles...</div>
          ) : news.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No articles found.</div>
          ) : (
            <>
              {news.map((item: any) => (
                <div key={item.id} className="bg-white p-4 mb-4 shadow rounded">
                  <h2 className="text-xl font-bold">{item.title}</h2>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-gray-600 truncate mr-4">{item.content}</p>
                    <a href={`/article/${item.id}`} className="text-blue-500 flex-shrink-0">
                      Read More →
                    </a>
                  </div>
                </div>
              ))}

              {/* 🔑 Sentinel — only renders after articles, uses callback ref */}
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

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        + Submit News
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black">✕</button>
            <h2 className="text-xl font-bold mb-4">Submit News</h2>
            <input className="border p-2 w-full mb-2" placeholder="Title" value={submitTitle} onChange={(e) => setSubmitTitle(e.target.value)} />
            <textarea className="border p-2 w-full mb-2" placeholder="Summary" value={submitSummary} onChange={(e) => setSubmitSummary(e.target.value)} />
            <textarea className="border p-2 w-full mb-2" placeholder="Content" rows={4} value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} />
            <input className="border p-2 w-full mb-2" placeholder="Image URL" value={submitImage} onChange={(e) => setSubmitImage(e.target.value)} />
            <input className="border p-2 w-full mb-2" placeholder="Source Name" value={submitSourceName} onChange={(e) => setSubmitSourceName(e.target.value)} />
            <input className="border p-2 w-full mb-4" placeholder="Source URL" value={submitSourceUrl} onChange={(e) => setSubmitSourceUrl(e.target.value)} />
            <button onClick={submitArticle} disabled={submitLoading} className="bg-blue-600 text-white w-full py-2 rounded disabled:opacity-50">
              {submitLoading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}