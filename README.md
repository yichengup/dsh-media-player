# dsh-media-player

[English](README.en.md)

一个单包、双端的 DeepSeek Harness（DSH）插件：让模型把**可播放的视频/音频或图片**直接内联到聊天里，既可传入绝对 http(s) URL，也可传入**本地文件路径**。以 bundle 方式通过 `cordis.patch.yml` 挂载，不改 dsh 源码。支持 macOS / Windows / Linux。

- **host 半**（`lib/index.js`）：注册模型面向的 `media_add` 工具。模型传入绝对 http(s) 媒体 URL **或本地文件路径**与 MIME 类型，工具校验后追加一条持久化的 `plugin/media-add` 会话事件。本地文件通过仅限本机（loopback）的路由提供，支持 HTTP Range（播放器可拖动进度）。
- **browser 半**（`lib/client.js`）：声明 `media` 的 `ChatNodeDataMap` key，把每条 `plugin/media-add` 事件折叠成一个媒体聊天节点，并通过 `conversation.chat.node` 插槽渲染为原生 `<video controls>` / `<audio controls>` 播放器，或带全屏预览的图片缩略图（滚轮/按钮正负缩放、拖拽平移、重置、Esc 关闭）。

因为媒体是作为会话事件写入的，媒体节点在会话重载、回放与续聊后仍然存在（模型可见 == 已记录）。

## 安装

两种场景，选你对应的：

**A. 你是使用者 · 已安装 DSH** —— 用 `dsh` 命令（对已部署实例操作）

裸 `dsh` 只有在「DSH 已被**全局安装**进 PATH」时才有效。若你敲 `dsh` 提示命令找不到，先**用与装 DSH 相同的方式全局装一次**：

```sh
npm install -g @deepseek-ai/dsh        # 用 npm 装 DSH 的人
pnpm add -g @deepseek-ai/dsh           # 用 pnpm 装 DSH 的人
```

装进 PATH 后，再给某个 profile 加插件：

```sh
dsh plugin --profile web add github:yichengup/dsh-media-player
dsh --profile web --dump-config        # 验证 media-player 出现在 bundles
```

> **关键：用哪个包管理器装的 DSH，装插件就用哪个。** npm 全局装 → 裸 `dsh` 即可；用 pnpm 装的 → 那一步也带 `pnpm`（`pnpm dsh ...`）。若你没全局装 dsh、而是在 DSH 源码仓库里跑，请用下方**场景 B**。

**B. 你在 DSH 源码仓库里（开发者 / 修改版）** —— 用 `pnpm`（仓库侧脚本，经 workspace 调用本地 dsh）

```sh
pnpm dsh --profile web add github:yichengup/dsh-media-player
pnpm dsh --profile web --dump-config
```

> 适用：你 **clone 了 DSH 源码**、在仓库目录里干活。命令逻辑与 `dsh` 完全一样，只是带 `pnpm` 前缀。

**怎么选：** 带不带 `pnpm` 前缀，取决你是否正**站在 DSH 源码仓库目录里**——在仓库里用 `pnpm`，对已装实例用 `dsh`。装完需**重启 DSH（或源码开发 watcher）**才生效。任何 pnpm 支持的说明符也都可用（`npm:`、`git+https:`、`file:`、tarball URL、`@scope/name@version`）；本地检出版本直接传其绝对路径或 `file:` 形式。

## 遇到会话报错？先看这里

**🙋 最简单：把报错交给 AI 解决。** 直接在你自己 DSH / AI 助手对话里**重新打开那个会话**，把下面的报错**整段**贴给它，说：

> 「重开会话报 `SessionFormatUnsupportedError`，unknown to this harness。请帮我让 DSH 认识 `plugin/media-add` 这个事件，按步骤解决。」

AI 会带你判断该不该修、定位 DSH 源码根目录、改生成器、跑命令，并在你确认后代为执行。**对不熟悉源码的人，这是第一选择。**

—— 下面是手动解法 ——

装好插件、用 `media_add` 添过媒体之后，如果**重新打开之前的会话**时出现下面这个错误：

```
SessionFormatUnsupportedError: ... unknown to this harness and not marked ignorable; refusing to interpret the log
```

**是否要修，取决于你的 DSH 版本。** `plugin/media-add` 是**第三方插件**声明的事件——官方 DSH 核心**默认不认识它**（官方不会为某个第三方插件预先注册事件类型）。因此：

