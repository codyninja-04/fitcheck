// Draws the PWA icons (an arched mirror with a tick, white on pink) straight
// into PNG files so there is no image tool to install. Mirrors public/icon.svg.
// Run with: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const PINK = [0xdb, 0x27, 0x77]
const WHITE = [0xff, 0xff, 0xff]
const HALF_STROKE = 1.75

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// Everything in the 64 unit space of the SVG.
function sample(x, y, rounded) {
  if (rounded) {
    const r = 16
    const cx = Math.min(Math.max(x, r), 64 - r)
    const cy = Math.min(Math.max(y, r), 64 - r)
    if (Math.hypot(x - cx, y - cy) > r) return null
  }
  const arc = y <= 27 ? Math.abs(Math.hypot(x - 32, y - 27) - 12) : Infinity
  const mirror = Math.min(arc, segDist(x, y, 20, 27, 20, 50), segDist(x, y, 44, 27, 44, 50), segDist(x, y, 20, 50, 44, 50))
  const tick = Math.min(segDist(x, y, 25.5, 36.5, 30, 41), segDist(x, y, 30, 41, 38.5, 32))
  return Math.min(mirror, tick) <= HALF_STROKE ? WHITE : PINK
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function render(size, rounded) {
  const ss = 4
  const rows = []
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 4)
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const c = sample(((px + (sx + 0.5) / ss) / size) * 64, ((py + (sy + 0.5) / ss) / size) * 64, rounded)
          if (!c) continue
          r += c[0]; g += c[1]; b += c[2]; a += 1
        }
      }
      const o = 1 + px * 4
      if (a) {
        row[o] = Math.round(r / a); row[o + 1] = Math.round(g / a); row[o + 2] = Math.round(b / a)
      }
      row[o + 3] = Math.round((a / (ss * ss)) * 255)
    }
    rows.push(row)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// The 512 one doubles as the maskable icon, so it is a full bleed square and
// the launcher does the rounding. The 192 keeps the rounded corners.
writeFileSync(new URL('../public/icon-192.png', import.meta.url), render(192, true))
writeFileSync(new URL('../public/icon-512.png', import.meta.url), render(512, false))
console.log('Wrote public/icon-192.png and public/icon-512.png')
