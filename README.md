# dsh-media-player

[English](README.en.md)

一个单包、双端的 DeepSeek Harness（DSH）插件：让模型把**可播放的视频/音频或图片**直接内联到聊天里，既可传入绝对 http(s) URL，也可传入**本地文件路径**。以 bundle 方式通过 `cordis.patch.yml` 挂载，不改 dsh 源码。支持 macOS / Windows / Linux。

- **host 半**（`lib/index.js`）：注册模型面向的 `media_add` 工具。模型传入绝对 http(s) 媒体 URL **或本地文件路径**与 MIME 类型，工具校验后追加一条持久化的 `plugin/media-add` 会话事件。本地文件通过仅限本机（loopback）的路由提供，支持 HTTP Range（播放器可拖动进度）。
- **browser 半**（`lib/client.js`）：声明 `media` 的 `ChatNodeDataMap` key，把每条 `plugin/media-add` 事件折叠成一个媒体聊天节点，并通过 `conversation.chat.node` 插槽渲染为原生 `<video controls>` / `<audio controls>` 播放器，或带全屏预览的图片缩略图（滚轮/按钮正负缩放、拖拽平移、重置、Esc 关闭）。

因为媒体是作为会话事件写入的，媒体节点在会话重载、回放与续聊后仍然存在（模型可见 == 已记录）。

## 安装

先问自己一句：**你现在是在 DSH 源码仓库里吗？**（git clone 下来、或本地开发，当前目录在仓库根、能看到 `package.json`）

### 情况 1 · 在 DSH 源码仓库里（git clone / 本地开发）→ 一律用 pnpm

> **git clone 下来的就是源码仓库**，所以 git clone 的人也归这一类、**用 pnpm**，别用裸 `dsh`。

因为仓库里的 `dsh` 是本地命令，必须 `pnpm dsh` 才能调用：

```sh
pnpm dsh plugin --profile web add github:yichengup/dsh-media-player
pnpm dsh --profile web --dump-config    # 验证
```

### 情况 2 · 不在源码仓库（用已安装的 dsh）→ 用裸 dsh

前提：`dsh` 已**全局安装**进 PATH（没有就先装一次，方式随你）：

```sh
npm install -g @deepseek-ai/dsh      # 用 npm 装的人
pnpm add -g @deepseek-ai/dsh         # 用 pnpm 装的人
```

装好后给 profile 加插件：

```sh
dsh plugin --profile web add github:yichengup/dsh-media-player
dsh --profile web --dump-config      # 验证
```

**别混淆，就记这张表：**

| 你现在在哪儿 | 用什么命令 |
| --- | --- |
| DSH 源码仓库里（**含 git clone**）| `pnpm dsh ...` |
| 用已安装的 dsh（不在源码仓库）| `dsh ...`（要先把 dsh 全局装进 PATH）|

> 装完需**重启 DSH（或源码开发 watcher）**才生效。
>
> **⚠️ 安装来源：本插件尚未发布 npm 包，目前只有两种装法——**
> ① **从 GitHub**：`github:yichengup/dsh-media-player`
> ② **本地路径**：`file:` 或绝对路径
> （`npm:`、tarball URL、发布版 `@scope/name` 这些方式**暂不可用**，等发布 npm 后再补充。）

## 重开会话报 `SessionFormatUnsupportedError`？

只在**官方原版 DSH** 上用 `media_add` 加过媒体、再**重新打开旧会话**时才可能遇到。因为 `plugin/media-add` 是第三方插件声明的事件，官方核心默认不认识它——出于安全，遇到不认识且未标记「可忽略」的事件会拒绝重建该会话。**不是数据坏了**，只是让 DSH「认识」这类事件即可。若你的 DSH 已注册过该事件，直接跳过第 2 步。

**以下命令均在 DSH 源码根目录执行**（你 clone / 安装 DSH 源码的那个仓库根目录，**不是**本插件目录；用 `ls package.json` 能列出文件来判断路径正确）。

1. **加一行注册**：打开 `scripts/gen-persistence-catalog.ts`，找到 `DOWNSTREAM_KNOWN_EVENT_TYPES` 数组，若没有则加入 `'plugin/media-add',`（已有则跳过）：

   ```ts
   const DOWNSTREAM_KNOWN_EVENT_TYPES: readonly string[] = [
     // ... 其他官方事件
     'plugin/media-add',
   ]
   ```

2. **重新生成 + 校验 + 重建 + 重启**（仍在 DSH 源码根目录）：

   ```sh
   pnpm run gen-persistence-catalog      # 重新生成已知事件表
   pnpm run verify-persistence-catalog   # 校验（应输出 "... are up to date."）
   pnpm run build:lib:host               # 重建 DSH 宿主
   ```

   然后**重启 DSH 进程**，再打开之前被拒的会话，应能正常加载。

> ⚠️ 别手改自动生成产物 `packages/core/session/src/known-event-types.ts`（下次生成会覆盖并报 stale），要在生成器 `scripts/gen-persistence-catalog.ts` 里加。升级 DSH 后需重新加一次（该文件是仓库内文件，升级可能覆盖）。

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
