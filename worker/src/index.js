const DEFAULT_API_BASE = "https://api.fxtwitter.com";

function buildCorsHeaders(origin, allowedOrigin) {
  const resolvedOrigin = allowedOrigin === "*" ? "*" : origin || allowedOrigin;
  return {
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

function extractTweetId(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, "");

    if (!["x.com", "twitter.com"].includes(host)) {
      return null;
    }

    const match = parsed.pathname.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function normalizeVideos(tweet, proxyBase) {
  const media = tweet?.media || {};
  const videos = [];
  const pushVideos = (items, source) => {
    for (const item of items || []) {
      if (!item?.url) {
        continue;
      }

      videos.push({
        source,
        type: item.type || "video",
        width: item.width || null,
        height: item.height || null,
        duration_ms: item.duration || null,
        thumbnail_url: item.thumbnail_url || null,
        direct_url: item.url,
        download_url: `${proxyBase}/download?url=${encodeURIComponent(item.url)}`,
        format: item.format || "mp4"
      });
    }
  };

  pushVideos(media.videos, "tweet");
  pushVideos(tweet?.quote?.media?.videos, "quote");

  return videos;
}

async function handleExtract(request, env, corsHeaders) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ message: "请求体不是合法 JSON" }, 400, corsHeaders);
  }

  const tweetUrl = `${payload?.url || ""}`.trim();
  const tweetId = extractTweetId(tweetUrl);

  if (!tweetId) {
    return json({ message: "请输入有效的 X 推文地址" }, 400, corsHeaders);
  }

  const apiBase = env.UPSTREAM_API_BASE || DEFAULT_API_BASE;
  const upstream = await fetch(`${apiBase}/status/${tweetId}`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "x-video-link-extractor/1.0"
    }
  });

  if (!upstream.ok) {
    return json(
      { message: `上游解析失败，状态码 ${upstream.status}` },
      502,
      corsHeaders
    );
  }

  const data = await upstream.json();

  if (data?.code !== 200 || !data?.tweet) {
    return json(
      { message: data?.message || "未取到推文内容" },
      502,
      corsHeaders
    );
  }

  const proxyBase = new URL(request.url).origin;
  const videos = normalizeVideos(data.tweet, proxyBase);

  if (!videos.length) {
    return json({ message: "这条推文里没有可下载视频" }, 404, corsHeaders);
  }

  return json(
    {
      tweet_id: tweetId,
      tweet_url: data.tweet.url,
      author: data.tweet.author?.screen_name || "",
      author_name: data.tweet.author?.name || "",
      text: data.tweet.text || "",
      created_at: data.tweet.created_at || "",
      videos
    },
    200,
    corsHeaders
  );
}

async function handleDownload(request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("缺少 url 参数", { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("下载地址格式不正确", { status: 400 });
  }

  if (parsed.hostname !== "video.twimg.com") {
    return new Response("只允许下载 video.twimg.com 资源", { status: 403 });
  }

  const range = request.headers.get("Range");
  const upstream = await fetch(parsed.toString(), {
    headers: range ? { Range: range } : undefined
  });

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const corsHeaders = buildCorsHeaders(
      request.headers.get("Origin"),
      allowedOrigin
    );

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (url.pathname === "/api/extract" && request.method === "POST") {
      return handleExtract(request, env, corsHeaders);
    }

    if (url.pathname === "/download" && request.method === "GET") {
      return handleDownload(request);
    }

    return json({ message: "Not Found" }, 404, corsHeaders);
  }
};

export { extractTweetId, normalizeVideos };

