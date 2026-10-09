import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const payload = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(payload))
  return Buffer.concat([len, payload, crc])
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function paint(x, y, size) {
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const nx = (x - cx) / size
  const ny = (y - cy) / size
  const r = Math.hypot(x - cx, y - cy) / (size * 0.38)
  const pearl = [250, 247, 245]
  const gold = [196, 154, 108]
  const rose = [201, 123, 132]
  const blush = [253, 248, 245]

  if (r > 1.08) return pearl
  if (r > 1) return mix(gold, pearl, (r - 1) / 0.08)

  const shade = Math.min(1, Math.max(0, 0.55 + nx * 0.18 - ny * 0.22))
  let color = mix(rose, blush, shade * 0.22)

  const letter = isBlessingB(nx, ny)
  if (letter > 0) color = mix(color, blush, letter)

  return color
}

function isBlessingB(nx, ny) {
  const x = nx * 2.15
  const y = ny * 2.15
  const inStem = x > -0.42 && x < -0.14 && y > -0.62 && y < 0.62
  const topBowl = Math.hypot(x - 0.02, y + 0.28) < 0.34 && x > -0.16
  const botBowl = Math.hypot(x - 0.06, y - 0.28) < 0.38 && x > -0.16
  const innerTop = Math.hypot(x - 0.0, y + 0.28) < 0.16 && x > -0.02
  const innerBot = Math.hypot(x - 0.04, y - 0.28) < 0.18 && x > -0.02
  const bowls = (topBowl || botBowl) && !innerTop && !innerBot
  return inStem || bowls ? 1 : 0
}

function makePng(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = paint(x, y, size)
      const i = row + 1 + x * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

const files = [
  ['icon-192.png', 192],
  ['apple-touch-icon.png', 180],
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
]

for (const [name, size] of files) {
  const path = join(publicDir, name)
  writeFileSync(path, makePng(size))
  console.log('wrote', name)
}
