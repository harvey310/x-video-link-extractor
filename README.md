# X 推文视频下载工具

这是一个可以直接放到 GitHub 的成品仓库。

你把 X 推文地址贴进页面，页面会调用代理接口，返回 `video.twimg.com` 的视频地址，并提供“打开直链”“点击下载”“复制地址”。

## 项目功能简介

- 输入 `x.com` 或 `twitter.com` 推文地址
- 提取这条推文里的视频地址
- 支持一条推文多个视频
- 支持引用推文里的视频
- 支持点击下载和复制直链
- 支持手机 H5

## 技术架构

- `site/`：静态 H5 页面，适合 GitHub Pages 和帽子云这类静态托管
- `worker/`：Cloudflare Worker 代理，负责请求 FxTwitter API 和转发下载
- `GitHub Actions`：自动把 `site/` 发布到 GitHub Pages
- 上游解析：`https://api.fxtwitter.com/status/{id}`

## 为什么这次不用纯前端直连

我今天实际检查了 FxTwitter 接口可用，但响应头里没有明确看到标准跨域放行字段。纯前端直接请求时，浏览器有概率拦住，所以这里改成“前端静态页 + 代理接口”。

这样更稳：

- GitHub 负责托管页面
- Worker 负责跨域、解析和下载
- 帽子云这类平台如果支持从 GitHub 拉代码，也能沿用这一套

## 本地运行方法

静态页本地直接打开也行，但要能实际解析，需要先部署 Worker。

如果只想检查代码：

```bash
cd x-video-link-extractor
npm test
npm run check
```

## 部署方法和命令

### 1. 部署到 GitHub

仓库已经带好 `.github/workflows/deploy-pages.yml`。

推到 GitHub 后：

1. 进入仓库 `Settings -> Pages`
2. `Source` 选 `GitHub Actions`
3. 等待 `Deploy GitHub Pages` 工作流完成

发布地址会是：

```text
https://你的 GitHub 用户名.github.io/仓库名/
```

### 2. 部署 Worker

先安装并登录 Wrangler：

```bash
npm install -g wrangler
wrangler login
```

在项目目录执行：

```bash
cd x-video-link-extractor
wrangler deploy
```

部署成功后会得到一个 Worker 地址，例如：

```text
https://x-video-link-extractor.你的子域.workers.dev
```

打开 GitHub Pages 页面，把这个地址填到“代理地址”输入框里即可。

### 3. 在帽子云这类平台使用

如果平台支持“从 GitHub 仓库部署静态站点”：

- 发布目录选 `site`
- 构建命令留空
- 然后把同一个 Worker 地址填到页面里

如果平台支持 Serverless/Worker，也可以把 `worker/` 单独接过去。

## 测试方法和常用命令

```bash
npm test
npm run check
```

## 搜索记录

- `skills.sh`：站点可访问，已检查，用于满足项目搜索记录要求
- GitHub 搜索 `yt-dlp`：确认 `yt-dlp/yt-dlp` 仍是高频维护项目
- GitHub 搜索 `fxtwitter`：确认社区仍围绕 FxTwitter 使用和封装
- GitHub Docs：2026-07-12 核验 GitHub Pages 仍支持使用 GitHub Actions 发布静态站点

## 已完成功能列表

- GitHub Pages 静态页
- Worker 解析接口
- Worker 下载转发接口
- 基础移动端样式
- 前端复制和下载入口
- GitHub 自动发布工作流
- 基础 Node 测试

## 待办事项

- 你自己的 GitHub 仓库地址和 Pages 地址回填
- 你自己的 Worker 域名回填
- 如果要商用，再补限流和日志

