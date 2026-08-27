/**
 * Shared media vocabulary for the plugin: the supported MIME types, the durable
 * `plugin/media-add` session-event payload, and the `SessionEventMap` merge that
 * lets both halves name the event. Imported by the host tool (which writes the
 * event) and the browser definition (which folds it into a chat node).
 * @module dsh-media-player/media-types
 */
/** Media types the plugin accepts and renders. */
export declare const MEDIA_MIME_TYPES: readonly ["video/mp4", "video/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "image/png", "image/jpeg", "image/webp", "image/gif"];
/** One accepted media MIME type. */
export type MediaMimeType = (typeof MEDIA_MIME_TYPES)[number];
/** One asset surfaced into a chat node. */
export interface MediaAddItem {
    /** Absolute http(s) URL of the asset. */
    url: string;
    /** The asset's MIME type (drives video/audio/image rendering). */
    mimeType: MediaMimeType;
    /** Optional human label shown above the player. */
    title?: string;
}
/** Durable payload of a media batch surfaced into a single chat node. */
export interface MediaAddEventData {
    /** The assets for one chat node, rendered side by side (or stacked). */
    items: MediaAddItem[];
}
declare module '@deepseek-ai/dsh-session/types' {
    interface SessionEventMap {
        /** A batch of media assets surfaced into one chat node by the media_add tool. */
        'plugin/media-add': MediaAddEventData;
    }
}
//# sourceMappingURL=media-types.d.ts.map