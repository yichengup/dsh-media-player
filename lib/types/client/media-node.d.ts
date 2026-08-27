/**
 * Browser-half chat node renderer for the `media` kind: renders the node's
 * video/audio asset as a native, controllable player, or an image as a
 * thumbnail with a fullscreen preview that supports wheel/button zoom (positive
 * and negative) and drag panning.
 * @module dsh-media-player/client/media-node
 */
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Render one media chat node: a batch of assets shown side by side. */
export declare function MediaChatNodeView({ node }: PropsRuntime<'conversation.chat.node', 'media'> & PropsLocale<'media-player'>): import("react").JSX.Element;
//# sourceMappingURL=media-node.d.ts.map