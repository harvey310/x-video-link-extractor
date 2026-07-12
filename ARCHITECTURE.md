# 架构说明

## 模块职责

- `public/index.html`：页面结构和结果容器。
- `public/styles.css`：移动端优先的页面样式。
- `public/app.js`：表单提交、调用公开解析接口、结果渲染、复制下载。
- `server.js`：保留本地 Node 预览和兼容能力，不再是帽子云部署必需项。
- `tests/server.test.js`：验证保留的核心解析逻辑。
- `.github/workflows/quality.yml`：在 GitHub 上自动跑测试。

## 调用关系

页面提交推文地址
-> `public/app.js` 直接请求 FxTwitter
-> 前端整理视频数据
-> 前端渲染视频卡片和下载链接

## 关键设计决定

- 改成浏览器直接请求 FxTwitter。原因是确认该接口已开放跨域，能满足帽子云静态站限制。
- 保留 Node 预览入口，但不把它作为正式静态部署依赖。
- 继续使用 FxTwitter，不内置 `yt-dlp`。原因是当前目标是最轻地部署到静态平台。
