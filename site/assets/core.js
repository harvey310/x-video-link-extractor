const SUPPORTED_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
]);

export function extractStatusId(tweetUrl) {
  if (!tweetUrl || typeof tweetUrl !== "string") {
    throw new Error("请输入推文地址");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(tweetUrl.trim());
  } catch {
    throw new Error("地址格式不正确");
  }

  if (!SUPPORTED_HOSTS.has(parsedUrl.hostname)) {
    throw new Error("仅支持 X 或 Twitter 推文地址");
  }

  const match = parsedUrl.pathname.match(/\/status\/(\d+)/);
  if (!match) {
    throw new Error("地址中没有找到推文编号");
  }

  return match[1];
}

export function buildApiUrl(statusId) {
  return `https://api.fxtwitter.com/status/${statusId}`;
}

export function formatBytes(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return "大小未知";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "时长未知";
  }

  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function pickMp4Videos(payload) {
  const tweet = payload?.tweet;
  const baseVideos = tweet?.media?.videos ?? [];
  const quoteVideos = tweet?.quote?.media?.videos ?? [];
  const combinedVideos = [...baseVideos, ...quoteVideos];

  const seen = new Set();
  const normalized = [];

  for (const video of combinedVideos) {
    const variants = video?.variants ?? [];
    const mp4Variants = variants
      .filter((item) => item?.content_type === "video/mp4" && item?.url)
      .sort((left, right) => (right?.bitrate ?? 0) - (left?.bitrate ?? 0));

    if (mp4Variants.length > 0) {
      for (const variant of mp4Variants) {
        if (!seen.has(variant.url)) {
          seen.add(variant.url);
          normalized.push({
            directUrl: variant.url,
            width: video?.width ?? null,
            height: video?.height ?? null,
            bitrate: variant?.bitrate ?? null,
            duration: video?.duration ?? null,
            thumbnailUrl: video?.thumbnail_url ?? "",
            sourceTweetUrl: tweet?.url ?? "",
          });
        }
      }
      continue;
    }

    if (video?.url && !seen.has(video.url)) {
      seen.add(video.url);
      normalized.push({
        directUrl: video.url,
        width: video?.width ?? null,
        height: video?.height ?? null,
        bitrate: null,
        duration: video?.duration ?? null,
        thumbnailUrl: video?.thumbnail_url ?? "",
        sourceTweetUrl: tweet?.url ?? "",
      });
    }
  }

  return normalized;
}

export function buildMetaLines(payload, videos) {
  const tweet = payload?.tweet ?? {};
  const author = tweet?.author?.screen_name ? `@${tweet.author.screen_name}` : "作者未知";
  const createdAt = tweet?.created_at ? new Date(tweet.created_at).toLocaleString("zh-CN", { hour12: false }) : "时间未知";

  return [
    `作者：${author}`,
    `发布时间：${createdAt}`,
    `视频数量：${videos.length}`,
  ];
}
