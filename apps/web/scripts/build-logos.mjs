/* ساخت مجموعه‌ی استاندارد آیکون از یک لوگوی اصلی.
       node scripts/build-logos.mjs

   چرا اسکریپت و نه ساخت دستی: هر بار که لوگو عوض می‌شود باید یازده
   فایل با اندازه‌ها و حاشیه‌های یکسان دوباره ساخته شوند. با اسکریپت،
   دفعه‌ی بعد فقط logo.png عوض می‌شود و یک دستور اجرا می‌گردد.

   نام خروجی‌ها نسخه‌دار است (`-v3`) چون تصاویر هفت روز در مرورگر کش
   می‌شوند؛ بدون تغییر نام، کاربر تا یک هفته لوگوی قبلی را می‌بیند. */

import sharp from 'sharp'
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, '../public/images/Logo')
/* نسخه‌ی مادر عمداً بیرون از `public/` است: هرچه در public باشد هم در
   بسته‌ی دیپلوی می‌رود و هم برای همه قابل دانلود است، و این فایل ۳۸۰
   کیلوبایتی هیچ‌وقت به کاربر سرو نمی‌شود. */
const SRC = join(here, '../assets/logo-master.png')
const V = 'v3'

/* پس‌زمینه‌ی خود لوگو یک خاکستری بسیار روشن است (نمونه‌برداری از لبه‌ها).
   همان رنگ برای پرکردن حاشیه‌ها استفاده می‌شود تا هیچ خط یا اختلاف
   رنگی در گوشه‌ها دیده نشود. */
const BG = { r: 231, g: 231, b: 229, alpha: 1 }

/* لوگو در تصویر اصلی بالا و پایین حاشیه‌ی نابرابر دارد، پس باید مرزِ
   محتوا را پیدا کنیم و بعد خودمان حاشیه‌ی یکسان بگذاریم.

   `trim` سنجاق نمی‌شود: کارتِ زیر لوگو یک گرادیانِ بسیار محو دارد و
   trim آن را هم «محتوا» می‌شمارد — نتیجه‌اش آیکونی بود که لوگو در آن
   بالاتر از مرکز می‌نشست. به‌جایش پیکسل‌های واقعاً تیره را می‌شماریم.
   آستانه‌ی ۲۰۰ در برابر نویز پایدار است: با ۱۵۰ تا ۲۰۵ همان مرز درمی‌آید. */
async function contentBounds() {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C
      if (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] >= 200) continue
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
    }
  }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }
}

const box = await contentBounds()
const content = await sharp(SRC).extract(box).toBuffer()
const meta = { width: box.width, height: box.height }

/** بومی با حاشیه‌ی نسبی؛ `square=false` نسبت طبیعی لوگو را نگه می‌دارد */
async function canvas(padRatio, square = true) {
  const pad = Math.round(Math.max(meta.width, meta.height) * padRatio)
  const w = square ? Math.max(meta.width, meta.height) + pad * 2 : meta.width + pad * 2
  const h = square ? w : meta.height + pad * 2
  return sharp({ create: { width: w, height: h, channels: 4, background: BG } })
    .composite([{ input: content, gravity: 'center' }])
    .png()
    .toBuffer()
}

/* حاشیه‌ی ۸٪: در اندازه‌های کوچک لوگو به لبه نمی‌چسبد و در ماسک گرد
   اندروید/iOS هم چیزی بریده نمی‌شود. */
const square = await canvas(0.08)

/* نسخه‌ی افقی برای سربرگ: آن‌جا `width:auto` است، پس اگر مربعش کنیم
   لوگو باریک‌تر از چیزی که هست دیده می‌شود. */
const wide = await canvas(0.06, false)

const made = []
const emit = async (name, buf) => {
  writeFileSync(join(OUT, name), buf)
  made.push([name, statSync(join(OUT, name)).size])
}

/* PNGها با پالت ذخیره می‌شوند: این لوگو چند رنگ محدود دارد
   (مشکی، طلایی، خاکستری) و پالت حجم را چند برابر کم می‌کند بدون
   اینکه تفاوتی دیده شود. */
const png = (b, w) => sharp(b).resize(w, w, { fit: 'cover' })
  .png({ palette: true, quality: 90, effort: 10 }).toBuffer()

for (const [name, size] of [
  [`bh-favicon-16-${V}.png`, 16],
  [`bh-favicon-32-${V}.png`, 32],
  [`bh-favicon-96-${V}.png`, 96],
  [`bh-apple-180-${V}.png`, 180],
  [`bh-icon-192-${V}.png`, 192],
  [`bh-mark-256-${V}.png`, 256],
  [`bh-icon-512-${V}.png`, 512],
]) await emit(name, await png(square, size))

/* نسخه‌ی webp برای جاهایی که فقط در مرورگر دیده می‌شود — کوچک‌ترین حجم */
await emit(`bh-mark-256-${V}.webp`,
  await sharp(square).resize(256, 256).webp({ quality: 88, effort: 6 }).toBuffer())

/* لوگوی سربرگ: نسخه‌ی افقی با ارتفاع ۲۵۶ — تا ۴۰px رندر می‌شود و
   روی نمایشگر رتینا سه برابر بزرگ‌نمایی می‌خورد، پس ۲۵۶ کافی است. */
await emit(`bh-header-${V}.png`,
  await sharp(wide).resize({ height: 256 }).png({ palette: true, quality: 95, effort: 10 }).toBuffer())

/* تصویر اشتراک‌گذاری ۱۲۰۰×۶۳۰ — لوگوی افقی وسط زمینه‌ی هم‌رنگ */
await emit(`bh-og-${V}.png`, await sharp({
  create: { width: 1200, height: 630, channels: 4, background: BG },
}).composite([{ input: await sharp(wide).resize({ height: 400 }).png().toBuffer(), gravity: 'center' }])
  .png({ palette: true, quality: 90, effort: 10 }).toBuffer())

/* favicon.ico — چند اندازه در یک فایل، همان کاری که مرورگرهای قدیمی
   انتظار دارند. بدون کتابخانه‌ی بیرونی: ساختار ICO ساده است. */
const icoSizes = [16, 32, 48]
const imgs = await Promise.all(icoSizes.map(s => sharp(square).resize(s, s).png({ palette: true, effort: 10 }).toBuffer()))
const header = Buffer.alloc(6 + 16 * icoSizes.length)
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoSizes.length, 4)
let offset = header.length
imgs.forEach((buf, i) => {
  const e = 6 + i * 16
  header.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], e)
  header.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], e + 1)
  header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3)
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6)
  header.writeUInt32LE(buf.length, e + 8); header.writeUInt32LE(offset, e + 12)
  offset += buf.length
})
await emit(`bh-favicon-${V}.ico`, Buffer.concat([header, ...imgs]))

const total = made.reduce((s, [, n]) => s + n, 0)
console.log(`  منبع: ${statSync(SRC).size.toLocaleString()} بایت — محتوا ${meta.width}×${meta.height}\n`)
for (const [n, s] of made) console.log(`  ${n.padEnd(26)} ${String(s).padStart(7)} بایت`)
console.log(`\n  مجموع ${made.length} فایل: ${total.toLocaleString()} بایت`)
