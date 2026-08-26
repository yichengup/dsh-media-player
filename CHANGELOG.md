# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Batch media: `media_add` now accepts `urls` (an array) in addition to the
  single `url` shorthand, and surfaces every asset in one `plugin/media-add`
  event. The browser half renders the batch as a single side-by-side chat node
  (a responsive grid), with each image opening the zoomable fullscreen preview
  and each video/audio rendered as a native player. The legacy single-named
  call shape keeps working unchanged.
- Image support: `media_add` now also accepts images (`image/png`, `image/jpeg`,
  `image/webp`, `image/gif`). The browser half renders an image thumbnail whose
  fullscreen preview supports zoom in/out (mouse wheel and buttons, 20%–800%)
  and drag panning, with reset and Escape to close.

## [0.2.0] - 2026-01-01

### Added
- Package metadata for publication: `repository`, `homepage`, `bugs`,
  `keywords`, and `publishConfig` (public npm access).
- `LICENSE` (Apache-2.0) and `CHANGELOG.md` shipped with the package.
- GitHub Actions CI building and testing on `ubuntu-latest`, `windows-latest`,
  and `macos-latest`, plus a tag-driven npm publish workflow.
- Cross-platform default media roots: `~/Downloads`, `~/Movies`, `~/Videos`,
  `~/Music` (whichever exist on the host).

### Fixed
- The loopback local-file route now registers deterministically: the host half
  declares `webServer` in its `inject` list, so the plugin waits for the
  webserver service to be ready instead of reading `ctx.get('webServer')` at
  apply time (which could return `undefined` and silently skip the route). The
  browser player previously got a 404 and rendered an empty shell.

## [0.1.0] - 2025-01-01

### Added
- Initial release: model-facing `media_add` tool (host) and inline
  `<video>`/`<audio>` chat node (browser), mounted as a profile bundle.
