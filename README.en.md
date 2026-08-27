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
pnpm dsh plugin --profile web add github:yichengup/dsh-media-player
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

## `SessionFormatUnsupportedError` when reopening a session?

Only possible on an **official DSH build** after you added media with `media_add` and then **reopened an old session**. `plugin/media-add` is a third-party plugin event that the official core does not know by default — for safety it refuses to rebuild a session that carries an unrecognized, non-ignorable event type. **The data is not broken**; DSH just needs to "know" this event type. If your DSH build already registered it, skip step 2.

**Run all commands below from the DSH source root** (the repo where you cloned / installed DSH source, **not** this plugin dir; confirm it is correct by checking `ls package.json` lists the file).

1. **Add one registration line**: open `scripts/gen-persistence-catalog.ts`, find the `DOWNSTREAM_KNOWN_EVENT_TYPES` array, and add `'plugin/media-add',` if it is not already there (skip if present):

   ```ts
   const DOWNSTREAM_KNOWN_EVENT_TYPES: readonly string[] = [
     // ... other official events
     'plugin/media-add',
   ]
   ```

2. **Regenerate + verify + rebuild + restart** (still in the DSH source root):

   ```sh
   pnpm run gen-persistence-catalog      # regenerate the known-event table
   pnpm run verify-persistence-catalog   # verify (should print "... are up to date.")
   pnpm run build:lib:host               # rebuild the DSH host
   ```

   Then **restart the DSH process** and reopen the previously rejected session — it should load now.

> ⚠️ Do not hand-edit the generated artifact `packages/core/session/src/known-event-types.ts` (the next generation overwrites it and verification reports stale); edit the generator `scripts/gen-persistence-catalog.ts` instead. Re-add the line after upgrading DSH (it is a repo file, so an upgrade may overwrite it).

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
