window.__ModuleLoader__.load({
	id: "dsh-media-player",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/media-node.tsx
		/**
		* Browser-half chat node renderer for the `media` kind: renders the node's
		* video/audio asset as a native, controllable player, or an image as a
		* thumbnail with a fullscreen preview that supports wheel/button zoom (positive
		* and negative) and drag panning.
		* @module dsh-media-player/client/media-node
		*/
		const mediaStyle = {
			display: "block",
			maxWidth: "100%",
			maxHeight: 480,
			borderRadius: 12,
			border: "1px solid var(--dsw-alias-border-l2-darkmode-thin)"
		};
		const rootStyle = { margin: "6px 0" };
		const gridStyle = {
			display: "grid",
			gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
			gap: "10px",
			margin: "6px 0"
		};
		/** Image zoom bounds (relative factor over the natural size). */
		const IMAGE_MIN_SCALE = .2;
		const IMAGE_MAX_SCALE = 8;
		/** Multiplier applied per zoom step (wheel tick or button click). */
		const ZOOM_STEP = 1.25;
		function clampScale(value) {
			return Math.min(IMAGE_MAX_SCALE, Math.max(IMAGE_MIN_SCALE, value));
		}
		/** A fullscreen image preview with zoom (in/out) and drag panning. */
		function ImagePreview({ url, title }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [scale, setScale] = (0, react.useState)(1);
			const [offset, setOffset] = (0, react.useState)({
				x: 0,
				y: 0
			});
			const [dragging, setDragging] = (0, react.useState)(false);
			const overlayRef = (0, react.useRef)(null);
			const dragRef = (0, react.useRef)({
				x: 0,
				y: 0,
				ox: 0,
				oy: 0
			});
			const reset = () => {
				setScale(1);
				setOffset({
					x: 0,
					y: 0
				});
			};
			const close = () => {
				setOpen(false);
				reset();
			};
			const zoomIn = () => setScale((s) => clampScale(s * ZOOM_STEP));
			const zoomOut = () => setScale((s) => clampScale(s / ZOOM_STEP));
			(0, react.useEffect)(() => {
				if (!dragging) return;
				const move = (e) => {
					setOffset({
						x: dragRef.current.ox + (e.clientX - dragRef.current.x),
						y: dragRef.current.oy + (e.clientY - dragRef.current.y)
					});
				};
				const up = () => setDragging(false);
				window.addEventListener("mousemove", move);
				window.addEventListener("mouseup", up);
				return () => {
					window.removeEventListener("mousemove", move);
					window.removeEventListener("mouseup", up);
				};
			}, [dragging]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const el = overlayRef.current;
				if (el === null) return;
				const onWheel = (e) => {
					e.preventDefault();
					setScale((s) => clampScale(s * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP)));
				};
				el.addEventListener("wheel", onWheel, { passive: false });
				return () => el.removeEventListener("wheel", onWheel);
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onKey = (e) => {
					if (e.key === "Escape") close();
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [open]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				"data-dsh-plugin": "media-player",
				"data-dsh-part": "media",
				children: [
					title !== void 0 && title.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						"data-dsh-part": "title",
						children: title
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
						src: url,
						alt: title ?? "media",
						onClick: () => setOpen(true),
						style: {
							...mediaStyle,
							cursor: "zoom-in",
							objectFit: "contain"
						},
						"data-dsh-part": "thumbnail"
					}),
					open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						ref: overlayRef,
						"data-dsh-part": "overlay",
						onClick: close,
						style: {
							position: "fixed",
							inset: 0,
							background: "rgba(0,0,0,0.82)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 9999,
							cursor: dragging ? "grabbing" : "grab",
							touchAction: "none",
							userSelect: "none"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								position: "absolute",
								top: 12,
								right: 12,
								display: "flex",
								gap: 8,
								zIndex: 1
							},
							onClick: (e) => e.stopPropagation(),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: zoomOut,
									"data-dsh-part": "zoom-out",
									title: "-",
									children: "−"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: {
										color: "#fff",
										alignSelf: "center",
										minWidth: 56,
										textAlign: "center"
									},
									children: [Math.round(scale * 100), "%"]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: zoomIn,
									"data-dsh-part": "zoom-in",
									title: "+",
									children: "+"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: reset,
									"data-dsh-part": "reset",
									title: "Reset",
									children: "↺"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: close,
									"data-dsh-part": "close",
									title: "Close",
									children: "✕"
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
							src: url,
							alt: title ?? "media",
							draggable: false,
							onClick: (e) => e.stopPropagation(),
							onMouseDown: (e) => {
								e.preventDefault();
								dragRef.current = {
									x: e.clientX,
									y: e.clientY,
									ox: offset.x,
									oy: offset.y
								};
								setDragging(true);
							},
							style: {
								maxWidth: "92vw",
								maxHeight: "92vh",
								transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
								transition: dragging ? "none" : "transform 120ms ease",
								objectFit: "contain",
								pointerEvents: "auto",
								userSelect: "none"
							},
							"data-dsh-part": "preview-image"
						})]
					}) : null
				]
			});
		}
		/** Render one asset of a media batch as an image preview or inline player. */
		function MediaItemView({ item }) {
			if (item.mimeType.startsWith("image/")) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImagePreview, {
				url: item.url,
				title: item.title
			});
			const isVideo = item.mimeType.startsWith("video/");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: rootStyle,
				"data-dsh-plugin": "media-player",
				"data-dsh-part": "media",
				children: [item.title !== void 0 && item.title.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					"data-dsh-part": "title",
					children: item.title
				}) : null, isVideo ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
					style: mediaStyle,
					src: item.url,
					controls: true,
					preload: "metadata",
					"data-dsh-part": "video"
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("audio", {
					style: mediaStyle,
					src: item.url,
					controls: true,
					preload: "metadata",
					"data-dsh-part": "audio"
				})]
			});
		}
		/** Render one media chat node: a batch of assets shown side by side. */
		function MediaChatNodeView({ node }) {
			const items = node.data.items;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: gridStyle,
				"data-dsh-plugin": "media-player",
				"data-dsh-part": "grid",
				children: items.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MediaItemView, { item }, index))
			});
		}
		//#endregion
		//#region src/client/media-definition.ts
		/**
		* Normalize the event payload into an item list, tolerating the legacy single
		* `{ url, mimeType, title }` shape written by older plugin versions.
		*/
		function toItems(data) {
			return Array.isArray(data.items) ? data.items : [data];
		}
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
				return {
					items: toItems(match.event.data),
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
					data: { items: context.state.items }
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
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map