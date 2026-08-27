import { defineTool } from "@deepseek-ai/dsh-tools";
//#region src/media-types.ts
/** Media types the plugin accepts and renders (browser-playable). */
const MEDIA_MIME_TYPES = [
	"video/mp4",
	"video/webm",
	"audio/mpeg",
	"audio/wav",
	"audio/ogg",
	"audio/mp4"
];
//#endregion
//#region src/core.ts
/**
* Pure, DSH-free media helpers: URL and MIME validation plus payload shaping.
* Kept dependency-free so the rules are unit-testable on their own.
* @module dsh-media-player/core
*/
/**
* Whether a value is an absolute http(s) URL. Anything else (relative, file:,
* data:, javascript:) is rejected.
* @param value - the candidate URL.
* @returns whether it parses as http(s).
*/
function isHttpUrl(value) {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}
/**
* Whether a value is one of the supported media MIME types.
* @param value - the candidate MIME type.
* @returns whether it is accepted.
*/
function isMediaMimeType(value) {
	return MEDIA_MIME_TYPES.includes(value);
}
/**
* Build the canonical `plugin/media-add` payload. Trims and validates.
* @param url - the asset URL.
* @param mimeType - the asset MIME type.
* @param title - optional display label.
* @returns the validated payload.
* @throws {@link Error} on an invalid URL or MIME type.
*/
function mediaPayload(url, mimeType, title) {
	const trimmedUrl = url.trim();
	if (!isHttpUrl(trimmedUrl)) throw new Error(`media_add url must be an absolute http(s) URL, got ${JSON.stringify(trimmedUrl)}`);
	if (!isMediaMimeType(mimeType)) throw new Error(`media_add mimeType must be one of ${MEDIA_MIME_TYPES.join(", ")}, got ${JSON.stringify(mimeType)}`);
	const trimmedTitle = title?.trim();
	return {
		url: trimmedUrl,
		mimeType,
		...trimmedTitle !== void 0 && trimmedTitle.length > 0 ? { title: trimmedTitle } : {}
	};
}
//#endregion
//#region src/index.ts
const name = "media-player";
const inject = ["tools"];
const DESCRIPTION = "Surface a playable video or audio asset into the conversation as a media node. Pass an absolute http(s) `url` to the media file and its `mimeType` (video/mp4, video/webm, audio/mpeg, audio/wav, audio/ogg, audio/mp4); the chat then renders it as an inline video or audio player. Use when a task produces or references a media file the user should play directly in the chat. The URL and MIME type are validated before the asset is added.";
/** The pending-call card. */
function mediaCallView(args) {
	return {
		card: "generic",
		title: "Add media",
		kind: "other",
		rawInput: args
	};
}
function apply(ctx) {
	ctx.tools.register(defineTool({
		name: "media_add",
		description: DESCRIPTION,
		parameters: {
			url: {
				type: "string",
				required: true,
				description: "Absolute http(s) URL of the playable media file."
			},
			mimeType: {
				type: "string",
				required: true,
				enum: [...MEDIA_MIME_TYPES],
				description: "The media MIME type; video/* renders a video player, audio/* an audio player."
			},
			title: {
				type: "string",
				description: "Optional short label shown above the player."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					url: {
						type: "string",
						required: true
					},
					mimeType: {
						type: "string",
						required: true,
						enum: [...MEDIA_MIME_TYPES]
					}
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: `Added media (${value.mimeType}): ${value.url}`
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const payload = mediaPayload(args.url, args.mimeType, args.title);
			const session = exec.agent?.session;
			if (session === void 0) throw new Error("media_add requires an owning agent session");
			session.append("plugin/media-add", payload);
			return {
				url: payload.url,
				mimeType: payload.mimeType
			};
		},
		presentCall: mediaCallView
	}));
}
//#endregion
export { MEDIA_MIME_TYPES, apply, inject, isHttpUrl, isMediaMimeType, mediaCallView, mediaPayload, name };

//# sourceMappingURL=index.mjs.map