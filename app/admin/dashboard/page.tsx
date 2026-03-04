'use client';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'add' | 'submitted'>('add');

  // Form state for adding articles
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  // Submitted articles
  const [submitted, setSubmitted] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [previewArticle, setPreviewArticle] = useState<any>(null);

  // Token
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  // Fetch submitted articles
  const fetchSubmitted = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/submitted-articles', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSubmitted(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'submitted') fetchSubmitted();
  }, [activeTab]);

  // Add article manually
  const addArticle = async () => {
    await fetch('/api/admin/add-article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        content,
        summary,
        tags: tags.split(','),
        imageUrl,
        sourceName,
        sourceUrl,
      }),
    });
    alert('Article added!');
  };

  // Approve article
  const approveArticle = async (id: number) => {
    const res = await fetch(`/api/admin/approve-article/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      alert('Article approved!');
      setPreviewArticle(null); // close modal if open
      fetchSubmitted();
    } else {
      alert('Failed to approve');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('add')}
        >
          Add Article
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === 'submitted' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('submitted')}
        >
          Submitted Articles
        </button>
      </div>

      {/* Tab 1: Add Article */}
      {activeTab === 'add' && (
        <div className="bg-white p-6 shadow rounded">
          <h2 className="text-xl font-bold mb-4">Add Article</h2>

          <input
            className="border p-2 w-full mb-2"
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="border p-2 w-full mb-2"
            placeholder="Summary"
            onChange={(e) => setSummary(e.target.value)}
          />

          <textarea
            className="border p-2 w-full mb-2"
            placeholder="Content"
            rows={6}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-2"
            placeholder="Tags (comma separated)"
            onChange={(e) => setTags(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-2"
            placeholder="Image URL"
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-2"
            placeholder="Source Name"
            onChange={(e) => setSourceName(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-4"
            placeholder="Source URL"
            onChange={(e) => setSourceUrl(e.target.value)}
          />

          <button
            onClick={addArticle}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Publish
          </button>
        </div>
      )}

      {/* Tab 2: Submitted Articles */}
      {activeTab === 'submitted' && (
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : submitted.length === 0 ? (
            <p>No submitted articles.</p>
          ) : (
            submitted.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 mb-4 shadow rounded cursor-pointer"
              >
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-gray-700 truncate">{item.content}</p>
                <button
                  onClick={() => setPreviewArticle(item)}
                  className="mt-2 text-blue-600 underline"
                >
                  View Full
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Preview */}
{previewArticle && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white w-full max-w-3xl max-h-full rounded shadow-lg overflow-hidden flex flex-col">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">{previewArticle.title}</h2>
        <button
          onClick={() => setPreviewArticle(null)}
          className="text-gray-500 hover:text-black"
        >
          ✕
        </button>
      </div>

      {/* Modal Body - scrollable */}
      <div className="p-4 overflow-y-auto flex-1">
        {previewArticle.image_url && (
          <img
            src={previewArticle.image_url}
            alt={previewArticle.title}
            className="w-full h-64 object-cover mb-4 rounded"
          />
        )}

        {previewArticle.summary && (
          <p className="mb-2 text-gray-700 whitespace-pre-wrap">
            {previewArticle.summary}
          </p>
        )}

        <p className="mb-2 text-gray-800 whitespace-pre-wrap">
          {previewArticle.content}
        </p>

        <p className="text-sm text-gray-500 mb-4">
          Source: {previewArticle.source_name || 'N/A'} |{' '}
          {previewArticle.source_url ? (
            <a
              href={previewArticle.source_url}
              target="_blank"
              className="text-blue-600 underline"
            >
              Link
            </a>
          ) : (
            'No URL'
          )}
        </p>
      </div>

      {/* Modal Footer */}
      <div className="p-4 border-t flex justify-end">
        <button
          onClick={() => approveArticle(previewArticle.id)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Approve & Publish
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}