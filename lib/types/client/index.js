/**
 * Browser half of dsh-media-player. Registers the `media` chat-node definition
 * (folding each `plugin/media-add` session event into a media node) and the
 * keyed `conversation.chat.node` renderer that plays the node's video/audio.
 * @module dsh-media-player/client
 */
import { MediaChatNodeView } from "./media-node.js";
import { mediaDefinition } from "./media-definition.js";
import { en, zh } from "./locales.js";
/** Dictionary namespace owned by this plugin. */
const NS = 'media-player';
/** Cordis plugin name used by loader diagnostics. */
export const name = 'media-player';
/** Services required by the chat-node registration and locale seat. */
export const inject = ['slots', 'conversationEvents', 'locale'];
/**
 * Client plugin body.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.conversationEvents.register(mediaDefinition);
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-media-player: dictionaries');
    ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
        name: 'conversation.chat.node',
        key: 'media',
        locale: NS,
        inject: () => ({}),
    }, MediaChatNodeView));
}
