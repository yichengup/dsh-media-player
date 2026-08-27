import { jsx, jsxs } from "react/jsx-runtime";
//#region src/client/media-node.tsx
const mediaStyle = {
	display: "block",
	maxWidth: "100%",
	maxHeight: 480,
	borderRadius: 12,
	border: "1px solid var(--dsw-alias-border-l2-darkmode-thin)"
};
const rootStyle = { margin: "6px 0" };
/** Render one media chat node as an inline video or audio player. */
function MediaChatNodeView({ node }) {
	const data = node.data;
	const isVideo = data.mimeType.startsWith("video/");
	return /* @__PURE__ */ jsxs("div", {
		style: rootStyle,
		"data-dsh-plugin": "media-player",
		"data-dsh-part": "media",
		children: [data.title !== void 0 && data.title.length > 0 ? /* @__PURE__ */ jsx("div", {
			"data-dsh-part": "title",
			children: data.title
		}) : null, isVideo ? /* @__PURE__ */ jsx("video", {
			style: mediaStyle,
			src: data.url,
			controls: true,
			preload: "metadata",
			"data-dsh-part": "video"
		}) : /* @__PURE__ */ jsx("audio", {
			style: mediaStyle,
			src: data.url,
			controls: true,
			preload: "metadata",
			"data-dsh-part": "audio"
		})]
	});
}
//#endregion
//#region src/client/media-definition.ts
/** The media chat-node definition registered on `ctx.conversationEvents`. */
const mediaDefinition = {
	kind: "media-add",
	target: "chat",
	match: (event) => event.type === "plugin/media-add" ? {
		id: String(event.seq),
		role: "start"
	} : null,
	start: (_context, match) => {
		if (match.event.type !== "plugin/media-add") throw new Error("media-add start requires plugin/media-add");
		const data = match.event.data;
		return {
			url: data.url,
			mimeType: data.mimeType,
			...data.title !== void 0 && data.title.length > 0 ? { title: data.title } : {},
			seq: match.event.seq
		};
	},
	update: (context) => context.state,
	buildViewNode: (context) => {
		if (context.state === void 0) return null;
		return {
			key: context.key,
			kind: "media",
			id: context.id,
			target: "chat",
			anchorSeq: context.state.seq - .1,
			location: context.start?.location ?? { kind: "unresolved" },
			visibility: "visible",
			data: {
				url: context.state.url,
				mimeType: context.state.mimeType,
				...context.state.title !== void 0 && context.state.title.length > 0 ? { title: context.state.title } : {}
			}
		};
	}
};
//#endregion
//#region src/client/locales.ts
/** `media-player` namespace dictionaries. */
/** Simplified Chinese dictionary (the key-set source of truth). */
const zh = { "media.player": "媒体" };
/** English dictionary, key-for-key matching the Chinese source. */
const en = { "media.player": "Media" };
//#endregion
//#region src/client/index.ts
/** Dictionary namespace owned by this plugin. */
const NS = "media-player";
/** Cordis plugin name used by loader diagnostics. */
const name = "media-player";
/** Services required by the chat-node registration and locale seat. */
const inject = [
	"slots",
	"conversationEvents",
	"locale"
];
/**
* Client plugin body.
* @param ctx - client root context.
*/
function apply(ctx) {
	ctx.conversationEvents.register(mediaDefinition);
	ctx.effect(() => ctx.locale.register(NS, {
		zh,
		en
	}), "dsh-media-player: dictionaries");
	ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
		name: "conversation.chat.node",
		key: "media",
		locale: NS,
		inject: () => ({})
	}, MediaChatNodeView));
}
//#endregion
export { apply, inject, name };

//# sourceMappingURL=client.mjs.map