/**
 * Browser half of dsh-media-player. Registers the `media` chat-node definition
 * (folding each `plugin/media-add` session event into a media node) and the
 * keyed `conversation.chat.node` renderer that plays the node's video/audio.
 * @module dsh-media-player/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type MediaPlayerKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The media-player plugin's copy. */
        'media-player': MediaPlayerKey;
    }
}
/** Cordis plugin name used by loader diagnostics. */
export declare const name = "media-player";
/** Services required by the chat-node registration and locale seat. */
export declare const inject: string[];
/**
 * Client plugin body.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map