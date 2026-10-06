export async function onRequestGet({ request, env }) {
  const reqUrl = new URL(request.url);
  let target = reqUrl.searchParams.get("url");

  if (!target) return json({ error: "Instagram 게시물 링크가 필요합니다." }, 400);
  if (!env?.APIFY_API_TOKEN) {
    return json({ error: "Instagram 추출 서비스가 아직 설정되지 않았습니다. 관리자 설정을 확인해 주세요." }, 500);
  }

  let input;
  try {
    target = target.trim().replace(/[<>]/g, "");
    input = new URL(target);
  } catch {
    return json({ error: "올바른 Instagram URL이 아닙니다." }, 400);
  }

  if (!["instagram.com", "www.instagram.com", "m.instagram.com"].includes(input.hostname)) {
    return json({ error: "Instagram 주소만 입력할 수 있습니다." }, 400);
  }

  const path = input.pathname.replace(/\/+$/, "");
  if (!/^\/(?:share\/)?(p|reel|tv)\//.test(path)) {
    return json({ error: "Instagram 게시물 또는 릴스 링크를 그대로 입력해 주세요." }, 400);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let response;
    try {
      response = await fetch(
        "https://api.apify.com/v2/acts/crawlerbros~instagram-post-scraper/run-sync-get-dataset-items",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.APIFY_API_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ post_urls: [target] }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const rawText = await response.text();
    let data;
    try { data = JSON.parse(rawText); } catch { data = null; }

    if (!response.ok) {
      const detail = data?.error?.message || data?.message || `Apify HTTP ${response.status}`;
      return json({ error: `이미지 추출 서비스에 연결하지 못했습니다. (${detail})` }, 502);
    }

    const rows = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
    if (!rows.length) {
      return json({ error: "Instagram 게시물 정보를 찾지 못했습니다. 공개 게시물인지 확인해 주세요." }, 404);
    }

    const row = rows[0];
    if (row?.error || row?._error || row?.status === "failed" || row?.is_unavailable === true) {
      return json({ error: row.error || row._errorDetail || row._error || "해당 게시물을 가져올 수 없습니다. 공개 게시물인지 확인해 주세요." }, 404);
    }

    const images = extractImages(row);
    if (!images.length) {
      return json({ error: "게시물은 확인했지만 이미지 주소를 찾지 못했습니다. 잠시 후 다시 시도해 주세요." }, 404);
    }

    return json({
      source: row.post_url || row.url || target,
      images: images.slice(0, 30)
    });
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "이미지 추출 시간이 너무 오래 걸렸습니다. 잠시 후 다시 시도해 주세요."
      : "이미지 추출 서비스와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return json({ error: message }, 502);
  }
}

function extractImages(row) {
  const found = [];
  const seen = new Set();

  const add = (value) => {
    if (typeof value !== "string") return;
    const url = value
      .replace(/\\u0026/g, "&")
      .replace(/\\u003D/g, "=")
      .replace(/\\u002F/g, "/")
      .replace(/&amp;/g, "&")
      .replace(/\\\//g, "/")
      .trim();

    if (!/^https?:\/\//i.test(url)) return;
    if (!/(cdninstagram|fbcdn|instagram)/i.test(url)) return;
    if (seen.has(url)) return;
    seen.add(url);
    found.push(url);
  };

  const addMediaItems = (items) => {
    if (!Array.isArray(items)) return;
    const ordered = [...items].sort((a, b) => Number(a?.index ?? 0) - Number(b?.index ?? 0));

    for (const item of ordered) {
      const type = String(item?.type || item?.media_type || item?.mediaType || "").toLowerCase();
      // This tool is for photos. Skip video-only carousel entries.
      if (type && !type.includes("photo") && !type.includes("image")) continue;

      add(item?.url);
      add(item?.image_url);
      add(item?.image);
      add(item?.display_url);
      add(item?.thumbnail_url);
      add(item?.thumbnail);
    }
  };

  // crawlerbros/instagram-post-scraper returns every carousel slide
  // in media_items, preserving its order.
  addMediaItems(row.media_items);
  addMediaItems(row.mediaItems);

  // Fallbacks for alternate output shapes.
  add(row.image_url);
  add(row.image);
  add(row.thumbnail_url);
  add(row.thumbnail);

  if (Array.isArray(row.imageUrls)) {
    for (const url of row.imageUrls) add(url);
  }

  if (Array.isArray(row.mediaUrls)) {
    for (const url of row.mediaUrls) add(url);
  }

  if (Array.isArray(row.carousel_media)) {
    addMediaItems(row.carousel_media);
  }

  if (Array.isArray(row.media)) {
    addMediaItems(row.media);
  }

  return found;
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}