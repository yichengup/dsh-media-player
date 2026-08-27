/**
 * Host half of dsh-media-player. Registers the model-facing `media_add` tool:
 * the model passes a playable video/audio http(s) URL, or an absolute local file
 * path (served over a loopback-only route so the browser player can fetch its
 * bytes, with HTTP Range support). The tool validates the input and appends a
 * durable `plugin/media-add` session event; the plugin's browser half then folds
 * that event into a chat node rendered as a player.
 * @module dsh-media-player
 */
import type { Context } from '@deepseek-ai/cordis';
import type { GenericCallView } from '@deepseek-ai/dsh-tools';
export declare const name = "media-player";
export declare const inject: string[];
/** Plugin configuration (all optional). */
export interface MediaPlayerConfig {
    /** Absolute directories whose local files may be served. Defaults to `~/Downloads`. */
    allowedRoots?: string[];
}
/** Model-facing arguments of `media_add`. */
export interface MediaAddArgs {
    /** One or more assets to surface together in a single node. */
    urls?: string[];
    /** Single asset, shorthand for `urls` with one item. */
    url?: string;
    /** The MIME type (applies to every URL); inferred from the file extension for a local path. */
    mimeType: string;
    /** Optional short label applied to every asset. */
    title?: string;
}
/** The pending-call card. */
export declare function mediaCallView(args: MediaAddArgs): GenericCallView;
export declare function apply(ctx: Context, config?: MediaPlayerConfig): void;
export { inferMediaMimeType, isHttpUrl, isLocalPath, isMediaMimeType, mediaPayload, resolveUnderAllowed } from './core.ts';
export { defaultAllowedRoots, FILE_ROUTE_PREFIX } from './file-server.ts';
export { MEDIA_MIME_TYPES } from './media-types.ts';
export type { MediaAddItem, MediaAddEventData, MediaMimeType } from './media-types.ts';
//# sourceMappingURL=index.d.ts.map