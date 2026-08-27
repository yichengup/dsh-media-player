/**
 * Shared media vocabulary for the plugin: the supported MIME types, the durable
 * `plugin/media-add` session-event payload, and the `SessionEventMap` merge that
 * lets both halves name the event. Imported by the host tool (which writes the
 * event) and the browser definition (which folds it into a chat node).
 * @module dsh-media-player/media-types
 */
/** Media types the plugin accepts and renders. */
export const MEDIA_MIME_TYPES = [
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
];
