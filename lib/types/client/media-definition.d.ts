/**
 * Browser-half chat-node state for `dsh-media-player`: declares the `media`
 * `ChatNodeDataMap` key (renderer kind) and folds each durable
 * `plugin/media-add` session event into one media chat node.
 * @module dsh-media-player/client/media-definition
 */
import type { ConversationNodeDefinition } from '@deepseek-ai/dsh-client-runtime/client';
import type { MediaAddItem } from '../media-types.ts';
/** A batch of assets rendered as one media chat node (renderer kind `media`). */
export interface MediaChatData {
    items: MediaAddItem[];
}
declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
    interface ChatNodeDataMap {
        /** A batch of media assets rendered together. */
        media: MediaChatData;
    }
}
/** Folding state for one media node. */
interface MediaNodeState extends MediaChatData {
    readonly seq: number;
}
/** The media chat-node definition registered on `ctx.conversationEvents`. */
export declare const mediaDefinition: ConversationNodeDefinition<MediaNodeState>;
export {};
//# sourceMappingURL=media-definition.d.ts.map