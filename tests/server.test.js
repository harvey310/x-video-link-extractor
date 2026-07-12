import test from "node:test";
import assert from "node:assert/strict";

import {
  collectVideos,
  extractStatusId,
  normalizeTweetUrl,
  pickMp4Variants,
} from "../server.js";

test("normalizeTweetUrl 会拦截非 X 域名", () => {
  assert.throws(
    () => normalizeTweetUrl("https://example.com/status/1"),
    /仅支持 x.com 或 twitter.com 的推文地址/,
  );
});

test("extractStatusId 能提取推文编号", () => {
  assert.equal(
    extractStatusId("https://x.com/demo/status/2074866092632068203"),
    "2074866092632068203",
  );
});

test("pickMp4Variants 会优先返回高码率 mp4", () => {
  const variants = pickMp4Variants({
    variants: [
      {
        url: "https://video.twimg.com/low.mp4",
        bitrate: 256000,
        content_type: "video/mp4",
      },
      {
        url: "https://video.twimg.com/high.mp4",
        bitrate: 832000,
        content_type: "video/mp4",
      },
      {
        url: "https://video.twimg.com/hls.m3u8",
        bitrate: 999999,
        content_type: "application/x-mpegURL",
      },
    ],
  });

  assert.equal(variants.length, 2);
  assert.equal(variants[0].url, "https://video.twimg.com/high.mp4");
});

test("collectVideos 会合并主推文和引用推文视频", () => {
  const videos = collectVideos({
    url: "https://x.com/demo/status/1",
    media: {
      videos: [
        {
          id: "tweet-1",
          width: 640,
          height: 360,
          duration: 12,
          thumbnail_url: "https://example.com/1.jpg",
          variants: [
            {
              url: "https://video.twimg.com/a.mp4",
              bitrate: 256000,
              content_type: "video/mp4",
            },
          ],
        },
      ],
    },
    quote: {
      media: {
        videos: [
          {
            id: "quote-1",
            width: 1280,
            height: 720,
            duration: 20,
            thumbnail_url: "https://example.com/2.jpg",
            variants: [
              {
                url: "https://video.twimg.com/b.mp4",
                bitrate: 512000,
                content_type: "video/mp4",
              },
            ],
          },
        ],
      },
    },
  });

  assert.equal(videos.length, 2);
  assert.equal(videos[0].source, "tweet");
  assert.equal(videos[1].source, "quote");
});

