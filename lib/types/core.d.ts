/**
 * Pure, DSH-free media helpers: URL and MIME validation plus payload shaping.
 * Kept dependency-free so the rules are unit-testable on their own.
 * @module dsh-media-player/core
 */
import type { MediaAddItem, MediaMimeType } from './media-types.ts';
/**
 * Whether a value is an absolute http(s) URL. Anything else (relative, file:,
 * data:, javascript:) is rejected.
 * @param value - the candidate URL.
 * @returns whether it parses as http(s).
 */
export declare function isHttpUrl(value: string): boolean;
/**
 * Whether a value is one of the supported media MIME types.
 * @param value - the candidate MIME type.
 * @returns whether it is accepted.
 */
export declare function isMediaMimeType(value: string): value is MediaMimeType;
/**
 * Build the canonical single-item payload. Trims and validates.
 * @param url - the asset URL.
 * @param mimeType - the asset MIME type.
 * @param title - optional display label.
 * @returns the validated single item.
 * @throws {@link Error} on an invalid URL or MIME type.
 */
export declare function mediaPayload(url: string, mimeType: string, title?: string): MediaAddItem;
/**
 * Infer a supported MIME type from a file extension.
 * @param filePath - the file path.
 * @returns the inferred type, or `undefined` for an unsupported extension.
 */
export declare function inferMediaMimeType(filePath: string): MediaMimeType | undefined;
/**
 * Whether a string is an absolute local file path (Windows drive or POSIX root)
 * on the current platform.
 * @param value - the candidate path.
 * @returns whether it is absolute.
 */
export declare function isLocalPath(value: string): boolean;
/**
 * Resolve a path and require it (or a descendant) under one of the allowed roots.
 * @param value - the candidate file path.
 * @param allowedRoots - the directories whose contents may be served.
 * @returns the resolved absolute path.
 * @throws {@link Error} when it escapes every allowed root.
 */
export declare function resolveUnderAllowed(value: string, allowedRoots: readonly string[]): string;
//# sourceMappingURL=core.d.ts.map