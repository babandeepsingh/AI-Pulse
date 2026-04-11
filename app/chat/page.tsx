'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED = [
  "What's the latest news today?",
  "Give me a summary of this week's top stories",
  "What happened in AI last week?",
  "Summarize the most recent articles",
];

const STORAGE_KEY = 'ai-news-chat-history';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    if (['/clear', '/exit'].includes(text.trim().toLowerCase())) {
      clearHistory();
      setInput('');
      return;
    }

    const userMessage: Message = { role: 'user', content: text.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');
    setLoading(true);

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages([...updated, assistantMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: accumulated };
          return copy;
        });
      }
      const finalMessages = [...updated, { role: 'assistant' as const, content: accumulated }];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(finalMessages)); } catch {}
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: 'An error occurred. Please try again.',
        };
        return copy;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900 tracking-tight">News Intelligence</h1>
          <p className="text-xs text-gray-400 mt-0.5">Ask about any story, topic, or request a summary</p>
        </div>
        <div className="flex items-center gap-4">
          {messages.length > 0 && (
            <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Clear history
            </button>
          )}
          <span className="text-xs text-gray-300 font-mono">AI News</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {isEmpty ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
                  <path d="M2 11h8" /><path d="M2 15h8" /><path d="M2 19h8" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">What would you like to know?</h2>
              <p className="text-sm text-gray-400 mt-1">Powered by your live news database</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3 border border-gray-200 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors bg-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 bg-black rounded-full shrink-0 mr-3 mt-0.5 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
                      <path d="M2 11h8" /><path d="M2 15h8" /><path d="M2 19h8" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-800 border border-gray-200'
                  }`}
                >
                  {m.content}
                  {m.role === 'assistant' && loading && i === messages.length - 1 && m.content === '' && (
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 bg-gray-200 rounded-full shrink-0 ml-3 mt-0.5" />
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about today's news… or type /clear to reset"
            disabled={loading}
            className="flex-1 resize-none border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 disabled:opacity-50 leading-relaxed"
            style={{ minHeight: '48px', maxHeight: '160px' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 160) + 'px';
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="bg-gray-900 text-white px-4 py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 h-[48px]"
          >
            Send
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-3">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
