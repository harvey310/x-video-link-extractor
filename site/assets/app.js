const storageKey = "x-video-link-extractor-api-base";
const exampleUrl = "https://x.com/i/status/2074866092632068203";

function normalizeApiBase(input) {
  const value = input.trim().replace(/\/+$/, "");
  return value;
}

function createVideoCard(video, index) {
  const wrapper = document.createElement("article");
  wrapper.className = "video-item";

  const thumbnail = document.createElement("img");
  thumbnail.className = "video-thumb";
  thumbnail.alt = `视频 ${index + 1} 缩略图`;
  thumbnail.src = video.thumbnail_url || "";

  const body = document.createElement("div");
  body.className = "video-body";

  const title = document.createElement("h3");
  title.className = "video-title";
  title.textContent = `视频 ${index + 1}`;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = [
    video.width && video.height ? `${video.width} x ${video.height}` : "尺寸未知",
    video.duration_ms ? `${Math.round(video.duration_ms / 1000)} 秒` : "时长未知",
    video.source === "quote" ? "来自引用推文" : "来自原推文"
  ].join(" · ");

  const links = document.createElement("div");
  links.className = "video-links";

  const direct = document.createElement("a");
  direct.className = "video-link";
  direct.href = video.direct_url;
  direct.target = "_blank";
  direct.rel = "noreferrer";
  direct.textContent = "打开直链";

  const download = document.createElement("a");
  download.className = "video-link";
  download.href = video.download_url;
  download.target = "_blank";
  download.rel = "noreferrer";
  download.textContent = "点击下载";

  const copy = document.createElement("button");
  copy.className = "button ghost";
  copy.textContent = "复制地址";
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(video.direct_url);
    copy.textContent = "已复制";
    window.setTimeout(() => {
      copy.textContent = "复制地址";
    }, 1200);
  });

  links.append(direct, download, copy);
  body.append(title, meta, links);
  wrapper.append(thumbnail, body);

  return wrapper;
}

function renderTweetInfo(container, data) {
  container.innerHTML = "";

  const title = document.createElement("p");
  title.className = "meta";
  title.textContent = `作者：${data.author_name || data.author || "未知"} @${data.author || ""}`;

  const text = document.createElement("p");
  text.className = "tweet-text";
  text.textContent = data.text || "无正文";

  const link = document.createElement("a");
  link.className = "video-link";
  link.href = data.tweet_url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "打开原推文";

  container.append(title, text, link);
}

async function extractVideos({ apiBase, tweetUrl }) {
  const response = await fetch(`${apiBase}/api/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: tweetUrl })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "解析失败");
  }

  return data;
}

function readElements() {
  return {
    apiBaseInput: document.getElementById("apiBase"),
    tweetUrlInput: document.getElementById("tweetUrl"),
    extractButton: document.getElementById("extractButton"),
    exampleButton: document.getElementById("exampleButton"),
    status: document.getElementById("status"),
    resultSection: document.getElementById("resultSection"),
    tweetCard: document.getElementById("tweetCard"),
    videoList: document.getElementById("videoList"),
    copyAllButton: document.getElementById("copyAllButton")
  };
}

function setStatus(node, text, isError = false) {
  node.textContent = text;
  node.style.color = isError ? "#b42318" : "";
}

function bootstrap() {
  const elements = readElements();
  const savedApiBase = localStorage.getItem(storageKey) || "";

  elements.apiBaseInput.value = savedApiBase;
  elements.exampleButton.addEventListener("click", () => {
    elements.tweetUrlInput.value = exampleUrl;
  });

  elements.copyAllButton.addEventListener("click", async () => {
    const links = Array.from(
      elements.videoList.querySelectorAll(".video-link:first-child")
    ).map((node) => node.href);

    await navigator.clipboard.writeText(links.join("\n"));
    setStatus(elements.status, "全部视频地址已复制");
  });

  elements.extractButton.addEventListener("click", async () => {
    const apiBase = normalizeApiBase(elements.apiBaseInput.value);
    const tweetUrl = elements.tweetUrlInput.value.trim();

    if (!apiBase) {
      setStatus(elements.status, "请先填写代理地址", true);
      return;
    }

    if (!tweetUrl) {
      setStatus(elements.status, "请先粘贴推文地址", true);
      return;
    }

    localStorage.setItem(storageKey, apiBase);
    elements.extractButton.disabled = true;
    elements.resultSection.classList.add("hidden");
    setStatus(elements.status, "正在解析，请稍等...");

    try {
      const data = await extractVideos({ apiBase, tweetUrl });

      renderTweetInfo(elements.tweetCard, data);
      elements.videoList.innerHTML = "";
      data.videos.forEach((video, index) => {
        elements.videoList.append(createVideoCard(video, index));
      });
      elements.resultSection.classList.remove("hidden");
      setStatus(elements.status, `解析成功，共找到 ${data.videos.length} 个视频地址`);
    } catch (error) {
      setStatus(elements.status, error.message || "解析失败", true);
    } finally {
      elements.extractButton.disabled = false;
    }
  });
}

bootstrap();

export { normalizeApiBase };

