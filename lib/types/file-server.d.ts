/**
 * Host route that streams a local media file to the browser player. Only files
 * under the configured allowed roots are served, only over loopback, and only
 * with HTTP Range support so the `<video controls>` can seek. The path is
 * carried as a query parameter the tool emits; this route validates it again.
 * @module dsh-media-player/file-server
 */
import type { IncomingMessage } from 'node:http';
import type { Context } from '@deepseek-ai/cordis';
/** Routing prefix for one served local media file. */
export declare const FILE_ROUTE_PREFIX = "/dsh-media-player/file";
/**
 * Default directories whose local files may be served, per platform. The common
 * user media folders are covered on macOS (~/Downloads, ~/Movies, ~/Videos,
 * ~/Music), Linux (~/Downloads, ~/Videos, ~/Music) and Windows (~\Downloads,
 * ~\Videos, ~\Music); a root that does not exist is harmless (the serve route
 * 404s the exact file and `resolveUnderAllowed` only checks the path prefix,
 * not directory existence). Customise via `allowedRoots` config to add more.
 */
export declare function defaultAllowedRoots(): string[];
/** Whether a request comes from the local machine (LAN/remote calls are refused). */
export declare function isLoopbackRequest(req: IncomingMessage): boolean;
/**
 * Register the local-file route on the shared webserver (no-op when absent).
 * The allowed roots are read from `getRoots()` on **each request**, so a runtime
 * change (settings edit, an approval-gated grant) takes effect immediately
 * without a restart.
 * @param ctx - registrant context; the webserver is optional.
 * @param getRoots - returns the directories whose contents may currently be served.
 */
export declare function registerFileRoute(ctx: Context, getRoots: () => readonly string[]): void;
//# sourceMappingURL=file-server.d.ts.map