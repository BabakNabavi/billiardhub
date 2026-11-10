/* اجرا از apps/web:  node scripts/build-logo-v13.mjs
   لوگوی تازه‌ی «BH» با توپ (آبانِ ۱۴۰۵، از مالک: F:logo new
ew1logo.png،
   نسخه‌ی داخلِ مخزن scripts/assets/logo-bh-v13-src.png) ⟵ همه‌ی فایل‌های -v13 و favicon.ico.

   منبع نشانِ سفید با «BILLIARD HUB» روی سبزِ گرادیانی است. از آن فقط *شکلِ* نشان و نوشته
   (ماسکِ روشنایی) گرفته می‌شود و روی زمینه‌ی سبزِ صافِ تازه بازسازی می‌شود تا نویزِ منبع
   به آیکون‌ها نیاید:
     · کاشیِ سبز با نشانِ سفید ⟵ آیکونِ اپ، favicon، maskable، و هر قابِ مربعیِ سایت
     · نشانِ افقیِ شفاف (سفید / سبز) ⟵ هدرِ تیره‌ی مربی و داور، و مصرف‌های بعدی
     · تصویرِ اشتراک‌گذاری ۱۲۰۰×۶۳۰ با نوشته‌ی «BILLIARD HUB»
   نوشته در آیکون‌ها نمی‌آید (در اندازه‌ی کوچک خوانا نیست).
   ⚠️ iOS آیکونِ نشانیِ تکراری را هرگز تازه نمی‌کند: لوگوی بعدی ⟵ -v14 با نامِ تازه. */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const req = createRequire(path.join(ROOT, 'package.json'))
const sharp = req('sharp')
import fs from 'node:fs'

const SRC = process.argv[2] ?? path.join(ROOT, 'scripts/assets/logo-bh-v13-src.png')
if (!fs.existsSync(SRC)) { console.error(`منبع پیدا نشد: ${SRC}`); process.exit(1) }
const OUT = path.join(ROOT, 'public/images/Logo')
const ICO = path.join(ROOT, 'app/favicon.ico')
const V = 'v13'
const GREEN = { r: 0x01, g: 0x3e, b: 0x27 }          // مرکزِ زمینه‌ی لوگو
const TOP = '#03492F', BOTTOM = '#00271A'             // گرادیانِ زمینه (کمی صاف‌شده از نمونه‌ها)

