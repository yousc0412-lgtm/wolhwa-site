export async function onRequestGet({ request }) {
  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get("url");
  if (!target) return json({ error: "url이 필요합니다." }, 400);

  let u;
  try { u = new URL(target); } catch { return json({ error: "올바른 URL이 아닙니다." }, 400); }
  if (!["instagram.com", "www.instagram.com", "m.instagram.com"].includes(u.hostname) ||
      !/^\/(p|reel|tv)\//.test(u.pathname)) {
    return json({ error: "Instagram 게시물/릴스 URL만 지원합니다." }, 400);
  }

  try {
    const res = await fetch(u.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"
      },
      cf: { cacheTtl: 300, cacheEverything: false }
    });
    if (!res.ok) return json({ error: `Instagram 응답 오류: ${res.status}` }, 502);
    const html = await res.text();
    const images = extractImages(html);
    return json({ source: u.toString(), images: [...new Set(images)].slice(0, 30) });
  } catch (e) {
    return json({ error: "Instagram 페이지를 가져오지 못했습니다." }, 502);
  }
}

function extractImages(html) {
  const out = [];
  const add = (s) => {
    if (!s) return;
    let x = s.replace(/\\u0026/g, "&").replace(/\\u003D/g, "=").replace(/\\u002F/g, "/")
      .replace(/&amp;/g, "&").replace(/\\\"/g, '"');
    try { x = JSON.parse('"'+x.replace(/"/g, '\\\"')+'"'); } catch {}
    if (/^https?:\/\//i.test(x) && /\.(?:jpg|jpeg|png|webp)(?:[?#]|$)/i.test(x) &&
        /(cdninstagram|fbcdn|instagram)/i.test(x)) out.push(x);
  };

  const meta = /<meta[^>]+(?:property|name)=[\"'](?:og:image|twitter:image)[\"'][^>]+content=[\"']([^\"']+)[\"']/gi;
  let m; while ((m = meta.exec(html))) add(m[1]);

  const patterns = [
    /"display_url":"([^"]+)"/g,
    /"thumbnail_src":"([^"]+)"/g,
    /"url":"(https?:\\?\/\\?\/[^"]+)"/g,
    /\"display_url\":\"([^"]+)\"/g,
    /\"thumbnail_src\":\"([^"]+)\"/g
  ];
  for (const re of patterns) { let x; while ((x = re.exec(html))) add(x[1]); }

  return out;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}