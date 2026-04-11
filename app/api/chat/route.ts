import { query } from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { Langfuse } from 'langfuse';

export const dynamic = 'force-dynamic';

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Step 1: Intent Detection ─────────────────────────────────────────────────
type Intent = 'greeting' | 'news_question' | 'off_topic';

async function detectIntent(
  userMessage: string,
  generation: ReturnType<ReturnType<typeof langfuse.trace>['generation']>
): Promise<Intent> {
  const messages = [
    new SystemMessage(
      `You are an intent classifier. Classify the user message into exactly one of these intents:
- "greeting": casual greetings, hi, hello, how are you, thanks, bye, etc.
- "news_question": any question or request about news, articles, stories, summaries, topics, events, or specific subjects that could be found in a news database.
- "off_topic": anything unrelated to news — sports scores, coding help, recipes, personal advice, etc.

Respond with ONLY one word: greeting, news_question, or off_topic.`
    ),
    new HumanMessage(userMessage),
  ];

  const result = await llm.invoke(messages);
  const intent = (result.content as string).trim().toLowerCase() as Intent;

  generation.end({
    output: intent,
    usage: { input: 0, output: 0 },
  });

  return ['greeting', 'news_question', 'off_topic'].includes(intent)
    ? intent
    : 'news_question';
}

// ─── Step 2: Article Retrieval ────────────────────────────────────────────────
async function fetchArticles(userMessage: string): Promise<string> {
  const msg = userMessage.toLowerCase();
  let rows: any[] = [];

  if (msg.includes('today') || msg.includes('latest') || msg.includes('recent')) {
    const res = await query(
      `SELECT title, summary, content, source_name, created_at
       FROM articles WHERE is_published = true AND created_at >= NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC LIMIT 15`
    );
    rows = res.rows;
    if (rows.length === 0) {
      const fallback = await query(
        `SELECT title, summary, content, source_name, created_at
         FROM articles WHERE is_published = true ORDER BY created_at DESC LIMIT 10`
      );
      rows = fallback.rows;
    }
  } else if (msg.includes('last week') || msg.includes('this week') || msg.includes('past week')) {
    const res = await query(
      `SELECT title, summary, content, source_name, created_at
       FROM articles WHERE is_published = true AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC LIMIT 25`
    );
    rows = res.rows;
  } else if (msg.includes('last month') || msg.includes('this month') || msg.includes('past month')) {
    const res = await query(
      `SELECT title, summary, content, source_name, created_at
       FROM articles WHERE is_published = true AND created_at >= NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC LIMIT 25`
    );
    rows = res.rows;
  } else {
    const words = userMessage.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 3).slice(0, 5);
    if (words.length > 0) {
      const conditions = words.map((_, i) =>
        `(LOWER(a.title) LIKE LOWER($${i + 1}) OR LOWER(COALESCE(a.summary,'')) LIKE LOWER($${i + 1}) OR LOWER(a.content) LIKE LOWER($${i + 1}))`
      ).join(' OR ');
      const res = await query(
        `SELECT DISTINCT a.title, a.summary, a.content, a.source_name, a.created_at
         FROM articles a WHERE a.is_published = true AND (${conditions})
         ORDER BY a.created_at DESC LIMIT 10`,
        words.map(w => `%${w}%`)
      );
      rows = res.rows;
    }
    if (rows.length === 0) {
      const fallback = await query(
        `SELECT title, summary, content, source_name, created_at
         FROM articles WHERE is_published = true ORDER BY created_at DESC LIMIT 10`
      );
      rows = fallback.rows;
    }
  }

  if (rows.length === 0) return 'No articles are currently available in the database.';

  return rows.map((a, i) => {
    const date = new Date(a.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    const body = a.summary || a.content?.slice(0, 300) || '';
    return `[${i + 1}] ${a.title} — ${date}${a.source_name ? ` (${a.source_name})` : ''}\n${body}`;
  }).join('\n\n');
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage: string = messages[messages.length - 1].content;

  // Parent trace for the full request
  const trace = langfuse.trace({
    name: 'news-chat',
    input: { userMessage: lastMessage, historyLength: messages.length },
  });

  // ── Step 1: Intent Detection ──
  const intentGeneration = trace.generation({
    name: 'intent-detection',
    model: 'gpt-4o-mini',
    input: lastMessage,
  });

  const intent = await detectIntent(lastMessage, intentGeneration);

  trace.update({ metadata: { intent } });

  // ── State 1: Greeting ──
  if (intent === 'greeting') {
    const reply = "Hello! I'm your AI news assistant. Ask me about today's headlines, last week's stories, or any specific topic — I'll pull from our live news database.";
    trace.update({ output: reply });
    await langfuse.flushAsync();
    return new Response(reply, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // ── State 3: Off-topic ──
  if (intent === 'off_topic') {
    const reply = "I can only help you with news articles present in our database. Try asking about recent AI news, tech stories, or request a weekly summary.";
    trace.update({ output: reply });
    await langfuse.flushAsync();
    return new Response(reply, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // ── State 2: News Question ──

  // Step 2: Article Retrieval
  const retrievalSpan = trace.span({
    name: 'article-retrieval',
    input: { query: lastMessage },
  });

  const context = await fetchArticles(lastMessage);
  const articleCount = context.split('\n\n').length;

  retrievalSpan.end({
    output: { articlesFound: articleCount, preview: context.slice(0, 200) },
  });

  // Step 3: Response Generation (streaming)
  const systemPrompt = `You are an AI news analyst for AI News (news.babandeep.in), a professional technology and AI news platform.

Answer the user's question using only the article context provided below. Be concise, factual, and authoritative.
Use the conversation history to understand follow-up questions — if a user refers to "that article" or "tell me more", use prior context to identify what they mean.

Formatting rules:
- Use markdown: **bold** for article titles, numbered lists for summaries.
- Each numbered list item on a single line.
- If the context does not contain relevant information, say so directly.

--- ARTICLE CONTEXT ---
${context}
--- END CONTEXT ---`;

  // Build LangChain message history from stored conversation
  const langchainMessages = [
    new SystemMessage(systemPrompt),
    ...messages.slice(0, -1).map((m: { role: string; content: string }) =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
    new HumanMessage(lastMessage),
  ];

  const responseGeneration = trace.generation({
    name: 'response-generation',
    model: 'gpt-4o-mini',
    input: langchainMessages.map(m => ({ role: m._getType(), content: m.content })),
  });

  const streamingLlm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    streaming: true,
  });

  const encoder = new TextEncoder();
  let fullOutput = '';

  const readable = new ReadableStream({
    async start(controller) {
      const stream = await streamingLlm.stream(langchainMessages);
      for await (const chunk of stream) {
        const text = typeof chunk.content === 'string' ? chunk.content : '';
        if (text) {
          fullOutput += text;
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();

      responseGeneration.end({ output: fullOutput });
      trace.update({ output: fullOutput });
      await langfuse.flushAsync();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
