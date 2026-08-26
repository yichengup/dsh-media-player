/**
 * Host route that streams a local media file to the browser player. Only files
 * under the configured allowed roots are served, only over loopback, and only
 * with HTTP Range support so the `<video controls>` can seek. The path is
 * carried as a query parameter the tool emits; this route validates it again.
 * @module dsh-media-player/file-server
 */

import { createReadStream, promises as fsp } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { homedir } from 'node:os'
import { resolve as resolvePath } from 'node:path'
import { inferMediaMimeType, resolveUnderAllowed } from './core.ts'
import type { MediaMimeType } from './media-types.ts'

/** Routing prefix for one served local media file. */
export const FILE_ROUTE_PREFIX = '/dsh-media-player/file'

/**
 * Default directories whose local files may be served, per platform. The common
 * user media folders are covered on macOS (~/Downloads, ~/Movies, ~/Videos,
 * ~/Music), Linux (~/Downloads, ~/Videos, ~/Music) and Windows (~\Downloads,
 * ~\Videos, ~\Music); a root that does not exist is harmless (the serve route
 * 404s the exact file and `resolveUnderAllowed` only checks the path prefix,
 * not directory existence). Customise via `allowedRoots` config to add more.
 */
export function defaultAllowedRoots(): string[] {
  const home = homedir()
  return [
    resolvePath(home, 'Downloads'),
    resolvePath(home, 'Movies'),
    resolvePath(home, 'Videos'),
    resolvePath(home, 'Music'),
  ]
}


/** Whether a request comes from the local machine (LAN/remote calls are refused). */
export function isLoopbackRequest(req: IncomingMessage): boolean {
  const address = req.socket.remoteAddress ?? ''
  return address === '127.0.0.1' || address === '::1' || address === 'localhost'
}

/**
 * Stream one file within the allowed roots, honoring a `bytes=` Range header.
 * @param req - the incoming GET request.
 * @param res - the outgoing response.
 * @param allowedRoots - directories whose contents may be served.
 */
async function serveFile(req: IncomingMessage, res: ServerResponse, allowedRoots: readonly string[]): Promise<void> {
  // `URLSearchParams.get` already percent-decodes the query value.
  const raw = new URL(req.url ?? '/', 'http://x').searchParams.get('path')
  if (raw === null || raw.length === 0) {
    res.writeHead(400)
    res.end()
    return
  }
  let filePath: string
  let mime: MediaMimeType | undefined
  let size: number
  try {
    filePath = resolveUnderAllowed(raw, allowedRoots)
    mime = inferMediaMimeType(filePath)
    const stat = await fsp.stat(filePath)
    if (!stat.isFile()) {
      res.writeHead(404)
      res.end()
      return
    }
    size = stat.size
  } catch {
    res.writeHead(403)
    res.end()
    return
  }
  if (mime === undefined) {
    res.writeHead(415)
    res.end()
    return
  }
  const contentType = mime
  const range = req.headers.range
  if (range !== undefined) {
    const match = /bytes=(\d*)-(\d*)/.exec(range)
    if (match !== null) {
      const start = match[1] === '' ? 0 : Number(match[1])
      const end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1)
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < size) {
        res.writeHead(206, {
          'content-type': contentType,
          'content-length': String(end - start + 1),
          'content-range': `bytes ${start}-${end}/${size}`,
          'accept-ranges': 'bytes',
          'cache-control': 'private, max-age=3600',
        })
        createReadStream(filePath, { start, end }).pipe(res)
        return
      }
    }
    res.writeHead(416, { 'content-range': `bytes */${size}` })
    res.end()
    return
  }
  res.writeHead(200, {
    'content-type': contentType,
    'content-length': String(size),
    'accept-ranges': 'bytes',
    'cache-control': 'private, max-age=3600',
  })
  createReadStream(filePath).pipe(res)
}

/**
 * Register the local-file route on the shared webserver (no-op when absent).
 * @param ctx - registrant context; the webserver is optional.
 * @param allowedRoots - directories whose contents may be served.
 */
export function registerFileRoute(ctx: Context, allowedRoots: readonly string[]): void {
  const webserver = ctx.get('webServer')
  if (webserver === undefined) return
  webserver.register({
    kind: 'prefix',
    path: FILE_ROUTE_PREFIX,
    handler: async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
      if (!isLoopbackRequest(req)) {
        res.writeHead(403)
        res.end()
        return
      }
      if (req.method !== 'GET') {
        res.writeHead(405)
        res.end()
        return
      }
      await serveFile(req, res, allowedRoots)
    },
  })
}
