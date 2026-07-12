import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const apiBase = process.env.FXTWITTER_API_BASE || "https://api.fxtwitter.com/status";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

export function normalizeTweetUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("请输入完整的 X 推文地址");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(hostname)) {
    throw new Error("仅支持 x.com 或 twitter.com 的推文地址");
  }

  return parsed.toString();
}

export function extractStatusId(tweetUrl) {
  const match = tweetUrl.match(/\/status\/(\d+)/);
  if (!match) {
    throw new Error("地址里没有找到推文编号");
  }
  return match[1];
}

export function pickMp4Variants(video) {
  const sourceVariants = Array.isArray(video.formats) && video.formats.length > 0
    ? video.formats
    : Array.isArray(video.variants)
      ? video.variants
      : [];

  const mp4Variants = sourceVariants
    .map((item) => ({
      url: item.url,
      bitrate: item.bitrate ?? 0,
      container: item.container || item.content_type || "",
      width: item.width ?? null,
      height: item.height ?? null
    }))
    .filter((item) => typeof item.url === "string" && item.url.includes(".mp4"))
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  if (mp4Variants.length === 0 && typeof video.url === "string" && video.url.includes(".mp4")) {
    mp4Variants.push({
      url: video.url,
      bitrate: 0,
      container: "mp4",
      width: video.width ?? null,
      height: video.height ?? null
    });
  }

  return mp4Variants;
}

function normalizeVideo(video, index, source) {
  const variants = pickMp4Variants(video);
  if (variants.length === 0) {
    return null;
  }

  const bestVariant = variants[0];
  return {
    id: video.id || `${source}-${index + 1}`,
    source,
    title: `${source === "quote" ? "引用推文" : "当前推文"}视频 ${index + 1}`,
    thumbnailUrl: video.thumbnail_url || "",
    durationSeconds: video.duration ?? null,
    width: video.width ?? bestVariant.width ?? null,
    height: video.height ?? bestVariant.height ?? null,
    directUrl: bestVariant.url,
    variants
  };
}

export function collectVideos(tweet) {
  const currentVideos = (tweet?.media?.videos || [])
    .map((video, index) => normalizeVideo(video, index, "tweet"))
    .filter(Boolean);
  const quoteVideos = (tweet?.quote?.media?.videos || [])
    .map((video, index) => normalizeVideo(video, index, "quote"))
    .filter(Boolean);

  const allVideos = [...currentVideos, ...quoteVideos];
  if (allVideos.length === 0) {
    throw new Error("这条推文里没有可下载的视频");
  }

  return allVideos;
}

export async function fetchTweetVideos(tweetUrl) {
  const normalizedUrl = normalizeTweetUrl(tweetUrl);
  const statusId = extractStatusId(normalizedUrl);
  const response = await fetch(`${apiBase}/${statusId}`, {
    headers: {
      "User-Agent": "x-video-link-extractor/1.0",
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`解析服务返回异常：${response.status}`);
  }

  const payload = await response.json();
  if (payload?.code !== 200 || !payload.tweet) {
    throw new Error(payload?.message || "解析服务没有返回有效结果");
  }

  const videos = collectVideos(payload.tweet);
  return {
    statusId,
    tweetUrl: payload.tweet.url || normalizedUrl,
    author: payload.tweet.author?.screen_name || "",
    authorName: payload.tweet.author?.name || "",
    text: payload.tweet.text || "",
    createdAt: payload.tweet.created_at || "",
    videos
  };
}

async function handleExtract(req, res) {
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    const payload = JSON.parse(body || "{}");
    const url = typeof payload.url === "string" ? payload.url.trim() : "";
    if (!url) {
      return json(res, 400, { error: "请先输入推文地址" });
    }

    const result = await fetchTweetVideos(url);
    return json(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析失败";
    return json(res, 400, { error: message });
  }
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const cleanPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const resolvedPath = path.normalize(path.join(publicDir, cleanPath));

  if (!resolvedPath.startsWith(publicDir) || !existsSync(resolvedPath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = contentTypes[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(resolvedPath).pipe(res);
}

export function createAppServer() {
  return createServer(async (req, res) => {
    if (!req.url) {
      return json(res, 400, { error: "无效请求" });
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "POST" && requestUrl.pathname === "/api/extract") {
      return handleExtract(req, res);
    }

    if (req.method === "GET") {
      return serveStatic(req, res);
    }

    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
  });
}

function shouldStartServer() {
  if (!process.argv[1]) {
    return false;
  }

  return path.resolve(process.argv[1]) === __filename;
}

if (shouldStartServer()) {
  const server = createAppServer();
  server.listen(port, host, () => {
    console.log(`x-video-link-extractor running at http://${host}:${port}`);
  });
}

export {
  collectVideos,
  extractStatusId,
  normalizeTweetUrl,
  pickMp4Variants,
  shouldStartServer,
};
