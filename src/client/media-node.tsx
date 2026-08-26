/**
 * Browser-half chat node renderer for the `media` kind: renders the node's
 * video/audio asset as a native, controllable player, or an image as a
 * thumbnail with a fullscreen preview that supports wheel/button zoom (positive
 * and negative) and drag panning.
 * @module dsh-media-player/client/media-node
 */

import { useEffect, useRef, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { MediaAddItem } from '../media-types.ts'

const mediaStyle: React.CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  maxHeight: 480,
  borderRadius: 12,
  border: '1px solid var(--dsw-alias-border-l2-darkmode-thin)',
}

const rootStyle: React.CSSProperties = {
  margin: '6px 0',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '10px',
  margin: '6px 0',
}

/** Image zoom bounds (relative factor over the natural size). */
const IMAGE_MIN_SCALE = 0.2
const IMAGE_MAX_SCALE = 8
/** Multiplier applied per zoom step (wheel tick or button click). */
const ZOOM_STEP = 1.25

function clampScale(value: number): number {
  return Math.min(IMAGE_MAX_SCALE, Math.max(IMAGE_MIN_SCALE, value))
}

/** A fullscreen image preview with zoom (in/out) and drag panning. */
function ImagePreview({ url, title }: { url: string; title?: string }) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  const reset = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }
  const close = () => {
    setOpen(false)
    reset()
  }
  const zoomIn = () => setScale(s => clampScale(s * ZOOM_STEP))
  const zoomOut = () => setScale(s => clampScale(s / ZOOM_STEP))

  // Drag panning: while active, track mouse movement on the window.
  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => {
      setOffset({
        x: dragRef.current.ox + (e.clientX - dragRef.current.x),
        y: dragRef.current.oy + (e.clientY - dragRef.current.y),
      })
    }
    const up = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [dragging])

  // Wheel zoom (centre-anchored), non-passive so it can prevent page scroll.
  useEffect(() => {
    if (!open) return
    const el = overlayRef.current
    if (el === null) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setScale(s => clampScale(s * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div data-dsh-plugin="media-player" data-dsh-part="media">
      {title !== undefined && title.length > 0 ? (
        <div data-dsh-part="title">{title}</div>
      ) : null}
      <img
        src={url}
        alt={title ?? 'media'}
        onClick={() => setOpen(true)}
        style={{ ...mediaStyle, cursor: 'zoom-in', objectFit: 'contain' }}
        data-dsh-part="thumbnail"
      />
      {open ? (
        <div
          ref={overlayRef}
          data-dsh-part="overlay"
          onClick={close}
          style={{
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
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              gap: 8,
              zIndex: 1,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={zoomOut} data-dsh-part="zoom-out" title="-">−</button>
            <span style={{ color: '#fff', alignSelf: 'center', minWidth: 56, textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} data-dsh-part="zoom-in" title="+">+</button>
            <button onClick={reset} data-dsh-part="reset" title="Reset">↺</button>
            <button onClick={close} data-dsh-part="close" title="Close">✕</button>
          </div>
          <img
            src={url}
            alt={title ?? 'media'}
            draggable={false}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => {
              e.preventDefault()
              dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
              setDragging(true)
            }}
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: dragging ? 'none' : 'transform 120ms ease',
              objectFit: 'contain',
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
            data-dsh-part="preview-image"
          />
        </div>
      ) : null}
    </div>
  )
}

/** Render one asset of a media batch as an image preview or inline player. */
function MediaItemView({ item }: { item: MediaAddItem }) {
  if (item.mimeType.startsWith('image/')) {
    return <ImagePreview url={item.url} title={item.title} />
  }
  const isVideo = item.mimeType.startsWith('video/')
  return (
    <div style={rootStyle} data-dsh-plugin="media-player" data-dsh-part="media">
      {item.title !== undefined && item.title.length > 0 ? (
        <div data-dsh-part="title">{item.title}</div>
      ) : null}
      {isVideo ? (
        <video style={mediaStyle} src={item.url} controls preload="metadata" data-dsh-part="video" />
      ) : (
        <audio style={mediaStyle} src={item.url} controls preload="metadata" data-dsh-part="audio" />
      )}
    </div>
  )
}

/** Render one media chat node: a batch of assets shown side by side. */
export function MediaChatNodeView({ node }: PropsRuntime<'conversation.chat.node', 'media'> & PropsLocale<'media-player'>) {
  const items = node.data.items
  return (
    <div style={gridStyle} data-dsh-plugin="media-player" data-dsh-part="grid">
      {items.map((item, index) => <MediaItemView key={index} item={item} />)}
    </div>
  )
}
