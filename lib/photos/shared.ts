// Photo rules shared by the browser and the API routes.

export const PHOTO_BUCKET = 'outfit-photos'
// Long edge in pixels. Enough for Claude to see stitching and how a hem
// breaks, small enough to upload quickly on mobile data.
export const MAX_EDGE = 1568
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// Scale so the longest edge fits. Never upscales.
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

// Saved photos live under {user_id}/checks/. The save route checks the path
// the browser sends against this, so a check can't point at someone else's file.
export function checksPrefix(userId: string): string {
  return `${userId}/checks/`
}

export function isOwnPhotoPath(path: unknown, userId: string): path is string {
  if (typeof path !== 'string' || path.length > 200 || path.includes('..')) return false
  const prefix = checksPrefix(userId)
  return path.startsWith(prefix) && /^[A-Za-z0-9-]+\.jpg$/.test(path.slice(prefix.length))
}

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp'

// Reads the first bytes rather than trusting what the browser said.
export function sniffImage(bytes: Uint8Array): ImageMediaType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (
    bytes.length >= 12 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF' &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

export type DecodedImage = { ok: true; base64: string; mediaType: ImageMediaType } | { ok: false; error: string }

// The check route takes the photo as base64 in JSON. Accepts a bare string or
// a data URL, and refuses anything that isn't a real JPEG, PNG or WebP.
export function decodeImage(input: unknown): DecodedImage {
  if (typeof input !== 'string' || input.length < 100) return { ok: false, error: 'Add a photo of your outfit first.' }
  const base64 = input.replace(/^data:image\/[a-z]+;base64,/i, '')
  if (base64.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4) return { ok: false, error: 'That photo is too big. Try a smaller one.' }
  if (!/^[A-Za-z0-9+/]+=*$/.test(base64)) return { ok: false, error: "That photo didn't come through properly. Try again." }
  const head = Uint8Array.from(Buffer.from(base64.slice(0, 24), 'base64'))
  const mediaType = sniffImage(head)
  if (!mediaType) return { ok: false, error: 'Use a JPEG, PNG or WebP photo.' }
  return { ok: true, base64, mediaType }
}
