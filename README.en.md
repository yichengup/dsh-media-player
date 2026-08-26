# dsh-media-player

[中文](README.md)

A single-package, dual-end DeepSeek Harness (DSH) plugin that lets a model surface **playable video/audio or an image** inline in the chat, from an absolute http(s) URL **or a local file path**. Mounted as a profile bundle through `cordis.patch.yml`; no dsh source changes. Runs on macOS, Windows and Linux.

- **Host half** (`lib/index.js`): registers the model-facing `media_add` tool. The model passes an absolute http(s) media URL **or a local file path** plus its MIME type; the tool validates them and appends a durable `plugin/media-add` session event. Local files are served over a loopback-only route with HTTP Range support (so the player can seek).
- **Browser half** (`lib/client.js`): declares a `media` `ChatNodeDataMap` key, folds each `plugin/media-add` event into a media chat node, and renders it as a native `<video controls>` / `<audio controls>` player, or an image thumbnail with a fullscreen preview (wheel/button zoom in and out, drag panning, reset, Escape to close) via the `conversation.chat.node` slot.

Because the asset is written as a session event, the media node survives session reload, replay, and continuation (model-visible == logged).

## Install

Add the bundle to a profile, then restart the DSH web service:

```sh
dsh plugin --profile web add github:yichengup/dsh-media-player
```

Any pnpm-valid specifier works too (`npm:`, `git+https:`, `file:`, tarball URL, `@scope/name@version`); for a local checkout pass its absolute path or the `file:` form. Verify the bundle is picked up:

```sh
dsh --profile web --dump-config        # media-player appears in bundles
```

## Session log error? Read this first

After installing and adding media with `media_add`, reopening a previous session may fail with:

```
SessionFormatUnsupportedError: ... unknown to this harness and not marked ignorable; refusing to interpret the log
```

**Why:** the plugin writes a session event type the stock harness does not know (`plugin/media-add`). For safety, the harness refuses to rebuild a log it does not recognize.

**Quick fix (3 steps):** make the harness recognize the event type. Full details: [SESSION-EVENT-REGISTRATION.zh-CN.md](SESSION-EVENT-REGISTRATION.zh-CN.md).
1. In the harness repo's `scripts/gen-persistence-catalog.ts`, add `plugin/media-add` to the downstream event registry.
2. Run `pnpm run gen-persistence-catalog` to regenerate (updates `known-event-types.ts` and the catalog doc).
3. Rebuild the harness and restart.

> This is the shortest path: it fixes the error now and also lets previously written session logs load.

## Usage

Ask the model to add media, or call the tool directly:

```sh
media_add(url="https://example.com/clip.mp4", mimeType="video/mp4", title="Demo clip")
media_add(url="/home/me/Videos/demo.mp4", mimeType="video/mp4")   # local, path auto-served
media_add(urls=["/a.png", "/b.jpg", "/c.webp"], mimeType="image/png")  # one node, side by side
```

The chat then renders an inline player, or an image thumbnail whose fullscreen preview supports zoom (in/out) and panning. A batch (`urls`) renders as one side-by-side grid node. Supported MIME types: `video/mp4`, `video/webm`, `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/mp4`, `image/png`, `image/jpeg`, `image/webp`, `image/gif`.

## Model-facing API

| Tool | Args | Behavior |
|---|---|---|
| `media_add` | `urls` (array of http(s) URLs **or local paths**), `url` (single shorthand), `mimeType` (required enum; inferred for local paths), `title` (optional) | Validates, appends one `plugin/media-add` event carrying `{ items }`, returns `{ items }`. A batch renders as one side-by-side grid node. |

## Config

| Key | Default | Meaning |
|---|---|---|
| `allowedRoots` | `[~/Downloads, ~/Movies, ~/Videos, ~/Music]` | Absolute directories whose local files the `media_add` tool may serve. Local paths outside these roots are refused (403). Add more via config. |

The plugin mounts without configuration; the tool validates its inputs per call.

```yaml
- id: media-player
  name: 'dsh-media-player'
```

## Files

`lib/index.js` (host) · `lib/client.js` (browser) · `cordis.patch.yml` (bundle) · `src/` (source).

## Known Limitations

- **Local files are loopback-only.** A local path is served over a loopback-only route (the GUI and the host must be on the same machine); a remote/mobile client cannot fetch local bytes.
- **No launch-time validation.** URL/MIME validation happens per call; a bad URL fails at the call, not at plugin load.
- **No permission policy.** The tool runs without `ctx.approval`; a deployment that needs confirmation must add a `tools/pre-execute` policy.
- **Host half needs the webserver.** The local-file route registers on the DSH webserver service; in a headless profile without a webserver, remote URL nodes still render but local paths are unavailable.