- 如果你用的是**官方原版** DSH，通常**会**遇到这个报错，需要按下述步骤把事件注册进去；
- 只有当你用的 DSH **已经应用过该项注册**（例如本仓库的修改版，生成器 `DOWNSTREAM_KNOWN_EVENT_TYPES` 已含 `plugin/media-add`），才能跳过这一步。

判定方式：先**直接重开会话**试试；若报错，按下面步骤处理（官方原版的大概率需要）。

**只有在确实报错（或你用较旧 DSH 构建）时才需要动手**：核心是让 DSH「认识」这个事件类型。完整、保姆级的分步指引（含如何装 pnpm、如何定位 DSH 源码根目录、每步命令）请看：
[SESSION-EVENT-REGISTRATION.zh-CN.md（会话报错修复指南）](SESSION-EVENT-REGISTRATION.zh-CN.md)。概要如下：
1. 进入 **DSH 源码根目录**（不是本插件目录），`ls package.json` 确认路径正确；
2. 打开 `scripts/gen-persistence-catalog.ts`，在 `DOWNSTREAM_KNOWN_EVENT_TYPES` 数组里**确认或加入**一行 `'plugin/media-add',`；
3. 运行 `pnpm run gen-persistence-catalog` → `pnpm run verify-persistence-catalog` → `pnpm run build:lib:host`，重建后**重启 DSH**。

> 这既能解决当前报错，也能让之前已写入的旧会话日志重新被读取。

## 使用

让模型添加媒体，或直接调用工具：

```sh
media_add(url="https://example.com/clip.mp4", mimeType="video/mp4", title="Demo clip")
media_add(url="/home/me/Videos/demo.mp4", mimeType="video/mp4")   # 本地路径，自动走服务
media_add(urls=["/a.png", "/b.jpg", "/c.webp"], mimeType="image/png")  # 一次多张，并排展示
```

聊天就会渲染一个内联播放器，或带全屏预览的图片缩略图（可正负缩放、平移）。一次传多张（`urls`）会渲染成一个并排网格节点。支持的 MIME 类型：`video/mp4`、`video/webm`、`audio/mpeg`、`audio/wav`、`audio/ogg`、`audio/mp4`、`image/png`、`image/jpeg`、`image/webp`、`image/gif`。

## 模型面向的 API

| 工具 | 参数 | 行为 |
|---|---|---|
| `media_add` | `urls`（http(s) URL **或本地路径**数组）、`url`（单张简写）、`mimeType`（必填枚举；本地路径自动推断）、`title`（可选） | 校验后追加一条携带 `{ items }` 的 `plugin/media-add` 事件，返回 `{ items }`。多张渲染为一个并排网格节点。 |

## 配置

| 键 | 默认值 | 含义 |
|---|---|---|
| `allowedRoots` | `[~/Downloads, ~/Movies, ~/Videos, ~/Music]` | 允许 `media_add` 提供本地文件的绝对目录；超出这些根目录的本地路径会被拒绝（403）。可用配置追加更多目录。 |

插件无需配置即可挂载；工具每次调用时校验输入。

```yaml
- id: media-player
  name: 'dsh-media-player'
```

**运行时可授权目录（不用重启）。** 允许的目录是**运行时可变**的，直接在你的对话里调用这些工具即可增删：
- `media_roots` —— 列出当前允许的目录（只读）；
- `media_grant_root(dir)` —— 授权一个额外目录，**立即生效**；
- `media_revoke_root(dir)` —— 撤销一个已授权目录，立即生效（勿撤销平台默认媒体目录）。

> ⚠️ 这是**权限**操作（扩大模型可读取的本地文件范围）。因此建议在部署中配合 `tools/pre-execute` 授权策略，让「加目录」这类放权经由**用户确认**，而不是由模型自行决定。

## 文件

`lib/index.js`（host）· `lib/client.js`（browser）· `cordis.patch.yml`（bundle）· `src/`（源码）。

## 已知限制

- **本地文件仅限 loopback。** 本地路径通过仅限本机（loopback）的路由提供；远程/移动端客户端无法获取本地字节。
- **无加载时校验。** URL/MIME 在每次调用时校验；错误 URL 在调用时失败，而非插件加载时。
- **无内置授权策略。** `media_grant_root` 这类授权工具不请求 `ctx.approval` 直接执行；需要「用户确认才放权」的部署，请在装配时加 `tools/pre-execute` 策略，把授权工具的调用纳入确认流程。
- **host 半需要 webserver。** 本地文件路由注册在 DSH webserver 服务上；没有 webserver 的 headless profile 中，远程 URL 节点仍可渲染，但本地路径不可用。
