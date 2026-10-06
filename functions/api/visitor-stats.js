import { isAuthed, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env.SESSION_SECRET || ''))) {
    return json({ error: '관리자 로그인이 필요합니다.' }, 401);
  }
  if (!env?.DB) return json({ error: '방문자 통계 DB가 연결되지 않았습니다.' }, 503);

  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS visitor_events (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, path TEXT NOT NULL, visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();

    const summary = await env.DB.prepare(`
      SELECT
        COUNT(*) AS pageviews,
        COUNT(DISTINCT visitor_id) AS visitors,
        SUM(CASE WHEN date(visited_at, '+9 hours') = date('now', '+9 hours') THEN 1 ELSE 0 END) AS today_pageviews,
        COUNT(DISTINCT CASE WHEN date(visited_at, '+9 hours') = date('now', '+9 hours') THEN visitor_id END) AS today_visitors,
        SUM(CASE WHEN date(visited_at, '+9 hours') = date('now', '+9 hours', '-1 day') THEN 1 ELSE 0 END) AS yesterday_pageviews,
        COUNT(DISTINCT CASE WHEN date(visited_at, '+9 hours') = date('now', '+9 hours', '-1 day') THEN visitor_id END) AS yesterday_visitors,
        SUM(CASE WHEN visited_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS last30_pageviews,
        COUNT(DISTINCT CASE WHEN visited_at >= datetime('now', '-30 days') THEN visitor_id END) AS last30_visitors
      FROM visitor_events
    `).first();

    const days = await env.DB.prepare(`
      SELECT
        date(visited_at, '+9 hours') AS day,
        COUNT(*) AS pageviews,
        COUNT(DISTINCT visitor_id) AS visitors
      FROM visitor_events
      WHERE visited_at >= datetime('now', '-7 days')
      GROUP BY day
      ORDER BY day DESC
    `).all();

    const pages = await env.DB.prepare(`
      SELECT path, COUNT(*) AS pageviews, COUNT(DISTINCT visitor_id) AS visitors
      FROM visitor_events
      GROUP BY path
      ORDER BY pageviews DESC
      LIMIT 10
    `).all();

    return json({
      summary: summary || {},
      days: days.results || [],
      pages: pages.results || []
    });
  } catch {
    return json({ error: '방문자 통계를 불러오지 못했습니다.' }, 500);
  }
}
