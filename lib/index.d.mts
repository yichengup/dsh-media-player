import { GenericCallView } from "@deepseek-ai/dsh-tools";
import { Context } from "@deepseek-ai/cordis";

//#region src/media-types.d.ts
/**
 * Shared media vocabulary for the plugin: the supported MIME types, the durable
 * `plugin/media-add` session-event payload, and the `SessionEventMap` merge that
 * lets both halves name the event. Imported by the host tool (which writes the
 * event) and the browser definition (which folds it into a chat node).
 * @module dsh-media-player/media-types
 */
/** Media types the plugin accepts and renders (browser-playable). */
declare const MEDIA_MIME_TYPES: readonly ["video/mp4", "video/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];
/** One accepted media MIME type. */
type MediaMimeType = (typeof MEDIA_MIME_TYPES)[number];
/** Durable payload of a media asset surfaced into a chat node. */
interface MediaAddEventData {
  /** Absolute http(s) URL of the playable asset. */
  url: string;
  /** The asset's MIME type (drives video-vs-audio rendering). */
  mimeType: MediaMimeType;
  /** Optional human label shown above the player. */
  title?: string;
}
declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** A video/audio asset surfaced into a chat node by the media_add tool. */
    'plugin/media-add': MediaAddEventData;
  }
} //# sourceMappingURL=media-types.d.ts.map
//#endregion
//#region src/core.d.ts
/**
 * Whether a value is an absolute http(s) URL. Anything else (relative, file:,
 * data:, javascript:) is rejected.
 * @param value - the candidate URL.
 * @returns whether it parses as http(s).
 */
declare function isHttpUrl(value: string): boolean;
/**
 * Whether a value is one of the supported media MIME types.
 * @param value - the candidate MIME type.
 * @returns whether it is accepted.
 */
declare function isMediaMimeType(value: string): value is MediaMimeType;
/**
 * Build the canonical `plugin/media-add` payload. Trims and validates.
 * @param url - the asset URL.
 * @param mimeType - the asset MIME type.
 * @param title - optional display label.
 * @returns the validated payload.
 * @throws {@link Error} on an invalid URL or MIME type.
 */
declare function mediaPayload(url: string, mimeType: string, title?: string): MediaAddEventData;
//#endregion
//#region src/index.d.ts
declare const name = "media-player";
declare const inject: string[];
/** Model-facing arguments of `media_add`. */
interface MediaAddArgs {
  url: string;
  mimeType: string;
  title?: string;
}
/** The pending-call card. */
declare function mediaCallView(args: MediaAddArgs): GenericCallView;
declare function apply(ctx: Context): void;
//#endregion
export { MEDIA_MIME_TYPES, MediaAddArgs, type MediaAddEventData, type MediaMimeType, apply, inject, isHttpUrl, isMediaMimeType, mediaCallView, mediaPayload, name };
//# sourceMappingURL=index.d.mts.map