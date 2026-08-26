/** `media-player` namespace dictionaries. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'media.player': '媒体',
} as const

/** English dictionary, key-for-key matching the Chinese source. */
export const en: Record<MediaPlayerKey, string> = {
  'media.player': 'Media',
}

/** Dictionary-namespace key union for this plugin. */
export type MediaPlayerKey = keyof typeof zh
