import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Browser-half chat node renderer for the `media` kind: renders the node's
 * video/audio asset as a native, controllable player, or an image as a
 * thumbnail with a fullscreen preview that supports wheel/button zoom (positive
 * and negative) and drag panning.
 * @module dsh-media-player/client/media-node
 */
import { useEffect, useRef, useState } from 'react';
const mediaStyle = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 480,
    borderRadius: 12,
    border: '1px solid var(--dsw-alias-border-l2-darkmode-thin)',
};
const rootStyle = {
    margin: '6px 0',
};
const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '10px',
    margin: '6px 0',
};
/** Image zoom bounds (relative factor over the natural size). */
const IMAGE_MIN_SCALE = 0.2;
const IMAGE_MAX_SCALE = 8;
/** Multiplier applied per zoom step (wheel tick or button click). */
const ZOOM_STEP = 1.25;
function clampScale(value) {
    return Math.min(IMAGE_MAX_SCALE, Math.max(IMAGE_MIN_SCALE, value));
}
/** A fullscreen image preview with zoom (in/out) and drag panning. */
function ImagePreview({ url, title }) {
    const [open, setOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const overlayRef = useRef(null);
    const dragRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
    const reset = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };
    const close = () => {
        setOpen(false);
        reset();
    };
    const zoomIn = () => setScale(s => clampScale(s * ZOOM_STEP));
    const zoomOut = () => setScale(s => clampScale(s / ZOOM_STEP));
    // Drag panning: while active, track mouse movement on the window.
    useEffect(() => {
        if (!dragging)
            return;
        const move = (e) => {
            setOffset({
                x: dragRef.current.ox + (e.clientX - dragRef.current.x),
                y: dragRef.current.oy + (e.clientY - dragRef.current.y),
            });
        };
        const up = () => setDragging(false);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
    }, [dragging]);
    // Wheel zoom (centre-anchored), non-passive so it can prevent page scroll.
    useEffect(() => {
        if (!open)
            return;
        const el = overlayRef.current;
        if (el === null)
            return;
        const onWheel = (e) => {
            e.preventDefault();
            setScale(s => clampScale(s * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP)));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [open]);
    // Close on Escape.
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);
    return (_jsxs("div", { "data-dsh-plugin": "media-player", "data-dsh-part": "media", children: [title !== undefined && title.length > 0 ? (_jsx("div", { "data-dsh-part": "title", children: title })) : null, _jsx("img", { src: url, alt: title ?? 'media', onClick: () => setOpen(true), style: { ...mediaStyle, cursor: 'zoom-in', objectFit: 'contain' }, "data-dsh-part": "thumbnail" }), open ? (_jsxs("div", { ref: overlayRef, "data-dsh-part": "overlay", onClick: close, style: {
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.82)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    cursor: dragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    userSelect: 'none',
                }, children: [_jsxs("div", { style: {
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            display: 'flex',
                            gap: 8,
                            zIndex: 1,
                        }, onClick: e => e.stopPropagation(), children: [_jsx("button", { onClick: zoomOut, "data-dsh-part": "zoom-out", title: "-", children: "\u2212" }), _jsxs("span", { style: { color: '#fff', alignSelf: 'center', minWidth: 56, textAlign: 'center' }, children: [Math.round(scale * 100), "%"] }), _jsx("button", { onClick: zoomIn, "data-dsh-part": "zoom-in", title: "+", children: "+" }), _jsx("button", { onClick: reset, "data-dsh-part": "reset", title: "Reset", children: "\u21BA" }), _jsx("button", { onClick: close, "data-dsh-part": "close", title: "Close", children: "\u2715" })] }), _jsx("img", { src: url, alt: title ?? 'media', draggable: false, onClick: e => e.stopPropagation(), onMouseDown: e => {
                            e.preventDefault();
                            dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
                            setDragging(true);
                        }, style: {
                            maxWidth: '92vw',
                            maxHeight: '92vh',
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            transition: dragging ? 'none' : 'transform 120ms ease',
                            objectFit: 'contain',
                            pointerEvents: 'auto',
                            userSelect: 'none',
                        }, "data-dsh-part": "preview-image" })] })) : null] }));
}
/** Render one asset of a media batch as an image preview or inline player. */
function MediaItemView({ item }) {
    if (item.mimeType.startsWith('image/')) {
        return _jsx(ImagePreview, { url: item.url, title: item.title });
    }
    const isVideo = item.mimeType.startsWith('video/');
    return (_jsxs("div", { style: rootStyle, "data-dsh-plugin": "media-player", "data-dsh-part": "media", children: [item.title !== undefined && item.title.length > 0 ? (_jsx("div", { "data-dsh-part": "title", children: item.title })) : null, isVideo ? (_jsx("video", { style: mediaStyle, src: item.url, controls: true, preload: "metadata", "data-dsh-part": "video" })) : (_jsx("audio", { style: mediaStyle, src: item.url, controls: true, preload: "metadata", "data-dsh-part": "audio" }))] }));
}
/** Render one media chat node: a batch of assets shown side by side. */
export function MediaChatNodeView({ node }) {
    const items = node.data.items;
    return (_jsx("div", { style: gridStyle, "data-dsh-plugin": "media-player", "data-dsh-part": "grid", children: items.map((item, index) => _jsx(MediaItemView, { item: item }, index)) }));
}
