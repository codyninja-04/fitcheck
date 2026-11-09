import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, decodeImage, fitWithin, isOwnPhotoPath, sniffImage } from './shared'

const USER = '0b6f1d1e-8c1a-4f4e-9d7a-1c2b3d4e5f60'
const OTHER = '9a9a9a9a-8c1a-4f4e-9d7a-1c2b3d4e5f60'

function jpegBase64(extra = 200) {
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(extra, 7)]).toString('base64')
}

describe('fitWithin', () => {
  it('scales the long edge down and never up', () => {
    expect(fitWithin(4000, 3000, 1568)).toEqual({ width: 1568, height: 1176 })
    expect(fitWithin(800, 1200, 1568)).toEqual({ width: 800, height: 1200 })
    expect(fitWithin(0, 100)).toEqual({ width: 0, height: 0 })
  })
})

describe('isOwnPhotoPath', () => {
  it('only accepts files in your own checks folder', () => {
    expect(isOwnPhotoPath(`${USER}/checks/abc-123.jpg`, USER)).toBe(true)
    expect(isOwnPhotoPath(`${OTHER}/checks/abc-123.jpg`, USER)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/checks/../${OTHER}/x.jpg`, USER)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/checks/sub/x.jpg`, USER)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/checks/x.png`, USER)).toBe(false)
    expect(isOwnPhotoPath(null, USER)).toBe(false)
  })
})

describe('sniffImage', () => {
  it('reads magic bytes', () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe1]))).toBe('image/jpeg')
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(sniffImage(new Uint8Array([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBP')]))).toBe('image/webp')
    expect(sniffImage(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull()
  })
})

describe('decodeImage', () => {
  it('accepts a bare base64 JPEG or a data URL', () => {
    const b64 = jpegBase64()
    expect(decodeImage(b64)).toEqual({ ok: true, base64: b64, mediaType: 'image/jpeg' })
    expect(decodeImage(`data:image/jpeg;base64,${b64}`)).toEqual({ ok: true, base64: b64, mediaType: 'image/jpeg' })
  })

  it('refuses missing, oversized, malformed and non image input', () => {
    expect(decodeImage(undefined).ok).toBe(false)
    expect(decodeImage('a'.repeat(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 100)).ok).toBe(false)
    expect(decodeImage(`${jpegBase64()}!!`).ok).toBe(false)
    expect(decodeImage(Buffer.from('GIF89a'.repeat(40)).toString('base64')).ok).toBe(false)
  })
})
