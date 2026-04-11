'use client';
import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Response Renderer ───────────────────────────────────────────────────────
function ResponseText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-1" />;
        // numbered item: "1) ..." or "1. ..."
        const numbered = line.match(/^(\d+[).]\s+)(.+)/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-medium text-gray-500">{numbered[1].trim()}</span>
              <span>{numbered[2]}</span>
            </div>
          );
        }
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

const STORAGE_KEY = 'ai-news-chat-history';

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    if (['/clear', '/exit'].includes(text.trim().toLowerCase())) {
      clearHistory();
      setInput('');
      return;
    }
    const userMsg: Message = { role: 'user', content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages([...updated, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
      // Persist completed conversation to localStorage
      const finalMessages = [...updated, { role: 'assistant' as const, content: acc }];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(finalMessages)); } catch {}
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: 'Something went wrong. Try again.' };
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

  return (
    <div className="flex flex-col bg-white border border-gray-200 shadow-2xl" style={{ width: 360, height: 480 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 shrink-0">
        <div>
          <span className="text-sm font-semibold text-white tracking-tight">News Intelligence</span>
          <span className="text-xs text-gray-400 block">Ask about any story or summary</span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={clearHistory} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Clear
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none px-1">×</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-xs text-gray-400 pt-6 space-y-2">
            <p className="font-medium text-gray-500 mb-3">What would you like to know?</p>
            {["Today's top stories", "Last week summary", "Latest AI news"].map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left px-3 py-2 border border-gray-200 bg-white text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              {m.role === 'assistant' ? (
                m.content === '' && loading && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1 items-center py-0.5">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : (
                  // <ResponseText text={m.content} />
                  <Markdown>{m.content}</Markdown>
                )
              ) : (
                <span>{m.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex border-t border-gray-200 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          placeholder="Ask about news… or /clear to reset"
          disabled={loading}
          className="flex-1 px-3 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="px-4 bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center justify-center"
        >
          <IconSend />
        </button>
      </div>
    </div>
  );
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────
function SubmitModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title || !content) { alert('Title and content required'); return; }
    setLoading(true);
    const res = await fetch('/api/submit-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, summary, imageUrl, sourceName, sourceUrl }),
    });
    setLoading(false);
    if (res.ok) {
      onClose();
      alert('Article submitted for review!');
    } else {
      alert('Something went wrong.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-lg p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl leading-none">×</button>
        <h2 className="text-base font-semibold text-gray-900 mb-4 tracking-tight">Submit News</h2>
        <input className="border border-gray-200 px-3 py-2 w-full mb-2 text-sm focus:outline-none focus:border-gray-500" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="border border-gray-200 px-3 py-2 w-full mb-2 text-sm focus:outline-none focus:border-gray-500 resize-none" placeholder="Summary" rows={2} value={summary} onChange={e => setSummary(e.target.value)} />
        <textarea className="border border-gray-200 px-3 py-2 w-full mb-2 text-sm focus:outline-none focus:border-gray-500 resize-none" placeholder="Content *" rows={4} value={content} onChange={e => setContent(e.target.value)} />
        <input className="border border-gray-200 px-3 py-2 w-full mb-2 text-sm focus:outline-none focus:border-gray-500" placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        <input className="border border-gray-200 px-3 py-2 w-full mb-2 text-sm focus:outline-none focus:border-gray-500" placeholder="Source Name" value={sourceName} onChange={e => setSourceName(e.target.value)} />
        <input className="border border-gray-200 px-3 py-2 w-full mb-4 text-sm focus:outline-none focus:border-gray-500" placeholder="Source URL" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} />
        <button onClick={submit} disabled={loading} className="bg-gray-900 text-white w-full py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
}

// ─── Main FAB ─────────────────────────────────────────────────────────────────
export default function FloatingActions() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<'chat' | 'submit' | null>(null);

  // FAB click: if chat is open → close it; otherwise toggle speed-dial menu
  const handleFab = () => {
    if (panel === 'chat') {
      setPanel(null);
      return;
    }
    setMenuOpen(v => !v);
  };

  const openChat = () => { setPanel('chat'); setMenuOpen(false); };
  const openSubmit = () => { setPanel('submit'); setMenuOpen(false); };
  const closePanel = () => setPanel(null);

  const fabIsActive = menuOpen || panel === 'chat';

  return (
    <>
      {/* Submit modal */}
      {panel === 'submit' && <SubmitModal onClose={closePanel} />}

      {/* Chat panel — anchored above the FAB, right-aligned */}
      {panel === 'chat' && (
        <div className="fixed bottom-20 right-6 z-40 shadow-2xl">
          <ChatPanel onClose={closePanel} />
        </div>
      )}

      {/* Speed-dial */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Options (only show when menu is open AND chat panel is NOT open) */}
        {panel !== 'chat' && (
          <div className={`flex flex-col items-end gap-2 transition-all duration-200 ${menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button
              onClick={openChat}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-800 text-sm font-medium px-4 py-2.5 shadow-lg hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap"
            >
              <IconChat /> News Intelligence
            </button>
            <button
              onClick={openSubmit}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-800 text-sm font-medium px-4 py-2.5 shadow-lg hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap"
            >
              <IconEdit /> Submit News
            </button>
          </div>
        )}

        {/* FAB — button stays square, only the SVG icon rotates */}
        <button
          onClick={handleFab}
          className="w-12 h-12 bg-gray-900 text-white shadow-xl hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transition: 'transform 0.2s ease',
              transform: fabIsActive ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </>
  );
}
