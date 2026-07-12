# X 推文视频下载工具

一个可以直接部署到帽子云这类静态平台的 H5 工具。

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
- 解析来源：浏览器直接请求 `api.fxtwitter.com/status/{id}`
- 部署方式：直接部署 `public/` 到任意静态网站平台

## 本地预览

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

当前仓库：

```text
https://github.com/harvey310/x-video-link-extractor
```

如果你要新建同类仓库，可以用：

```bash
git init
git add .
git commit -m "feat: add x video extractor"
gh repo create x-video-link-extractor --public --source . --remote origin --push
```

### 云平台

这个项目已经改成纯静态版，帽子云可直接这样配：

- 分支：`main`
- 根目录：`public`
- 构建命令：留空
- 输出目录：留空
- 构建环境变量：留空

如果平台不支持直接选子目录，也可以先把 `public/` 里的三个文件单独上传。

## 环境变量

静态部署不需要额外环境变量。

## 搜索记录

- `skills.sh`：本次只做了轻量检查，站点可访问，但没有直接可复用的现成技能模板适合这个小型 Node 工具。
- GitHub 搜索：`yt-dlp twitter x downloader`、`fxtwitter api twitter x`。结论是 `yt-dlp` 更适合自建后端，`FxTwitter` 更适合先做轻量可部署版本。
- 当前实现选择 `FxTwitter`，原因是部署更轻，不依赖 Python 和 `yt-dlp` 运行环境。

## 已完成功能

- H5 输入页
- 浏览器直连公开解析接口
- 结果列表渲染
- 多清晰度展示
- 复制与下载
- 可直接部署到静态网站平台

## 待办事项

- 增加受限推文的登录态支持
- 增加更完整的异常监控
