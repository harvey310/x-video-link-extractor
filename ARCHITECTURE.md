# 架构说明

## 文件/模块职责

- `site/index.html`：页面骨架，输入代理地址和推文地址，展示解析结果
- `site/assets/styles.css`：页面视觉样式和移动端适配
- `site/assets/app.js`：前端交互逻辑，请求代理接口并渲染结果
- `worker/src/index.js`：代理解析接口和下载转发接口
- `.github/workflows/deploy-pages.yml`：把 `site/` 自动发布到 GitHub Pages
- `wrangler.toml`：Worker 部署配置
- `tests/app.test.js`：校验前端和 Worker 的核心函数

## 模块调用关系

1. 用户在 `site/index.html` 输入 Worker 地址和推文地址
2. `site/assets/app.js` 调用 `POST /api/extract`
3. `worker/src/index.js` 从推文地址里提取状态 ID
4. Worker 请求 `https://api.fxtwitter.com/status/{id}`
5. Worker 把视频列表整理成前端易用格式
6. 前端展示“打开直链”“点击下载”“复制地址”
7. 点击下载时走 Worker 的 `/download`，再由 Worker 转发 `video.twimg.com`

## 关键设计决定和原因

- 不做纯前端直连：因为今天检查上游接口时，没有看到明确跨域放行头，浏览器直连不够稳
- GitHub 只承载静态页：GitHub Pages 不支持 Python 这类服务端语言，所以把代理拆到 Worker
- 下载只允许 `video.twimg.com`：避免把工具变成任意地址下载代理
- 页面里手动填写代理地址：这样 GitHub Pages、帽子云、自定义域名都能复用同一套前端

