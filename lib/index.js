import { extname, isAbsolute, resolve, sep } from "node:path";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { createReadStream, promises } from "node:fs";
import { homedir } from "node:os";
//#region src/media-types.ts
/** Media types the plugin accepts and renders. */
const MEDIA_MIME_TYPES = [
	"video/mp4",
	"video/webm",
	"audio/mpeg",
	"audio/wav",
	"audio/ogg",
	"audio/mp4",
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif"
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
* Build the canonical single-item payload. Trims and validates.
* @param url - the asset URL.
* @param mimeType - the asset MIME type.
* @param title - optional display label.
* @returns the validated single item.
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
/** Extension → supported media MIME type. */
const EXTENSION_MIME = {
	".mp4": "video/mp4",
	".webm": "video/webm",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".ogg": "audio/ogg",
	".m4a": "audio/mp4",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif"
};
/**
* Infer a supported MIME type from a file extension.
* @param filePath - the file path.
* @returns the inferred type, or `undefined` for an unsupported extension.
*/
function inferMediaMimeType(filePath) {
	return EXTENSION_MIME[extname(filePath).toLowerCase()];
}
/**
* Whether a string is an absolute local file path (Windows drive or POSIX root)
* on the current platform.
* @param value - the candidate path.
* @returns whether it is absolute.
*/
function isLocalPath(value) {
	return isAbsolute(value);
}
/**
* Resolve a path and require it (or a descendant) under one of the allowed roots.
* @param value - the candidate file path.
* @param allowedRoots - the directories whose contents may be served.
* @returns the resolved absolute path.
* @throws {@link Error} when it escapes every allowed root.
*/
function resolveUnderAllowed(value, allowedRoots) {
	const candidate = resolve(value);
	if (!allowedRoots.some((root) => {
		const resolvedRoot = resolve(root);
		return candidate === resolvedRoot || candidate.startsWith(resolvedRoot + sep);
	})) throw new Error(`media_add path is outside the allowed directories`);
	return candidate;
}
//#endregion
//#region src/file-server.ts
/**
* Host route that streams a local media file to the browser player. Only files
* under the configured allowed roots are served, only over loopback, and only
* with HTTP Range support so the `<video controls>` can seek. The path is
* carried as a query parameter the tool emits; this route validates it again.
* @module dsh-media-player/file-server
*/
/** Routing prefix for one served local media file. */
const FILE_ROUTE_PREFIX = "/dsh-media-player/file";
/**
* Default directories whose local files may be served, per platform. The common
* user media folders are covered on macOS (~/Downloads, ~/Movies, ~/Videos,
* ~/Music), Linux (~/Downloads, ~/Videos, ~/Music) and Windows (~\Downloads,
* ~\Videos, ~\Music); a root that does not exist is harmless (the serve route
* 404s the exact file and `resolveUnderAllowed` only checks the path prefix,
* not directory existence). Customise via `allowedRoots` config to add more.
*/
function defaultAllowedRoots() {
	const home = homedir();
	return [
		resolve(home, "Downloads"),
		resolve(home, "Movies"),
		resolve(home, "Videos"),
		resolve(home, "Music")
	];
}
/** Whether a request comes from the local machine (LAN/remote calls are refused). */
function isLoopbackRequest(req) {
	const address = req.socket.remoteAddress ?? "";
	return address === "127.0.0.1" || address === "::1" || address === "localhost";
}
/**
* Stream one file within the allowed roots, honoring a `bytes=` Range header.
* @param req - the incoming GET request.
* @param res - the outgoing response.
* @param allowedRoots - directories whose contents may be served.
*/
async function serveFile(req, res, allowedRoots) {
	const raw = new URL(req.url ?? "/", "http://x").searchParams.get("path");
	if (raw === null || raw.length === 0) {
		res.writeHead(400);
		res.end();
		return;
	}
	let filePath;
	let mime;
	let size;
	try {
		filePath = resolveUnderAllowed(raw, allowedRoots);
		mime = inferMediaMimeType(filePath);
		const stat = await promises.stat(filePath);
		if (!stat.isFile()) {
			res.writeHead(404);
			res.end();
			return;
		}
		size = stat.size;
	} catch {
		res.writeHead(403);
		res.end();
		return;
	}
	if (mime === void 0) {
		res.writeHead(415);
		res.end();
		return;
	}
	const contentType = mime;
	const range = req.headers.range;
	if (range !== void 0) {
		const match = /bytes=(\d*)-(\d*)/.exec(range);
		if (match !== null) {
			const start = match[1] === "" ? 0 : Number(match[1]);
			const end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
			if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < size) {
				res.writeHead(206, {
					"content-type": contentType,
					"content-length": String(end - start + 1),
					"content-range": `bytes ${start}-${end}/${size}`,
					"accept-ranges": "bytes",
					"cache-control": "private, max-age=3600"
				});
				createReadStream(filePath, {
					start,
					end
				}).pipe(res);
				return;
			}
		}
		res.writeHead(416, { "content-range": `bytes */${size}` });
		res.end();
		return;
	}
	res.writeHead(200, {
		"content-type": contentType,
		"content-length": String(size),
		"accept-ranges": "bytes",
		"cache-control": "private, max-age=3600"
	});
	createReadStream(filePath).pipe(res);
}
/**
* Register the local-file route on the shared webserver (no-op when absent).
* The allowed roots are read from `getRoots()` on **each request**, so a runtime
* change (settings edit, an approval-gated grant) takes effect immediately
* without a restart.
* @param ctx - registrant context; the webserver is optional.
* @param getRoots - returns the directories whose contents may currently be served.
*/
function registerFileRoute(ctx, getRoots) {
	const webserver = ctx.get("webServer");
	if (webserver === void 0) return;
	webserver.register({
		kind: "prefix",
		path: FILE_ROUTE_PREFIX,
		handler: async (req, res) => {
			if (!isLoopbackRequest(req)) {
				res.writeHead(403);
				res.end();
				return;
			}
			if (req.method !== "GET") {
				res.writeHead(405);
				res.end();
				return;
			}
			await serveFile(req, res, getRoots());
		}
	});
}
//#endregion
//#region src/index.ts
/**
* Host half of dsh-media-player. Registers the model-facing `media_add` tool:
* the model passes a playable video/audio http(s) URL, or an absolute local file
* path (served over a loopback-only route so the browser player can fetch its
* bytes, with HTTP Range support). The tool validates the input and appends a
* durable `plugin/media-add` session event; the plugin's browser half then folds
* that event into a chat node rendered as a player.
* @module dsh-media-player
*/
const name = "media-player";
const inject = ["tools", "webServer"];
const DESCRIPTION = "Surface one or more media assets into the conversation as a single media node, rendered together. Pass `urls` (an array of absolute http(s) URLs, or absolute local file paths under an allowed directory), or `url` as a one-item shorthand. Provide `mimeType` (video/*, audio/*, image/png, image/jpeg, image/webp, image/gif); it is inferred from the file extension for a local path. The node renders each asset as a side-by-side inline sheet, with video/audio players and image thumbnails that open a fullscreen zoomable preview.";
/** The pending-call card. */
function mediaCallView(args) {
	return {
		card: "generic",
		title: "Add media",
		kind: "other",
		rawInput: args
	};
}
/** Resolve a single `plugin/media-add` item from a URL or a local path. */
function payloadFor(url, mimeType, title, allowedRoots) {
	const trimmedUrl = url.trim();
	if (isHttpUrl(trimmedUrl)) return mediaPayload(trimmedUrl, mimeType, title);
	if (isLocalPath(trimmedUrl)) {
		const abs = resolveUnderAllowed(trimmedUrl, allowedRoots);
		const inferred = inferMediaMimeType(abs);
		if (inferred === void 0) throw new Error(`media_add unsupported local file type: ${trimmedUrl}`);
		const trimmedTitle = title?.trim();
		return {
			url: `${FILE_ROUTE_PREFIX}?path=${encodeURIComponent(abs)}`,
			mimeType: inferred,
			...trimmedTitle !== void 0 && trimmedTitle.length > 0 ? { title: trimmedTitle } : {}
		};
	}
	throw new Error("media_add url must be an absolute http(s) URL or an absolute local file path");
}
function apply(ctx, config = {}) {
	const state = { roots: [...config.allowedRoots ?? defaultAllowedRoots()] };
	registerFileRoute(ctx, () => state.roots);
	ctx.tools.register(defineTool({
		name: "media_add",
		description: DESCRIPTION,
		parameters: {
			urls: {
				type: "array",
				items: { type: "string" },
				description: "One or more absolute http(s) URLs of assets, or absolute local file paths (must be under an allowed directory). They are surfaced together in one node."
			},
			url: {
				type: "string",
				description: "Single asset, shorthand for `urls` with one item."
			},
			mimeType: {
				type: "string",
				required: true,
				enum: [...MEDIA_MIME_TYPES],
				description: "The media MIME type, applied to every URL; video/* renders a video player, audio/* an audio player, image/* an image thumbnail with preview. For a local path it is inferred from the file extension."
			},
			title: {
				type: "string",
				description: "Optional short label shown above the player(s), applied to every asset."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { items: {
					type: "array",
					required: true,
					items: {
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
							},
							title: { type: "string" }
						}
					}
				} }
			},
			render: (_args, value) => [{
				type: "text",
				text: `Added ${(value.items ?? []).length} media item(s)`
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const list = args.urls !== void 0 && args.urls.length > 0 ? args.urls : args.url !== void 0 ? [args.url] : [];
			if (list.length === 0) throw new Error("media_add requires at least one url");
			const items = list.map((url) => payloadFor(url, args.mimeType, args.title, state.roots));
			const session = exec.agent?.session;
			if (session === void 0) throw new Error("media_add requires an owning agent session");
			session.append("plugin/media-add", { items });
			return { items };
		},
		presentCall: mediaCallView
	}));
	ctx.tools.register(defineTool({
		name: "media_roots",
		description: "List the local directories the media_add tool may currently serve files from.",
		parameters: {},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { roots: {
					type: "array",
					required: true,
					items: { type: "string" }
				} }
			},
			render: (_args, value) => [{
				type: "text",
				text: `Allowed media roots: ${value.roots.length} (${value.roots.join(", ") || "none"})`
			}]
		},
		isConcurrencySafe: () => true,
		async execute() {
			return { roots: [...state.roots] };
		},
		presentCall: () => ({
			card: "generic",
			title: "Media roots",
			kind: "other",
			rawInput: {}
		})
	}));
	ctx.tools.register(defineTool({
		name: "media_grant_root",
		description: "Grant an additional local directory that media_add may serve, effective immediately. This extends read access to local files; in a deployment that requires confirmation, gate it with a `tools/pre-execute` approval policy.",
		parameters: { dir: {
			type: "string",
			required: true,
			description: "Absolute directory path to allow."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { roots: {
					type: "array",
					required: true,
					items: { type: "string" }
				} }
			},
			render: (_args, value) => [{
				type: "text",
				text: `Allowed media roots: ${value.roots.length} (${value.roots.join(", ") || "none"})`
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args) {
			const abs = resolve(args.dir);
			if (!state.roots.some((root) => resolve(root) === abs)) state.roots.push(abs);
			return { roots: [...state.roots] };
		},
		presentCall: () => ({
			card: "generic",
			title: "Grant media root",
			kind: "other",
			rawInput: { dir: "..." }
		})
	}));
	ctx.tools.register(defineTool({
		name: "media_revoke_root",
		description: "Revoke a previously granted local directory so media_add no longer serves files from it. Effective immediately. Do not revoke the platform default media folders.",
		parameters: { dir: {
			type: "string",
			required: true,
			description: "Absolute directory path to disallow."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { roots: {
					type: "array",
					required: true,
					items: { type: "string" }
				} }
			},
			render: (_args, value) => [{
				type: "text",
				text: `Allowed media roots: ${value.roots.length} (${value.roots.join(", ") || "none"})`
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args) {
			const abs = resolve(args.dir);
			state.roots = state.roots.filter((root) => resolve(root) !== abs);
			return { roots: [...state.roots] };
		},
		presentCall: () => ({
			card: "generic",
			title: "Revoke media root",
			kind: "other",
			rawInput: { dir: "..." }
		})
	}));
}
//#endregion
export { FILE_ROUTE_PREFIX, MEDIA_MIME_TYPES, apply, defaultAllowedRoots, inferMediaMimeType, inject, isHttpUrl, isLocalPath, isMediaMimeType, mediaCallView, mediaPayload, name, resolveUnderAllowed };
