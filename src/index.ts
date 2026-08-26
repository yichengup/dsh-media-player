/**
 * Host half of dsh-media-player. Registers the model-facing `media_add` tool:
 * the model passes a playable video/audio http(s) URL, or an absolute local file
 * path (served over a loopback-only route so the browser player can fetch its
 * bytes, with HTTP Range support). The tool validates the input and appends a
 * durable `plugin/media-add` session event; the plugin's browser half then folds
 * that event into a chat node rendered as a player.
 * @module dsh-media-player
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { GenericCallView } from '@deepseek-ai/dsh-tools'
import { inferMediaMimeType, isHttpUrl, isLocalPath, mediaPayload, resolveUnderAllowed } from './core.ts'
import { registerFileRoute, defaultAllowedRoots, FILE_ROUTE_PREFIX } from './file-server.ts'
import { MEDIA_MIME_TYPES } from './media-types.ts'
import type { MediaAddItem } from './media-types.ts'

export const name = 'media-player'
// `webServer` is injected (not read lazily) so the loopback file route is
// registered deterministically: without it the plugin can apply before the
// webserver starts, `ctx.get('webServer')` returns undefined, and the local-file
// route silently never mounts (the browser player gets a 404 and shows an empty
// shell). Declaring it here waits for the webserver service to be ready.
export const inject = ['tools', 'webServer']

/** Plugin configuration (all optional). */
export interface MediaPlayerConfig {
  /** Absolute directories whose local files may be served. Defaults to `~/Downloads`. */
  allowedRoots?: string[]
}

/** Model-facing arguments of `media_add`. */
export interface MediaAddArgs {
  /** One or more assets to surface together in a single node. */
  urls?: string[]
  /** Single asset, shorthand for `urls` with one item. */
  url?: string
  /** The MIME type (applies to every URL); inferred from the file extension for a local path. */
  mimeType: string
  /** Optional short label applied to every asset. */
  title?: string
}

const DESCRIPTION =
  'Surface one or more media assets into the conversation as a single media node, rendered together. '
  + 'Pass `urls` (an array of absolute http(s) URLs, or absolute local file paths under an allowed '
  + 'directory), or `url` as a one-item shorthand. Provide `mimeType` (video/*, audio/*, image/png, '
  + 'image/jpeg, image/webp, image/gif); it is inferred from the file extension for a local path. The node '
  + 'renders each asset as a side-by-side inline sheet, with video/audio players and image thumbnails '
  + 'that open a fullscreen zoomable preview.'

/** The pending-call card. */
export function mediaCallView(args: MediaAddArgs): GenericCallView {
  return { card: 'generic', title: 'Add media', kind: 'other', rawInput: args }
}

/** Resolve a single `plugin/media-add` item from a URL or a local path. */
function payloadFor(url: string, mimeType: string, title: string | undefined, allowedRoots: readonly string[]): MediaAddItem {
  const trimmedUrl = url.trim()
  if (isHttpUrl(trimmedUrl)) return mediaPayload(trimmedUrl, mimeType, title)
  if (isLocalPath(trimmedUrl)) {
    const abs = resolveUnderAllowed(trimmedUrl, allowedRoots)
    const inferred = inferMediaMimeType(abs)
    if (inferred === undefined) {
      throw new Error(`media_add unsupported local file type: ${trimmedUrl}`)
    }
    const trimmedTitle = title?.trim()
    return {
      url: `${FILE_ROUTE_PREFIX}?path=${encodeURIComponent(abs)}`,
      mimeType: inferred,
      ...trimmedTitle !== undefined && trimmedTitle.length > 0 ? { title: trimmedTitle } : {},
    }
  }
  throw new Error('media_add url must be an absolute http(s) URL or an absolute local file path')
}

export function apply(ctx: Context, config: MediaPlayerConfig = {}): void {
  const allowedRoots = config.allowedRoots ?? defaultAllowedRoots()
  registerFileRoute(ctx, allowedRoots)

  ctx.tools.register(defineTool({
    name: 'media_add',
    description: DESCRIPTION,
    parameters: {
      urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'One or more absolute http(s) URLs of assets, or absolute local file paths (must be under an allowed directory). They are surfaced together in one node.',
      },
      url: {
        type: 'string',
        description: 'Single asset, shorthand for `urls` with one item.',
      },
      mimeType: {
        type: 'string',
        required: true,
        enum: [...MEDIA_MIME_TYPES],
        description: 'The media MIME type, applied to every URL; video/* renders a video player, audio/* an audio player, image/* an image thumbnail with preview. For a local path it is inferred from the file extension.',
      },
      title: {
        type: 'string',
        description: 'Optional short label shown above the player(s), applied to every asset.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          items: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                url: { type: 'string', required: true },
                mimeType: { type: 'string', required: true, enum: [...MEDIA_MIME_TYPES] },
                title: { type: 'string' },
              },
            },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Added ${(value.items ?? []).length} media item(s)`,
      }],
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const list = args.urls !== undefined && args.urls.length > 0
        ? args.urls
        : args.url !== undefined ? [args.url] : []
      if (list.length === 0) {
        throw new Error('media_add requires at least one url')
      }
      const items = list.map(url => payloadFor(url, args.mimeType, args.title, allowedRoots))
      const session = exec.agent?.session
      if (session === undefined) {
        throw new Error('media_add requires an owning agent session')
      }
      session.append('plugin/media-add', { items })
      return { items }
    },
    presentCall: mediaCallView,
  }))
}

// Re-exported helpers for the package surface and tests.
export { inferMediaMimeType, isHttpUrl, isLocalPath, isMediaMimeType, mediaPayload, resolveUnderAllowed } from './core.ts'
export { defaultAllowedRoots, FILE_ROUTE_PREFIX } from './file-server.ts'
export { MEDIA_MIME_TYPES } from './media-types.ts'
export type { MediaAddItem, MediaAddEventData, MediaMimeType } from './media-types.ts'
