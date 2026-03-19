'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Unsubscribe() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleUnsubscribe = async () => {
    if (!email) {
      setMessage('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const res = await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      // ❌ Email not found
      if (res.status === 404) {
        setMessage('❌ This email is not subscribed');
        return;
      }

      if (!res.ok) throw new Error(data.message);

      // ✅ Success
      setMessage('🗞️ You have been unsubscribed');

      // Redirect after short delay
      setTimeout(() => {
        router.push('/');
      }, 1200);

    } catch (err: any) {
      setMessage(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
        
        <h1 className="text-2xl font-bold mb-2">📰 BREAKING NEWS</h1>
        <h2 className="text-lg font-semibold mb-4">
          User Attempts to Unsubscribe
        </h2>

        <p className="text-gray-600 mb-4">
          Sources say they were “getting too many emails.”
        </p>

        <p className="text-gray-600 mb-6">
          Editors are disappointed but respecting the decision.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          className="border p-2 w-full mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="bg-red-600 text-white w-full py-2 rounded mb-3 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Confirm Unsubscribe'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="bg-green-600 text-white w-full py-2 rounded"
        >
          Keep Me Subscribed 😎
        </button>

        {/* Message */}
        {message && (
          <p className="mt-4 text-sm text-gray-700">{message}</p>
        )}

        <p className="text-xs text-gray-400 mt-6">
          More updates at 6… unless you leave 😢
        </p>
      </div>
    </div>
  );
}