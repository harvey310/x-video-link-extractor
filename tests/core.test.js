import test from "node:test";
import assert from "node:assert/strict";

import {
  buildApiUrl,
  extractStatusId,
  formatDuration,
  pickMp4Videos,
} from "../site/assets/core.js";

test("extractStatusId 支持 x.com 地址", () => {
  assert.equal(
    extractStatusId("https://x.com/i/status/2074866092632068203"),
    "2074866092632068203",
  );
});

test("extractStatusId 支持 twitter.com 用户路径", () => {
  assert.equal(
    extractStatusId("https://twitter.com/example/status/1234567890"),
    "1234567890",
  );
});

test("extractStatusId 遇到非 X 地址时报错", () => {
  assert.throws(
    () => extractStatusId("https://example.com/status/123"),
    /仅支持 X 或 Twitter 推文地址/,
  );
});

test("buildApiUrl 输出正确接口地址", () => {
  assert.equal(
    buildApiUrl("2074866092632068203"),
    "https://api.fxtwitter.com/status/2074866092632068203",
  );
});

test("formatDuration 按分秒格式输出", () => {
  assert.equal(formatDuration(716.962), "11:57");
});

test("pickMp4Videos 提取并按码率排序", () => {
  const payload = {
    tweet: {
      url: "https://x.com/i/status/1",
      media: {
        videos: [
          {
            width: 1920,
            height: 1080,
            duration: 120,
            thumbnail_url: "https://example.com/thumb.jpg",
            variants: [
              {
                url: "https://video.twimg.com/low.mp4",
                bitrate: 256000,
                content_type: "video/mp4",
              },
              {
                url: "https://video.twimg.com/high.mp4",
                bitrate: 10368000,
                content_type: "video/mp4",
              },
            ],
          },
        ],
      },
    },
  };

  const videos = pickMp4Videos(payload);
  assert.equal(videos.length, 2);
  assert.equal(videos[0].directUrl, "https://video.twimg.com/high.mp4");
  assert.equal(videos[1].directUrl, "https://video.twimg.com/low.mp4");
});
