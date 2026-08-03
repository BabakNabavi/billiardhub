/* ساختِ همه‌ی فایل‌های لوگوی سایت از دو تصویرِ اصلی.
       node scripts/build-logo-assets.mjs

   ── چرا این اسکریپت وجود دارد ──
   سایت یازده فایلِ لوگو لازم دارد — فاوآیکون در چهار اندازه، آیکونِ
   اپ در سه اندازه، نشانِ مربع، لوگوی سربرگ، و تصویرِ اشتراک‌گذاری.
   ساختنِ دستیِ این‌ها هر بار که لوگو عوض می‌شود، هم وقت‌گیر است و هم
   جایی است که یکی‌شان فراموش می‌شود. (دقیقاً همین اتفاق افتاده بود:
   کلِ مجموعه‌ی قبلی گم شده بود و هر یازده آدرس روی سایتِ زنده ۴۰۴
   می‌داد — سربرگ، فوتر، فاوآیکون، آیکونِ اپ، همه.)

   ── یک منبع ──
   · Newlogo/Fin.jpg — نشانه + نامِ «BILLIARD HUB»

   همه‌ی یازده فایل از همین یک تصویر ساخته می‌شوند: نشانِ نوارِ بالا،
   فوتر، فاوآیکون، آیکونِ اپ، لوگوی سربرگ و تصویرِ اشتراک‌گذاری. اگر
   روزی نسخه‌ی «فقط نشانه» هم لازم شد، باید فایلِ جداگانه‌اش کنارِ همین
   بیاید و این‌جا صریح استفاده شود — نه اینکه از لوگوی کامل بریده شود.

   ── پس‌زمینه‌ی شفاف ──
   هر دو منبع «طلایی روی سفید»اند، ولی `bh-header` روی کارت‌های تیره‌ی
   مربیان/داوران/تولیدکنندگان می‌نشیند (سرمه‌ای #0c1424). با پس‌زمینه‌ی
   سفید آن‌جا یک مستطیلِ سفید وسطِ کارت می‌افتاد. پس سفید کلید می‌شود
   و به شفاف تبدیل.

   کلیدکردن با آستانه‌ی نرم انجام می‌شود، نه برش تیز: پیکسل‌های لبه‌ی
   ضدِپله‌ای آلفای میانی می‌گیرند و رنگشان «واپیچیده» می‌شود تا طلاییِ
   اصلی برگردد. برشِ تیز لبه‌ی دندانه‌دار و هاله‌ی سفید می‌داد.

   بقیه‌ی فایل‌ها پس‌زمینه‌ی سفید نگه می‌دارند: آیکونِ اپل و اندروید
   نباید شفاف باشند (سیستم پشتشان سیاه می‌گذارد) و نشانِ مربعِ نوارِ
   بالا هم در قابِ گردِ سایه‌دار می‌نشیند و کاشیِ توپر لازم دارد. */

import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const DIR = 'public/images/Logo'
const SRC = path.join(DIR, 'Newlogo/Fin.jpg')

const WHITE = '#FFFFFF'
/* آستانه‌ی پایین: هرچه از سفید کمتر فاصله دارد کاملاً شفاف است.
   آستانه‌ی بالا: از این فاصله به بعد کاملاً مات. بینشان تدریجی. */
const T_LOW = 22
const T_HIGH = 88

/* سفید → شفاف، با لبه‌ی نرم و بازگرداندنِ رنگِ اصلی.
   هر پیکسل روی سفید ترکیب شده: px = 255·(1−a) + رنگ·a
   پس با داشتنِ a، رنگِ اصلی = (px − 255·(1−a)) ÷ a */
