/**
 * Browser-half chat-node state for `dsh-media-player`: declares the `media`
 * `ChatNodeDataMap` key (renderer kind) and folds each durable
 * `plugin/media-add` session event into one media chat node.
 * @module dsh-media-player/client/media-definition
 */
/**
 * Normalize the event payload into an item list, tolerating the legacy single
 * `{ url, mimeType, title }` shape written by older plugin versions.
 */
function toItems(data) {
    return Array.isArray(data.items)
        ? data.items
        : [data];
}
/** The media chat-node definition registered on `ctx.conversationEvents`. */
export const mediaDefinition = {
    kind: 'media-add',
    target: 'chat',
    match: event => (event.type === 'plugin/media-add'
        ? { id: String(event.seq), role: 'start' }
        : null),
    start: (_context, match) => {
        if (match.event.type !== 'plugin/media-add') {
            throw new Error('media-add start requires plugin/media-add');
        }
        return {
            items: toItems(match.event.data),
            seq: match.event.seq,
        };
    },
    update: context => context.state,
    buildViewNode: context => {
        if (context.state === undefined)
            return null;
        return {
            key: context.key,
            kind: 'media',
            id: context.id,
            target: 'chat',
            anchorSeq: context.state.seq - 0.1,
            location: context.start?.location ?? { kind: 'unresolved' },
            visibility: 'visible',
            data: { items: context.state.items },
        };
    },
};
