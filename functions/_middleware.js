import { isAuthed } from './_lib/auth.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS visitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  path TEXT NOT NULL,
  visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_visitor_events_visited_at ON visitor_events(visited_at);
CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor_id ON visitor_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_path ON visitor_events(path);
`;

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);

  if (!context.env?.DB || url.pathname.startsWith('/api/') || !response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  let visitorId = getCookie(context.request, 'wolhwa_vid');
  const isNewVisitor = !visitorId;
  if (!visitorId) visitorId = crypto.randomUUID();

  try {
    await context.env.DB.prepare('CREATE TABLE IF NOT EXISTS visitor_events (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, path TEXT NOT NULL, visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
    await context.env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_visitor_events_visited_at ON visitor_events(visited_at)').run();
    await context.env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor_id ON visitor_events(visitor_id)').run();
    await context.env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_visitor_events_path ON visitor_events(path)').run();
    await context.env.DB.prepare('INSERT INTO visitor_events (visitor_id, path) VALUES (?, ?)').bind(visitorId, url.pathname || '/').run();
  } catch {
    // Visitor tracking must never break the public site.
    return response;
  }

  if (!isNewVisitor) return response;

  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', `wolhwa_vid=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function getCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}