async function keyWhite(src) {
  const img = sharp(src).removeAlpha()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const out = Buffer.alloc(width * height * 4)

  for (let i = 0, o = 0; i < data.length; i += channels, o += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const dist = 255 - Math.min(r, g, b)          // فاصله از سفید
    let a = (dist - T_LOW) / (T_HIGH - T_LOW)
    a = a < 0 ? 0 : a > 1 ? 1 : a

    if (a === 0) { out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0; continue }
    if (a === 1) { out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255; continue }

    const un = v => {
      const x = (v - 255 * (1 - a)) / a
      return x < 0 ? 0 : x > 255 ? 255 : Math.round(x)
    }
    out[o] = un(r); out[o + 1] = un(g); out[o + 2] = un(b); out[o + 3] = Math.round(a * 255)
  }
  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

/* لوگوی بریده‌شده از حاشیه — فقط برای لوگوی سربرگ.
   آن‌جا لوگو با «ارتفاع» روی کارت جا می‌گیرد و حاشیه‌ی شفاف فقط
   کوچکش می‌کند. */
const trimmed = async src => sharp(await keyWhite(src)).trim({ threshold: 1 }).png().toBuffer()

/* ── چرا بقیه بریده نمی‌شوند ──
   فایلِ اصلی حاشیه‌ی سفیدِ عمدی دارد؛ همان «فضای تنفسِ» استانداردِ
   لوگوست و بخشی از طراحی است، نه فضای هدررفته.

   نسخه‌ی قبلی این حاشیه را می‌بُرید و بعد خودش ۸٪ می‌گذاشت — نتیجه
   این شد که لوگو در قابِ مربعِ نوارِ بالا لب‌به‌لب می‌نشست و بدترکیب
   می‌شد. حالا تصویر همان‌طور که هست فقط اندازه عوض می‌کند، پس نسبتِ
   لوگو به قاب دقیقاً همانی می‌ماند که طراح خواسته. */
const square = async (size, bg) =>
  sharp(await sharp(await keyWhite(SRC)).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer())
    .flatten({ background: bg }).png().toBuffer()

/* ⚠️ `flatten` لازم است و `extend` کافی نیست: پس‌زمینه‌ی `extend` فقط
   حاشیه را پر می‌کند نه درونِ تصویر را، و چون خودِ لوگو شفاف شده،
   آیکون شفاف می‌ماند — و iOS پشتِ شفافیت را سیاه می‌کند. */

/* رمزگذارِ ICO — sharp این قالب را نمی‌نویسد.
   ICO می‌تواند PNG را مستقیم در خود جا دهد و همه‌ی مرورگرهای امروزی
   و ویندوز از ویستا به بعد آن را می‌فهمند. ساختار ساده است:
   سرآیندِ ۶بایتی، سپس یک ورودیِ ۱۶بایتی برای هر اندازه، سپس داده‌ها. */
function buildIco(pngs) {
  const head = Buffer.alloc(6)
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4)

  const dir = Buffer.alloc(16 * pngs.length)
  let offset = 6 + 16 * pngs.length
  pngs.forEach(({ size, buf }, i) => {
    const e = 16 * i
    dir[e] = size >= 256 ? 0 : size          // ۰ یعنی ۲۵۶
    dir[e + 1] = size >= 256 ? 0 : size
    dir[e + 2] = 0; dir[e + 3] = 0
    dir.writeUInt16LE(1, e + 4)              // planes
    dir.writeUInt16LE(32, e + 6)             // bit depth
    dir.writeUInt32LE(buf.length, e + 8)
    dir.writeUInt32LE(offset, e + 12)
    offset += buf.length
  })
  return Buffer.concat([head, dir, ...pngs.map(p => p.buf)])
}

const written = []
const put = (rel, buf) => {
  fs.writeFileSync(rel, buf)
  written.push([rel.replace(/\\/g, '/'), Math.round(buf.length / 1024)])
}

const full = await trimmed(SRC)

/* ── نشانِ مربع — نوارِ بالا، فوتر، صفحه‌ی درباره ──
   کاشیِ سفید، چون در قابِ گردِ سایه‌دارِ نوارِ بالا می‌نشیند.
   حاشیه از خودِ فایل می‌آید، نه از این‌جا. */
const m256 = await square(256, WHITE)
put(`${DIR}/bh-mark-256-v4.png`, await sharp(m256).png({ quality: 92 }).toBuffer())
put(`${DIR}/bh-mark-256-v4.webp`, await sharp(m256).webp({ quality: 92 }).toBuffer())

/* ── فاوآیکون ── */
for (const s of [16, 32, 96]) {
  put(`${DIR}/bh-favicon-${s}-v4.png`, await sharp(await square(s, WHITE)).png().toBuffer())
}

/* ── آیکونِ اپ ── اپل و اندروید شفاف را سیاه پر می‌کنند، پس سفید */
put(`${DIR}/bh-apple-180-v4.png`, await sharp(await square(180, WHITE)).png().toBuffer())
put(`${DIR}/bh-icon-192-v4.png`, await sharp(await square(192, WHITE)).png().toBuffer())
/* ۵۱۲ به‌عنوان maskable هم استفاده می‌شود و اندروید تا ۲۰٪ از هر طرف
   را می‌بُرد. حاشیه‌ی خودِ فایل همان نقش را بازی می‌کند، پس چیزی
   اضافه نمی‌شود — افزودنِ حاشیه‌ی دوم لوگو را بی‌دلیل ریز می‌کرد. */
