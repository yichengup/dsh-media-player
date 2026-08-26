# dsh-media-player

[中文](README.md)

A single-package, dual-end DeepSeek Harness (DSH) plugin that lets a model surface **playable video/audio or an image** inline in the chat, from an absolute http(s) URL **or a local file path**. Mounted as a profile bundle through `cordis.patch.yml`; no dsh source changes. Runs on macOS, Windows and Linux.

- **Host half** (`lib/index.js`): registers the model-facing `media_add` tool. The model passes an absolute http(s) media URL **or a local file path** plus its MIME type; the tool validates them and appends a durable `plugin/media-add` session event. Local files are served over a loopback-only route with HTTP Range support (so the player can seek).
- **Browser half** (`lib/client.js`): declares a `media` `ChatNodeDataMap` key, folds each `plugin/media-add` event into a media chat node, and renders it as a native `<video controls>` / `<audio controls>` player, or an image thumbnail with a fullscreen preview (wheel/button zoom in and out, drag panning, reset, Escape to close) via the `conversation.chat.node` slot.

Because the asset is written as a session event, the media node survives session reload, replay, and continuation (model-visible == logged).

## Install

First ask yourself: **are you inside the DSH source repo?** (a `git clone`, or local dev — your CWD is the repo root and `package.json` is visible)

### Case 1 · In the DSH source repo (git clone / local dev) → always use pnpm

> **A `git clone` gives you a source repo**, so git clone users also belong here → **use `pnpm`**, not bare `dsh`.

The `dsh` inside the repo is a local command, so you must call it via `pnpm dsh`:

```sh
pnpm dsh --profile web add github:yichengup/dsh-media-player
pnpm dsh --profile web --dump-config    # verify
```

### Case 2 · Not in the source repo (an installed dsh) → use bare dsh

Prerequisite: `dsh` is **globally installed into PATH** (install it first if not; either way is fine):

```sh
npm install -g @deepseek-ai/dsh      # if you used npm
pnpm add -g @deepseek-ai/dsh         # if you used pnpm
```

Then add the plugin to a profile:

```sh
dsh plugin --profile web add github:yichengup/dsh-media-player
dsh --profile web --dump-config      # verify
```

**Don't get them confused — remember this table:**

| Where you are | Command to use |
| --- | --- |
| Inside the DSH source repo (**including git clone**) | `pnpm dsh ...` |
| Using an installed dsh (not in the source repo) | `dsh ...` (install dsh globally into PATH first) |

> Restart DSH (or the source dev watcher) for it to take effect.
>
> **⚠️ Install source: this plugin is not yet published to npm. There are only two ways to install it —**
> ① **From GitHub**: `github:yichengup/dsh-media-player`
> ② **From a local path**: `file:` or an absolute path
> (`npm:`, a tarball URL, or a published `@scope/name` are **not available yet**; they will be documented once it is published.)

## Session log error? Read this first

**🙋 Easiest: hand the error to an AI.** In your DSH / AI assistant, just **reopen the session**, paste the
error below **in full**, and say:

> "Reopening the session errors with `SessionFormatUnsupportedError`, unknown to this harness. Please help
> me make DSH recognize the `plugin/media-add` event and fix it step by step."

The AI will help you judge whether a fix is needed, locate the DSH source root, edit the generator, run the
`pnpm` commands, and (after you confirm) do it for you. **If you are not comfortable with source, start here.**

— the manual fix, below —

After installing and using `media_add`, reopening a previous session may fail with:

```
SessionFormatUnsupportedError: ... unknown to this harness and not marked ignorable; refusing to interpret the log
```

**Whether you need to fix it depends on your DSH build.** `plugin/media-add` is a **third-party plugin**
event — the official DSH core does not know it by default (it does not pre-register event types for a
specific plugin). So:

- On an **official DSH build** you will typically hit this error and need the registration steps below;
- Only if your DSH build already applied that registration (e.g. this repo's modified build, whose
  generator `DOWNSTREAM_KNOWN_EVENT_TYPES` already lists `plugin/media-add`) can you skip it.

To check: just **reopen the session** — if it errors, apply the steps below (likely needed on official builds).
The full, beginner-friendly walkthrough (installing `pnpm`, locating the DSH source root, every command) is in
[SESSION-EVENT-REGISTRATION.zh-CN.md](SESSION-EVENT-REGISTRATION.zh-CN.md). In short:
1. Change into the **DSH source root** (not this plugin dir) and confirm with `ls package.json`;
2. In `scripts/gen-persistence-catalog.ts`, ensure `DOWNSTREAM_KNOWN_EVENT_TYPES` includes `'plugin/media-add',`;
3. Run `pnpm run gen-persistence-catalog` → `pnpm run verify-persistence-catalog` → `pnpm run build:lib:host`, then restart DSH.

> This fixes the error now and also lets previously written session logs load.

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
