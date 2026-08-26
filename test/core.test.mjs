import { test } from 'node:test'
import assert from 'node:assert/strict'
import { homedir } from 'node:os'
import { resolve as resolvePath } from 'node:path'
import { defaultAllowedRoots, inferMediaMimeType, isHttpUrl, isLocalPath, isMediaMimeType, mediaPayload, resolveUnderAllowed } from '../lib/index.js'

test('isHttpUrl accepts http(s) and rejects everything else', () => {
  assert.equal(isHttpUrl('https://example.com/a.mp4'), true)
  assert.equal(isHttpUrl('http://example.com/a.mp4'), true)
  assert.equal(isHttpUrl('ftp://example.com/a.mp4'), false)
  assert.equal(isHttpUrl('/local/path.mp4'), false)
  assert.equal(isHttpUrl('data:video/mp4;base64,xx'), false)
  assert.equal(isHttpUrl('not a url'), false)
})

test('isMediaMimeType accepts the supported set', () => {
  assert.equal(isMediaMimeType('video/mp4'), true)
  assert.equal(isMediaMimeType('audio/mpeg'), true)
  assert.equal(isMediaMimeType('image/png'), true)
  assert.equal(isMediaMimeType('image/jpeg'), true)
  assert.equal(isMediaMimeType('application/octet-stream'), false)
})

test('mediaPayload validates and shapes the event payload', () => {
  assert.deepEqual(mediaPayload('https://example.com/c.mp4', 'video/mp4'), { url: 'https://example.com/c.mp4', mimeType: 'video/mp4' })
  assert.deepEqual(mediaPayload('  https://example.com/a.mp3  ', 'audio/mpeg', '  Song  '), { url: 'https://example.com/a.mp3', mimeType: 'audio/mpeg', title: 'Song' })
  assert.deepEqual(mediaPayload('https://example.com/p.png', 'image/png'), { url: 'https://example.com/p.png', mimeType: 'image/png' })
  assert.throws(() => mediaPayload('not-a-url', 'video/mp4'), /absolute http\(s\) URL/)
  assert.throws(() => mediaPayload('https://example.com/x', 'image/svg+xml'), /mimeType/)
  assert.throws(() => mediaPayload('https://example.com/x', 'application/octet-stream'), /mimeType/)
})

test('inferMediaMimeType maps supported extensions', () => {
  assert.equal(inferMediaMimeType('a.mp4'), 'video/mp4')
  assert.equal(inferMediaMimeType('a.webm'), 'video/webm')
  assert.equal(inferMediaMimeType('a.mp3'), 'audio/mpeg')
  assert.equal(inferMediaMimeType('a.wav'), 'audio/wav')
  assert.equal(inferMediaMimeType('a.ogg'), 'audio/ogg')
  assert.equal(inferMediaMimeType('a.png'), 'image/png')
  assert.equal(inferMediaMimeType('a.jpg'), 'image/jpeg')
  assert.equal(inferMediaMimeType('a.jpeg'), 'image/jpeg')
  assert.equal(inferMediaMimeType('a.webp'), 'image/webp')
  assert.equal(inferMediaMimeType('a.gif'), 'image/gif')
  assert.equal(inferMediaMimeType('a.txt'), undefined)
})

test('isLocalPath accepts absolute paths only', () => {
  assert.equal(isLocalPath('C:\\Users\\x\\a.mp4'), true)
  assert.equal(isLocalPath('/home/x/a.mp4'), true)
  assert.equal(isLocalPath('relative/a.mp4'), false)
})

test('defaultAllowedRoots covers the common cross-platform media folders', () => {
  const home = homedir()
  const roots = defaultAllowedRoots()
  assert.ok(roots.includes(resolvePath(home, 'Downloads')), 'Downloads is always a root')
  for (const dir of ['Movies', 'Videos', 'Music']) {
    assert.equal(new Set(roots).has(resolvePath(home, dir)), true, `${dir} is a root`)
  }
})

test('resolveUnderAllowed accepts a descendant of an allowed root', () => {
  const home = homedir()
  const roots = [resolvePath(home, 'Downloads')]
  const file = resolvePath(home, 'Downloads', 'a.mp4')
  assert.equal(resolveUnderAllowed(file, roots), file)
})

test('resolveUnderAllowed rejects a path outside every allowed root', () => {
  const home = homedir()
  const roots = [resolvePath(home, 'Downloads')]
  assert.throws(() => resolveUnderAllowed(resolvePath(home, 'Desktop', 'a.mp4'), roots), /outside the allowed directories/)
})
