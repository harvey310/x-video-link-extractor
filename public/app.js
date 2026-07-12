const form = document.querySelector("#extract-form");
const input = document.querySelector("#tweet-url");
const message = document.querySelector("#message");
const result = document.querySelector("#result");
const resultTitle = document.querySelector("#result-title");
const meta = document.querySelector("#meta");
const videoList = document.querySelector("#video-list");
const copyFirstButton = document.querySelector("#copy-first");
const submitButton = document.querySelector("#submit-button");
const template = document.querySelector("#video-card-template");

let latestDirectUrl = "";

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

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  setMessage("已复制到剪贴板", "success");
}

function createVariantItem(variant) {
  const li = document.createElement("li");
  const label = [];
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
    const openLink = fragment.querySelector(".action.primary");
    const downloadLink = fragment.querySelector(".action[download]");
    const copyButton = fragment.querySelector(".copy");
    const variantList = fragment.querySelector(".variant-list");

    thumb.src = video.thumbnailUrl || "";
    thumb.alt = `${video.title} 封面`;
    title.textContent = video.title;
    badge.textContent = video.source === "quote" ? "引用推文" : "当前推文";
    videoMeta.textContent = `${video.width || "未知"}x${video.height || "未知"} ｜ ${formatDuration(video.durationSeconds)} ｜ 默认输出最高码率 MP4`;

    openLink.href = video.directUrl;
    downloadLink.href = video.directUrl;
    copyButton.addEventListener("click", async () => {
      try {
        await copyText(video.directUrl);
      } catch {
        setMessage("复制失败，请手动长按链接复制", "error");
      }
    });

    video.variants.forEach((variant) => {
      variantList.append(createVariantItem(variant));
    });

    videoList.append(fragment);
  });

  latestDirectUrl = payload.videos[0]?.directUrl || "";
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
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "解析失败");
    }

    renderVideos(payload);
    setMessage("解析成功，可以直接点击打开或下载", "success");
  } catch (error) {
    const text = error instanceof Error ? error.message : "解析失败";
    setMessage(text, "error");
  } finally {
    submitButton.disabled = false;
  }
});

copyFirstButton.addEventListener("click", async () => {
  if (!latestDirectUrl) {
    setMessage("还没有可复制的结果", "error");
    return;
  }

  try {
    await copyText(latestDirectUrl);
  } catch {
    setMessage("复制失败，请手动复制页面里的直链", "error");
  }
});

