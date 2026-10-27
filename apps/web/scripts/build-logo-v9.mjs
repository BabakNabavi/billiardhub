/* اجرا از apps/web:  node scripts/build-logo-v9.mjs  (پس از build-logo-v8.mjs)
   لوگوی v8 (سبزِ زمردی #2A5750) ⟵ v9 (سبزِ #30C55A، رنگِ «جزئیات»ِ کارتِ تعویض ماهوت)؛ favicon.ico هم.
   هر پیکسل به نسبتِ تیرگی‌اش بینِ سفید و سبزِ تازه می‌نشیند؛ سایه‌روشن و
   آلفا می‌مانند. اجرا از apps/web. */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const req = createRequire(path.resolve('package.json'))
const sharp = req('sharp')

const OLD = [42, 87, 80], NEW = [0x30, 0xC5, 0x5A]
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b
const L0 = lum(...OLD)
const DIR = 'public/images/Logo/'

async function recolor(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const t = Math.max(0, Math.min(1, (255 - lum(data[i], data[i + 1], data[i + 2])) / (255 - L0)))
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(255 * (1 - t) + NEW[c] * t)
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
}

const PNGS = ['bh-apple-180', 'bh-favicon-16', 'bh-favicon-32', 'bh-favicon-96', 'bh-header', 'bh-icon-192',
  'bh-icon-512', 'bh-mark-256', 'bh-maskable-512', 'bh-nav-256', 'bh-og']
for (const n of PNGS) {
  await (await recolor(DIR + n + '-v8.png')).png({ compressionLevel: 9 }).toFile(DIR + n + '-v9.png')
  console.log(n + '-v9.png')
}
for (const n of ['bh-mark-256', 'bh-nav-256']) {
  await sharp(DIR + n + '-v9.png').webp({ quality: 92 }).toFile(DIR + n + '-v9.webp')
  console.log(n + '-v9.webp')
}

/* favicon.ico — ICO با PNGهای درون‌ساخته (۱۶، ۳۲، ۴۸) */
const sizes = [16, 32, 48]
const pngs = await Promise.all(sizes.map(s => sharp(DIR + 'bh-icon-192-v9.png').resize(s, s).png({ compressionLevel: 9 }).toBuffer()))
const head = Buffer.alloc(6 + 16 * sizes.length)
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4)
let off = head.length
sizes.forEach((s, i) => {
  const o = 6 + 16 * i
  head[o] = s; head[o + 1] = s; head[o + 2] = 0; head[o + 3] = 0
  head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6)
  head.writeUInt32LE(pngs[i].length, o + 8); head.writeUInt32LE(off, o + 12)
  off += pngs[i].length
})
fs.writeFileSync('app/favicon.ico', Buffer.concat([head, ...pngs]))
console.log('app/favicon.ico', sizes.join('/'))
