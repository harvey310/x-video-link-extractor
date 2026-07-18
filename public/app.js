const form = document.querySelector("#extract-form");
const input = document.querySelector("#tweet-url");
const message = document.querySelector("#message");
const result = document.querySelector("#result");
const resultTitle = document.querySelector("#result-title");
const meta = document.querySelector("#meta");
const videoList = document.querySelector("#video-list");
const submitButton = document.querySelector("#submit-button");
const resetButton = document.querySelector("#reset-button");
const template = document.querySelector("#video-card-template");
const API_BASE = "https://api.fxtwitter.com/status";

function extractStatusId(tweetUrl) {
  let parsed;
  try {
    parsed = new URL(tweetUrl);
  } catch {
    throw new Error("请输入完整的推文地址");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(hostname)) {
    throw new Error("仅支持 x.com 或 twitter.com 的推文地址");
  }

  const match = parsed.pathname.match(/\/status\/(\d+)/);
  if (!match) {
    throw new Error("地址里没有找到推文编号");
  }

  return match[1];
}

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message${type ? ` ${type}` : ""}`;
}

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) {
    return "时长未知";
  }

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainSeconds = total % 60;

  if (hours > 0) {
    return `${hours}小时 ${minutes}分 ${remainSeconds}秒`;
  }
  return `${minutes}分 ${remainSeconds}秒`;
}

function formatBitrate(bitrate) {
  if (!bitrate) {
    return "码率未知";
  }
  return `${Math.round(bitrate / 1000)} kbps`;
}

function createVariantItem(variant) {
  const li = document.createElement("li");
  const label = ["点击打开"];
  if (variant.width && variant.height) {
    label.push(`${variant.width}x${variant.height}`);
  }
  label.push(formatBitrate(variant.bitrate));

  const link = document.createElement("a");
  link.href = variant.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = `${label.join(" · ")} 直链`;
  li.append(link);
  return li;
}

function pickMp4Variants(video) {
  const sourceVariants = Array.isArray(video.formats) && video.formats.length > 0
    ? video.formats
    : Array.isArray(video.variants)
      ? video.variants
      : [];

  const mp4Variants = sourceVariants
    .map((item) => ({
      url: item.url,
      bitrate: item.bitrate ?? 0,
      width: item.width ?? null,
      height: item.height ?? null,
      contentType: item.content_type || item.container || ""
    }))
    .filter((item) => typeof item.url === "string" && (item.url.includes(".mp4") || item.contentType.includes("mp4")))
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  if (mp4Variants.length === 0 && typeof video.url === "string" && video.url.includes(".mp4")) {
    mp4Variants.push({
      url: video.url,
      bitrate: 0,
      width: video.width ?? null,
      height: video.height ?? null,
      contentType: "video/mp4"
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

function collectVideos(tweet) {
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

async function fetchTweetVideos(tweetUrl) {
  const statusId = extractStatusId(tweetUrl);
  const response = await fetch(`${API_BASE}/${statusId}`, {
    headers: {
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

  return {
    statusId,
    tweetUrl: payload.tweet.url || tweetUrl,
    author: payload.tweet.author?.screen_name || "",
    authorName: payload.tweet.author?.name || "",
    text: payload.tweet.text || "",
    createdAt: payload.tweet.created_at || "",
    videos: collectVideos(payload.tweet)
  };
}

function renderVideos(payload) {
  const authorText = payload.author
    ? `作者：${payload.authorName ? `${payload.authorName}（@${payload.author}）` : `@${payload.author}`}`
    : "作者：未知";
  meta.textContent = `${authorText} ｜ 推文编号：${payload.statusId}${payload.createdAt ? ` ｜ 发布时间：${payload.createdAt}` : ""}`;
  resultTitle.textContent = `共找到 ${payload.videos.length} 条视频`;

  videoList.innerHTML = "";
  payload.videos.forEach((video) => {
    const fragment = template.content.cloneNode(true);
    const thumb = fragment.querySelector(".thumb");
    const title = fragment.querySelector(".video-title");
    const badge = fragment.querySelector(".video-badge");
    const videoMeta = fragment.querySelector(".video-meta");
    const variantList = fragment.querySelector(".variant-list");

    thumb.src = video.thumbnailUrl || "";
    thumb.alt = `${video.title} 封面`;
    title.textContent = video.title;
    badge.textContent = video.source === "quote" ? "引用推文" : "当前推文";
    videoMeta.textContent = `${video.width || "未知"}x${video.height || "未知"} ｜ ${formatDuration(video.durationSeconds)} ｜ 直接点下面链接打开视频`;

    video.variants.forEach((variant) => {
      variantList.append(createVariantItem(variant));
    });

    videoList.append(fragment);
  });
  result.classList.remove("hidden");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = input.value.trim();
  if (!url) {
    setMessage("请先输入推文地址", "error");
    return;
  }

  submitButton.disabled = true;
  result.classList.add("hidden");
  setMessage("正在解析，请稍等...");

  try {
    const payload = await fetchTweetVideos(url);
    renderVideos(payload);
    setMessage("解析成功，可以直接点击打开或下载", "success");
  } catch (error) {
    const text = error instanceof Error ? error.message : "解析失败";
    setMessage(text, "error");
  } finally {
    submitButton.disabled = false;
  }
});

resetButton.addEventListener("click", () => {
  input.value = "";
  result.classList.add("hidden");
  videoList.innerHTML = "";
  meta.textContent = "";
  setMessage("");
  input.focus();
});
