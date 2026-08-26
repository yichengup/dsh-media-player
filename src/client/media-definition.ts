/**
 * Browser-half chat-node state for `dsh-media-player`: declares the `media`
 * `ChatNodeDataMap` key (renderer kind) and folds each durable
 * `plugin/media-add` session event into one media chat node.
 * @module dsh-media-player/client/media-definition
 */

import type {} from '@deepseek-ai/dsh-session/types'
import type { ConversationNodeDefinition } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { MediaAddItem } from '../media-types.ts'

/** A batch of assets rendered as one media chat node (renderer kind `media`). */
export interface MediaChatData {
  items: MediaAddItem[]
}

declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
  interface ChatNodeDataMap {
    /** A batch of media assets rendered together. */
    media: MediaChatData
  }
}

/** Folding state for one media node. */
interface MediaNodeState extends MediaChatData {
  readonly seq: number
}

/**
 * Normalize the event payload into an item list, tolerating the legacy single
 * `{ url, mimeType, title }` shape written by older plugin versions.
 */
function toItems(data: Record<string, unknown>): MediaAddItem[] {
  return Array.isArray(data.items)
    ? data.items as MediaAddItem[]
    : [data as unknown as MediaAddItem]
}

/** The media chat-node definition registered on `ctx.conversationEvents`. */
export const mediaDefinition: ConversationNodeDefinition<MediaNodeState> = {
  kind: 'media-add',
  target: 'chat',
  match: event => (event.type === 'plugin/media-add'
    ? { id: String(event.seq), role: 'start' }
    : null),
  start: (_context, match) => {
    if (match.event.type !== 'plugin/media-add') {
      throw new Error('media-add start requires plugin/media-add')
    }
    return {
      items: toItems(match.event.data as unknown as Record<string, unknown>),
      seq: match.event.seq,
    }
  },
  update: context => context.state,
  buildViewNode: context => {
    if (context.state === undefined) return null
    return {
      key: context.key,
      kind: 'media',
      id: context.id,
      target: 'chat',
      anchorSeq: context.state.seq - 0.1,
      location: context.start?.location ?? { kind: 'unresolved' },
      visibility: 'visible',
      data: { items: context.state.items },
    }
  },
}
