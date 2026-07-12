# X 推文视频下载工具

一个可以直接部署的 H5 工具。

你只需要粘贴 `x.com` 或 `twitter.com` 的推文地址，页面就会返回可点击、可下载的 `video.twimg.com` 视频直链。

## 功能简介

- 输入 X 推文地址
- 自动提取推文编号
- 调用 FxTwitter 开源服务解析视频信息
- 输出最高码率 MP4 直链
- 展示全部可用清晰度
- 支持手机端打开
- 支持复制直链、打开直链、直接下载

## 技术架构

- 前端：原生 HTML + CSS + JavaScript
- 后端：Node.js 原生 `http` 服务
- 解析来源：`api.fxtwitter.com/status/{id}`
- 部署方式：代码先放 GitHub，再接任意支持 Node 的托管平台

## 本地运行

要求：

- Node.js 20 或更高版本

启动：

```bash
npm start
```

开发模式：

```bash
npm run dev
```

打开：

```text
http://127.0.0.1:3000
```

## 测试方法

执行：

```bash
npm test
```

## 部署方法

### GitHub

```bash
git init
git add .
git commit -m "feat: add x video extractor"
gh repo create x-video-link-extractor --private --source . --remote origin --push
```

### 云平台

这个项目是标准 Node 服务，支持以下方式：

- 直接从 GitHub 导入，启动命令填 `npm start`
- 容器部署时，暴露 `PORT` 环境变量即可
- 如果平台支持自动识别 Node 项目，通常无需额外改造

## 环境变量

- `PORT`：服务端口，默认 `3000`
- `HOST`：监听地址，默认 `0.0.0.0`
- `FXTWITTER_API_BASE`：解析接口地址，默认 `https://api.fxtwitter.com/status`

## 搜索记录

- `skills.sh`：本次只做了轻量检查，站点可访问，但没有直接可复用的现成技能模板适合这个小型 Node 工具。
- GitHub 搜索：`yt-dlp twitter x downloader`、`fxtwitter api twitter x`。结论是 `yt-dlp` 更适合自建后端，`FxTwitter` 更适合先做轻量可部署版本。
- 当前实现选择 `FxTwitter`，原因是部署更轻，不依赖 Python 和 `yt-dlp` 运行环境。

## 已完成功能

- H5 输入页
- 同域解析接口
- 结果列表渲染
- 多清晰度展示
- 复制与下载
- GitHub Actions 自动测试
- 可直接被云平台从 GitHub 拉起

## 待办事项

- 增加受限推文的登录态支持
- 增加 `yt-dlp` 自建后端可切换模式
- 增加更完整的异常监控
