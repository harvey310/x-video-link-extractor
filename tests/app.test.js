import test from "node:test";
import assert from "node:assert/strict";

import { normalizeApiBase } from "../site/assets/app.js";
import { extractTweetId, normalizeVideos } from "../worker/src/index.js";

test("normalizeApiBase 会去掉结尾斜杠", () => {
  assert.equal(normalizeApiBase("https://demo.example.com///"), "https://demo.example.com");
});

test("extractTweetId 支持 x.com 和 twitter.com", () => {
  assert.equal(
    extractTweetId("https://x.com/i/status/2074866092632068203"),
    "2074866092632068203"
  );
  assert.equal(
    extractTweetId("https://twitter.com/demo/status/1234567890"),
    "1234567890"
  );
});

test("extractTweetId 会拦截非 X 域名", () => {
  assert.equal(extractTweetId("https://example.com/status/1"), null);
});

test("normalizeVideos 会展开原推文和引用推文视频", () => {
  const videos = normalizeVideos(
    {
      media: {
        videos: [
          {
            url: "https://video.twimg.com/a.mp4",
            width: 640,
            height: 360,
            duration: 12000
          }
        ]
      },
      quote: {
        media: {
          videos: [
            {
              url: "https://video.twimg.com/b.mp4",
              width: 1280,
              height: 720,
              duration: 20000
            }
          ]
        }
      }
    },
    "https://proxy.example.com"
  );

  assert.equal(videos.length, 2);
  assert.equal(
    videos[0].download_url,
    "https://proxy.example.com/download?url=https%3A%2F%2Fvideo.twimg.com%2Fa.mp4"
  );
  assert.equal(videos[1].source, "quote");
});

