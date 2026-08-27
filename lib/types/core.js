/**
 * Pure, DSH-free media helpers: URL and MIME validation plus payload shaping.
 * Kept dependency-free so the rules are unit-testable on their own.
 * @module dsh-media-player/core
 */
import { extname, isAbsolute, resolve as resolvePath, sep } from 'node:path';
import { MEDIA_MIME_TYPES } from "./media-types.js";
/**
 * Whether a value is an absolute http(s) URL. Anything else (relative, file:,
 * data:, javascript:) is rejected.
 * @param value - the candidate URL.
 * @returns whether it parses as http(s).
 */
export function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
/**
 * Whether a value is one of the supported media MIME types.
 * @param value - the candidate MIME type.
 * @returns whether it is accepted.
 */
export function isMediaMimeType(value) {
    return MEDIA_MIME_TYPES.includes(value);
}
/**
 * Build the canonical single-item payload. Trims and validates.
 * @param url - the asset URL.
 * @param mimeType - the asset MIME type.
 * @param title - optional display label.
 * @returns the validated single item.
 * @throws {@link Error} on an invalid URL or MIME type.
 */
export function mediaPayload(url, mimeType, title) {
    const trimmedUrl = url.trim();
    if (!isHttpUrl(trimmedUrl)) {
        throw new Error(`media_add url must be an absolute http(s) URL, got ${JSON.stringify(trimmedUrl)}`);
    }
    if (!isMediaMimeType(mimeType)) {
        throw new Error(`media_add mimeType must be one of ${MEDIA_MIME_TYPES.join(', ')}, got ${JSON.stringify(mimeType)}`);
    }
    const trimmedTitle = title?.trim();
    return {
        url: trimmedUrl,
        mimeType,
        ...trimmedTitle !== undefined && trimmedTitle.length > 0 ? { title: trimmedTitle } : {},
    };
}
/** Extension → supported media MIME type. */
const EXTENSION_MIME = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
};
/**
 * Infer a supported MIME type from a file extension.
 * @param filePath - the file path.
 * @returns the inferred type, or `undefined` for an unsupported extension.
 */
export function inferMediaMimeType(filePath) {
    return EXTENSION_MIME[extname(filePath).toLowerCase()];
}
/**
 * Whether a string is an absolute local file path (Windows drive or POSIX root)
 * on the current platform.
 * @param value - the candidate path.
 * @returns whether it is absolute.
 */
export function isLocalPath(value) {
    return isAbsolute(value);
}
/**
 * Resolve a path and require it (or a descendant) under one of the allowed roots.
 * @param value - the candidate file path.
 * @param allowedRoots - the directories whose contents may be served.
 * @returns the resolved absolute path.
 * @throws {@link Error} when it escapes every allowed root.
 */
export function resolveUnderAllowed(value, allowedRoots) {
    const candidate = resolvePath(value);
    const allowed = allowedRoots.some((root) => {
        const resolvedRoot = resolvePath(root);
        return candidate === resolvedRoot || candidate.startsWith(resolvedRoot + sep);
    });
    if (!allowed) {
        throw new Error(`media_add path is outside the allowed directories`);
    }
    return candidate;
}
