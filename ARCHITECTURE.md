# 架构说明

## 模块职责

- `server.js`：提供静态页面和 `/api/extract` 解析接口。
- `public/index.html`：页面结构和结果容器。
- `public/styles.css`：移动端优先的页面样式。
- `public/app.js`：表单提交、接口调用、结果渲染、复制下载。
- `tests/server.test.js`：验证服务端核心解析逻辑。
- `.github/workflows/quality.yml`：在 GitHub 上自动跑测试。

## 调用关系

页面提交推文地址
-> `public/app.js` 发起 `POST /api/extract`
-> `server.js` 提取推文编号并请求 FxTwitter
-> `server.js` 整理视频数据
-> `public/app.js` 渲染视频卡片和下载链接

## 关键设计决定

- 采用同域后端代理，而不是浏览器直接请求 FxTwitter。原因是浏览器跨域不稳定，同域接口更稳。
- 先用 Node 原生模块，不引入 Express。原因是部署更轻，依赖更少。
- 先用 FxTwitter 作为默认解析服务，不内置 `yt-dlp`。原因是当前目标是尽快放到 GitHub 并可被云平台直接部署。
