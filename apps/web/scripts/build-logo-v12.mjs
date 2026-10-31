/* اجرا از apps/web:  node scripts/build-logo-v12.mjs
   لوگوی تازه‌ی «HB» (آبانِ ۱۴۰۵، از مالک: F:\logo new\4) ⟵ همه‌ی فایل‌های -v12 و favicon.ico.

   ورودی همان نسخه‌ی «سبز روی سفید» است (2.jpeg)؛ از آن فقط *شکلِ حروف* (ماسک)
   گرفته می‌شود و همه‌چیز با سبزِ یکدستِ برند از نو ساخته می‌شود — نویزِ JPEG
   به لوگو نمی‌آید و دو نسخه دقیقاً یک شکل و یک رنگ دارند:
     · مارکِ بی‌زمینه (حروفِ سبز)  ⟵ سطح‌های روشن: نوار، فوتر، فروشگاه، هدرها
     · کاشیِ سبز با حروفِ سفید     ⟵ آیکونِ اپ، favicon، نوار روی هیروی تیره
   رنگ = سبزِ خودِ لوگوی مالک (#1B6236)، همان WORDMARK_GREEN در lib/brand. */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
/* مسیرها نسبت به خودِ apps/web — اجرا از هر پوشه‌ای */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const req = createRequire(path.join(ROOT, 'package.json'))
const sharp = req('sharp')

/* منبع داخلِ مخزن (نسخه‌ی «سبز روی سفید»ِ لوگوی مالک)؛ مسیرِ دیگر با آرگومان */
const SRC = process.argv[2] ?? path.join(ROOT, 'scripts/assets/logo-hb-src.jpeg')
if (!fs.existsSync(SRC)) { console.error(`منبع پیدا نشد: ${SRC}`); process.exit(1) }
const GREEN = { r: 0x1B, g: 0x62, b: 0x36 }
const OG_BG = { r: 0xF7, g: 0xF7, b: 0xF5 }
const DIR = path.join(ROOT, 'public/images/Logo') + path.sep
const V = '-v12'

/* ── ماسکِ حروف: روشنایی ⟵ آلفا، لبه‌ها نرم، نویزِ زمینه صفر ── */
const { data, info } = await sharp(SRC).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height
const C = info.channels
const lum = i => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
const BG_L = 246, FG_L = 72
const mask = Buffer.alloc(W * H)
let x0 = W, y0 = H, x1 = 0, y1 = 0
for (let p = 0; p < W * H; p++) {
  let a = (BG_L - lum(p * C)) / (BG_L - FG_L)
  a = a < 0.1 ? 0 : a > 0.9 ? 1 : (a - 0.1) / 0.8
  mask[p] = Math.round(a * 255)
  if (a > 0.5) { const x = p % W, y = (p / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
}
/* لبه‌ی نرمِ بیرونِ قاب (a<0.5) بریده نشود */
x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2)
const bw = x1 - x0 + 1, bh = y1 - y0 + 1
console.log(`حروف: ${bw}×${bh} در (${x0},${y0})`)
const letters = await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
  .extract({ left: x0, top: y0, width: bw, height: bh }).png().toBuffer()

/* حروف با یک رنگ روی شفاف، در ابعادِ دلخواه (بلندترین بُعد = box) */
async function glyph(color, box) {
  /* ⚠️ extractChannel: بی‌آن sharp ماسکِ تک‌کاناله را سه‌کاناله برمی‌گرداند و سطرها کج می‌شدند */
  const m = await sharp(letters).resize(box, box, { fit: 'inside' }).extractChannel(0).raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.alloc(m.info.width * m.info.height * 4)
  for (let p = 0; p < m.info.width * m.info.height; p++) {
    out[p * 4] = color.r; out[p * 4 + 1] = color.g; out[p * 4 + 2] = color.b; out[p * 4 + 3] = m.data[p]
  }
  return { buf: await sharp(out, { raw: { width: m.info.width, height: m.info.height, channels: 4 } }).png().toBuffer(), w: m.info.width, h: m.info.height }
}

/* مارکِ بی‌زمینه: حروف ۸۸٪ِ قاب */
async function mark(size) {
  const g = await glyph(GREEN, Math.round(size * 0.88))
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: g.buf, left: (size - g.w) >> 1, top: (size - g.h) >> 1 }]).png({ compressionLevel: 9 })
}

/* کاشی: زمینه‌ی سبز، حروفِ سفید با سهمِ `fill` از قاب */
async function tile(size, fill) {
  const g = await glyph({ r: 255, g: 255, b: 255 }, Math.round(size * fill))
  return sharp({ create: { width: size, height: size, channels: 4, background: { ...GREEN, alpha: 1 } } })
    .composite([{ input: g.buf, left: (size - g.w) >> 1, top: (size - g.h) >> 1 }]).png({ compressionLevel: 9 })
}

const write = async (img, name) => { await img.toFile(DIR + name); console.log(name) }

await write(await mark(256), `bh-mark-256${V}.png`)
await write(await mark(512), `bh-header${V}.png`)
await write(await tile(256, 0.58), `bh-nav-256${V}.png`)
await write(await tile(192, 0.62), `bh-icon-192${V}.png`)
await write(await tile(512, 0.62), `bh-icon-512${V}.png`)
/* maskable: لانچرها تا ۲۰٪ِ لبه را می‌بُرند — حروف داخلِ دایره‌ی امن */
await write(await tile(512, 0.5), `bh-maskable-512${V}.png`)
await write(await tile(180, 0.62), `bh-apple-180${V}.png`)
/* favicon: در ۱۶ پیکسل حروف باید درشت‌تر باشند */
await write(await tile(96, 0.68), `bh-favicon-96${V}.png`)
await write(await tile(32, 0.74), `bh-favicon-32${V}.png`)
await write(await tile(16, 0.8), `bh-favicon-16${V}.png`)
for (const n of ['bh-mark-256', 'bh-nav-256']) {
  await sharp(DIR + n + V + '.png').webp({ quality: 92, alphaQuality: 100 }).toFile(DIR + n + V + '.webp')
  console.log(n + V + '.webp')
}

/* تصویرِ اشتراک‌گذاری ۱۲۰۰×۶۳۰: زمینه‌ی روشنِ سایت، مارک وسط */
{
  const g = await glyph(GREEN, 330)
  await write(sharp({ create: { width: 1200, height: 630, channels: 4, background: { ...OG_BG, alpha: 1 } } })
    .composite([{ input: g.buf, left: (1200 - g.w) >> 1, top: (630 - g.h) >> 1 }]).png({ compressionLevel: 9 }), `bh-og${V}.png`)
}

/* favicon.ico — ICO با PNGهای درون‌ساخته (۱۶، ۳۲، ۴۸) از کاشی */
const sizes = [16, 32, 48]
const fills = { 16: 0.8, 32: 0.74, 48: 0.7 }
const pngs = await Promise.all(sizes.map(async s => (await tile(s, fills[s])).toBuffer()))
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
fs.writeFileSync(path.join(ROOT, 'app/favicon.ico'), Buffer.concat([head, ...pngs]))
console.log('app/favicon.ico', sizes.join('/'))
