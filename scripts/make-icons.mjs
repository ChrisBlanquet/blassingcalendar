import { createWriteStream } from 'node:fs'
import { deflateSync } from 'node:zlib'

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i]
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function paint(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x += 1) {
      const i = row + 1 + x * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      let r = 253
      let g = 248
      let b = 245
      if (dist < size * 0.38) {
        r = 244
        g = 212
        b = 214
      }
      const star = Math.abs(dx) + Math.abs(dy) * 0.7
      if (star < size * 0.16) {
        r = 201
        g = 163
        b = 107
      }
      if (Math.hypot(dx - size * 0.16, dy - size * 0.14) < size * 0.07) {
        r = 201
        g = 123
        b = 132
      }
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = 255
    }
  }
  return raw
}

function writePng(path, size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(paint(size))),
    chunk('IEND', Buffer.alloc(0)),
  ])
  createWriteStream(path).end(png)
}

writePng('public/pwa-192.png', 192)
writePng('public/pwa-512.png', 512)
writePng('public/apple-touch-icon.png', 180)
console.log('icons ready')
