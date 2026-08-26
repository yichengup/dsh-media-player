# dsh-media-player

[English](README.md)

一个单包、双端的 DeepSeek Harness（DSH）插件：让模型把**可播放的视频/音频或图片**直接内联到聊天里，既可传入绝对 http(s) URL，也可传入**本地文件路径**。以 bundle 方式通过 `cordis.patch.yml` 挂载，不改 dsh 源码。支持 macOS / Windows / Linux。

- **host 半**（`lib/index.js`）：注册模型面向的 `media_add` 工具。模型传入绝对 http(s) 媒体 URL **或本地文件路径**与 MIME 类型，工具校验后追加一条持久化的 `plugin/media-add` 会话事件。本地文件通过仅限本机（loopback）的路由提供，支持 HTTP Range（播放器可拖动进度）。
- **browser 半**（`lib/client.js`）：声明 `media` 的 `ChatNodeDataMap` key，把每条 `plugin/media-add` 事件折叠成一个媒体聊天节点，并通过 `conversation.chat.node` 插槽渲染为原生 `<video controls>` / `<audio controls>` 播放器，或带全屏预览的图片缩略图（滚轮/按钮正负缩放、拖拽平移、重置、Esc 关闭）。

因为媒体是作为会话事件写入的，媒体节点在会话重载、回放与续聊后仍然存在（模型可见 == 已记录）。

## 安装

装进某个 profile（自动把 bundle 加进 `dsh.profile.bundles` 并 reconcile）。按需选择来源：

```sh
# npm（发布本包后）
dsh plugin --profile web add dsh-media-player

# Git 仓库（pnpm 风格 git 说明符；私有仓库 + SSH 亦可）
dsh plugin --profile web add github:yichengup/dsh-media-player

# 本地路径（链接源码）
dsh plugin --profile web add <本包的绝对路径>
dsh plugin --profile web add file:<本包的绝对路径>
```

> `dsh plugin add` 是 `pnpm add` 的转发器，因此任何 pnpm 支持的说明符都可用
> （`npm:`、`github:`、`git+https:`、`file:`、tarball URL、`@scope/name@version`）。

装完需重启 DSH web 服务才生效。验证：

```sh
dsh --profile web --dump-config        # media-player 出现在 bundles
node -e "console.log(require.resolve('dsh-media-player'))"
```

## 使用

让模型添加媒体，或直接调用工具：

```sh
media_add(url="https://example.com/clip.mp4", mimeType="video/mp4", title="Demo clip")
media_add(url="/home/me/Videos/demo.mp4", mimeType="video/mp4")   # 本地路径，自动走服务
```

聊天就会渲染一个内联播放器，或带全屏预览的图片缩略图（可正负缩放、平移）。支持的 MIME 类型：`video/mp4`、`video/webm`、`audio/mpeg`、`audio/wav`、`audio/ogg`、`audio/mp4`、`image/png`、`image/jpeg`、`image/webp`、`image/gif`。

## 模型面向的 API

| 工具 | 参数 | 行为 |
|---|---|---|
| `media_add` | `url`（必填 http(s) **或本地路径**）、`mimeType`（必填枚举；本地路径自动推断）、`title`（可选） | 校验后追加 `plugin/media-add` 事件，返回 `{ url, mimeType }`。 |

## 配置

| 键 | 默认值 | 含义 |
|---|---|---|
| `allowedRoots` | `[~/Downloads, ~/Movies, ~/Videos, ~/Music]` | 允许 `media_add` 提供本地文件的绝对目录；超出这些根目录的本地路径会被拒绝（403）。可用配置追加更多目录。 |

插件无需配置即可挂载；工具每次调用时校验输入。

```yaml
- id: media-player
  name: 'dsh-media-player'
```

## 文件

`lib/index.js`（host）· `lib/client.js`（browser）· `cordis.patch.yml`（bundle）· `src/`（源码）。

## 已知限制

- **本地文件仅限 loopback。** 本地路径通过仅限本机（loopback）的路由提供；远程/移动端客户端无法获取本地字节。
- **无加载时校验。** URL/MIME 在每次调用时校验；错误 URL 在调用时失败，而非插件加载时。
- **无权限策略。** 工具不请求 `ctx.approval` 直接执行；需要确认的部署须添加 `tools/pre-execute` 策略。
- **host 半需要 webserver。** 本地文件路由注册在 DSH webserver 服务上；没有 webserver 的 headless profile 中，远程 URL 节点仍可渲染，但本地路径不可用。
