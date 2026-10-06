export async function onRequestGet({ request }) {
  const reqUrl = new URL(request.url);
  let target = reqUrl.searchParams.get("url");
  if (!target) return json({ error: "Instagram 게시물 링크가 필요합니다." }, 400);
  let input;
  try { target = target.trim().replace(/[<>]/g, ""); input = new URL(target); }
  catch { return json({ error: "올바른 Instagram URL이 아닙니다." }, 400); }
  if (!["instagram.com", "www.instagram.com", "m.instagram.com"].includes(input.hostname))
    return json({ error: "Instagram 주소만 입력할 수 있습니다." }, 400);
  if (!/^\/(?:share\/)?(p|reel|tv)\//.test(input.pathname))
    return json({ error: "Instagram 게시물 또는 릴스 링크를 그대로 입력해 주세요." }, 400);

  try {
    const pages = [];
    const first = await fetchInstagram(input.toString());
    if (!first.ok) return json({ error: `Instagram 페이지에 접근할 수 없습니다. (HTTP ${first.status})` }, 502);
    pages.push(first.html);

    const finalUrl = new URL(first.finalUrl || input.toString());
    const match = finalUrl.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);
    if (match) {
      try {
        const embedded = await fetchInstagram(`https://www.instagram.com/${match[1]}/${match[2]}/embed/`);
        if (embedded.ok) pages.push(embedded.html);
      } catch {}
    }

    const images = extractImages(pages.join("\n"));
    return json({ source: finalUrl.toString(), images: images.slice(0, 30) });
  } catch {
    return json({ error: "Instagram 페이지를 읽지 못했습니다. 잠시 후 다시 시도해 주세요." }, 502);
  }
}

async function fetchInstagram(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    },
    cf: { cacheTtl: 60, cacheEverything: false }
  });
  return { ok: res.ok, status: res.status, finalUrl: res.url, html: await res.text() };
}

function extractImages(html) {
  const found = [];
  const seen = new Set();

  const decode = (value) => {
    if (!value) return "";
    let x = value.replace(/\\u0026/g, "&").replace(/\\u003D/g, "=")
      .replace(/\\u002F/g, "/").replace(/&amp;/g, "&").replace(/\\\//g, "/");
    return x;
  };

  const add = (raw, priority = false) => {
    const x = decode(raw);
    if (!/^https?:\/\//i.test(x)) return;
    if (!/(cdninstagram|fbcdn|instagram)/i.test(x)) return;
    if (!/[?&](?:stp|se)=|\/v\d+\/|\.jpe?g(?:[?#]|$)|\.png(?:[?#]|$)|\.webp(?:[?#]|$)/i.test(x)) return;
    if (!seen.has(x)) { seen.add(x); found.push({ url: x, priority }); }
  };

  const metas = [
    /<meta[^>]+(?:property|name)=[\"'](?:og:image|twitter:image)[\"'][^>]+content=[\"']([^\"']+)[\"']/gi,
    /<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+(?:property|name)=[\"'](?:og:image|twitter:image)[\"']/gi
  ];
  for (const re of metas) { let m; while ((m = re.exec(html))) add(m[1], true); }

  const patterns = [
    /"display_url"\s*:\s*"([^"]+)"/gi,
    /"thumbnail_src"\s*:\s*"([^"]+)"/gi,
    /"image_versions2"\s*:\s*\{[\s\S]{0,5000}?"url"\s*:\s*"([^"]+)"/gi,
    /"carousel_media"\s*:\s*\[[\s\S]{0,50000}?"url"\s*:\s*"([^"]+)"/gi,
    /"url"\s*:\s*"(https?:\\?\\?/[^"]+)"/gi,
    /"url"\s*:\s*"(https?:\/\/[^"]+)"/gi
  ];
  for (const re of patterns) { let m; while ((m = re.exec(html))) add(m[1]); }

  return found.sort((a,b) => Number(b.priority) - Number(a.priority)).map(x => x.url);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" }
  });
}