put(`${DIR}/bh-icon-512-v4.png`, await sharp(await square(512, WHITE)).png().toBuffer())

/* ── لوگوی سربرگ ── تنها فایلِ شفاف: روی کارتِ سرمه‌ای می‌نشیند */
put(`${DIR}/bh-header-v4.png`, await sharp(full).resize({ height: 200, fit: 'inside' }).png().toBuffer())

/* ── تصویرِ اشتراک‌گذاری ── ۱۲۰۰×۶۳۰، استانداردِ شبکه‌های اجتماعی.
   این‌جا از نسخه‌ی بریده استفاده می‌شود چون بومِ ۱۲۰۰×۶۳۰ خودش فضای
   اطراف را می‌سازد؛ حاشیه‌ی خودِ فایل روی آن، حاشیه‌ی دوم می‌شد و
   لوگو وسطِ یک تصویرِ بزرگ ریز می‌افتاد. */
const ogInner = await sharp(full).resize({ height: 400, fit: 'inside' }).toBuffer()
const ogMeta = await sharp(ogInner).metadata()
put(`${DIR}/bh-og-v4.png`, await sharp({
  create: { width: 1200, height: 630, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
}).composite([{
  input: ogInner,
  top: Math.round((630 - ogMeta.height) / 2),
  left: Math.round((1200 - ogMeta.width) / 2),
}]).png().toBuffer())

/* ── favicon.ico ── Next آن را از app/favicon.ico روی /favicon.ico می‌دهد */
/* `ensureAlpha` لازم است: `flatten` کانالِ آلفا را برمی‌دارد و PNG
   سه‌کاناله می‌شود، ولی رمزگشایِ ICO در Next فقط RGBA را می‌پذیرد و
   بیلد با «The PNG is not in RGBA format» می‌شکند. تصویر همچنان کاملاً
   مات است — فقط کانالِ چهارم پر از ۲۵۵ اضافه می‌شود. */
const ico = []
for (const s of [16, 32, 48, 64, 128, 256]) {
  ico.push({ size: s, buf: await sharp(await square(s, WHITE)).ensureAlpha().png().toBuffer() })
}
put('app/favicon.ico', buildIco(ico))

/* ── سنجشِ خروجی ──
   نسخه‌ی اولِ این اسکریپت دو خطای خاموش داشت: اندازه‌ها از خواسته
   بزرگ‌تر درمی‌آمدند و آیکونِ اپل شفاف می‌ماند. هیچ‌کدام تا وقتی
   دستی اندازه نگرفتم پیدا نشد. حالا خودِ اسکریپت می‌سنجد. */
const EXPECT = {
  'bh-mark-256-v4.png': [256, false], 'bh-mark-256-v4.webp': [256, false],
  'bh-favicon-16-v4.png': [16, false], 'bh-favicon-32-v4.png': [32, false],
  'bh-favicon-96-v4.png': [96, false], 'bh-apple-180-v4.png': [180, false],
  'bh-icon-192-v4.png': [192, false], 'bh-icon-512-v4.png': [512, false],
  /* تنها فایلی که باید شفاف باشد — روی کارتِ تیره می‌نشیند */
  'bh-header-v4.png': [null, true],
}

console.log('\n  ساخته شد:\n')
let bad = 0
for (const [f, kb] of written) {
  const name = path.basename(f)
  const want = EXPECT[name]
  let note = ''
  if (want) {
    const m = await sharp(f).metadata()
    const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let clear = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] < 10) clear++
    const isClear = clear / (info.width * info.height) > 0.02

    const [wantSize, wantClear] = want
    const sizeOk = wantSize === null || (m.width === wantSize && m.height === wantSize)
    const clearOk = isClear === wantClear
    if (!sizeOk || !clearOk) bad++
    note = '  ' + (sizeOk && clearOk ? '✓' : '✗') + ' ' + m.width + '×' + m.height +
      (wantClear ? (isClear ? ' شفاف' : ' ✗ باید شفاف باشد') : (isClear ? ' ✗ باید مات باشد' : ' مات'))
  }
  console.log('   ' + name.padEnd(24) + String(kb).padStart(5) + ' KB' + note)
}
console.log('\n  مجموع: ' + written.length + ' فایل' + (bad ? '   ✗ ' + bad + ' مورد نادرست' : '   همه درست') + '\n')
if (bad) process.exit(1)