/* ── ماسکِ آلفا از روشنایی: سفید ⟵ مات، سبزِ زمینه ⟵ شفاف ── */
async function maskOf(box, pad = 10) {
  const left = box.x - pad, top = box.y - pad, width = box.w + pad * 2, height = box.h + pad * 2
  const { data, info } = await sharp(SRC).removeAlpha().extract({ left, top, width, height }).raw().toBuffer({ resolveWithObject: true })
  const a = Buffer.alloc(info.width * info.height)
  for (let i = 0; i < a.length; i++) {
    const L = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2]
    a[i] = Math.max(0, Math.min(255, Math.round(((L - 70) / (150 - 70)) * 255)))
  }
  return { a, w: info.width, h: info.height }
}
/* نشان با یک رنگ و همان آلفا */
async function tinted(m, rgb) {
  const buf = Buffer.alloc(m.w * m.h * 4)
  for (let i = 0; i < m.w * m.h; i++) { buf[i * 4] = rgb.r; buf[i * 4 + 1] = rgb.g; buf[i * 4 + 2] = rgb.b; buf[i * 4 + 3] = m.a[i] }
  return sharp(buf, { raw: { width: m.w, height: m.h, channels: 4 } }).png().toBuffer()
}
const WHITE = { r: 255, g: 255, b: 255 }
const bg = (w, h, radius = 0) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="${TOP}"/><stop offset="1" stop-color="${BOTTOM}"/></linearGradient></defs>` +
  `<rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="url(#g)"/></svg>`)

/* کاشیِ مربعی: نشانِ سفید با عرضِ ratio وسطِ زمینه‌ی سبز */
async function tile(size, ratio, radius = 0, markBuf) {
  const mw = Math.round(size * ratio)
  const mark = await sharp(markBuf).resize({ width: mw, kernel: 'lanczos3' }).toBuffer()
  const meta = await sharp(mark).metadata()
  return sharp(bg(size, size, radius)).composite([{ input: mark, left: Math.round((size - mw) / 2), top: Math.round((size - meta.height) / 2) }]).png()
}

const markBox = { x: 308, y: 256, w: 858, h: 355 }
const wordBox = { x: 236, y: 676, w: 1068, h: 65 }
const mark = await maskOf(markBox)
const word = await maskOf(wordBox, 6)
const markWhite = await tinted(mark, WHITE)
const markGreen = await tinted(mark, GREEN)
const wordWhite = await tinted(word, WHITE)

fs.mkdirSync(OUT, { recursive: true })
const out = (n) => `${OUT}/${n}`
const made = []
const save = async (pipeline, name) => { await pipeline.toFile(out(name)); made.push(name) }

/* ۱) نشانِ افقیِ شفاف — سبز برای زمینه‌ی روشن، سفید برای تیره (ارتفاعِ ۲۰۰ پیکسل، عرض به نسبت) */
await save(sharp(markGreen).resize({ height: 200 }).png(), `bh-mark-${V}.png`)
await save(sharp(markGreen).resize({ height: 200 }).webp({ quality: 90, alphaQuality: 100 }), `bh-mark-${V}.webp`)
await save(sharp(markWhite).resize({ height: 200 }).png(), `bh-mark-white-${V}.png`)
await save(sharp(markWhite).resize({ height: 200 }).webp({ quality: 90, alphaQuality: 100 }), `bh-mark-white-${V}.webp`)

/* ۲) کاشیِ مربعی برای قاب‌های مربعی (گوشه‌ی گرد را خودِ قاب می‌دهد) */
await save(await tile(256, 0.86, 0, markWhite), `bh-tile-256-${V}.png`)
await save(sharp(await (await tile(256, 0.86, 0, markWhite)).toBuffer()).webp({ quality: 90 }), `bh-tile-256-${V}.webp`)

/* ۳) آیکون‌های نصب: تمام‌قاب، بی‌شفافیت (iOS گوشه را خودش گرد می‌کند) */
await save(await tile(180, 0.80, 0, markWhite), `bh-apple-180-${V}.png`)
await save(await tile(192, 0.80, 0, markWhite), `bh-icon-192-${V}.png`)
await save(await tile(512, 0.80, 0, markWhite), `bh-icon-512-${V}.png`)
/* maskable: نشانِ ۲٫۴:۱ با عرضِ ۶۸٪ کاملاً داخلِ دایره‌ی امنِ ۸۰٪ (حداکثرِ مجاز حدود ۷۴٪) */
await save(await tile(512, 0.68, 0, markWhite), `bh-maskable-512-${V}.png`)

/* ۴) فاویکن: مربعِ گوشه‌گرد با گوشه‌ی شفاف؛ در اندازه‌ی کوچک نشان تقریباً تمام‌عرض */
await save(await tile(96, 0.86, 20, markWhite), `bh-favicon-96-${V}.png`)
await save(await tile(32, 0.90, 7, markWhite), `bh-favicon-32-${V}.png`)
await save(await tile(16, 0.94, 3, markWhite), `bh-favicon-16-${V}.png`)

/* ۵) favicon.ico: سه PNG داخلِ یک ICO (۱۶، ۳۲، ۴۸) */
const icoPngs = await Promise.all([16, 32, 48].map(async s => (await tile(s, s === 16 ? 0.94 : 0.9, Math.round(s * 0.2), markWhite)).toBuffer()))
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(icoPngs.length, 4)
const dir = Buffer.alloc(16 * icoPngs.length); let off = 6 + dir.length
icoPngs.forEach((p, i) => { const s = [16, 32, 48][i]; const o = i * 16
  dir.writeUInt8(s, o); dir.writeUInt8(s, o + 1); dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3)
  dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6); dir.writeUInt32LE(p.length, o + 8); dir.writeUInt32LE(off, o + 12); off += p.length })
fs.writeFileSync(ICO, Buffer.concat([head, dir, ...icoPngs])); made.push('app/favicon.ico')

/* ۶) تصویرِ اشتراک‌گذاری ۱۲۰۰×۶۳۰: نشان + «BILLIARD HUB» با همان نسبتِ لوگوی اصلی */
{
  const W = 1200, H = 630
  const mW = 560, m = await sharp(markWhite).resize({ width: mW }).toBuffer(), mh = (await sharp(m).metadata()).height
  const wW = Math.round(mW * (wordBox.w / markBox.w)), wd = await sharp(wordWhite).resize({ width: wW }).toBuffer(), wh = (await sharp(wd).metadata()).height
  const gap = Math.round(mh * 0.18), total = mh + gap + wh, y0 = Math.round((H - total) / 2)
  await save(sharp(bg(W, H)).composite([
    { input: m, left: Math.round((W - mW) / 2), top: y0 },
    { input: wd, left: Math.round((W - wW) / 2), top: y0 + mh + gap },
  ]).png(), `bh-og-${V}.png`)
}

console.log(made.join('\n'))
