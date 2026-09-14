/* اجرا از apps/web:  node scripts/build-logo-v8.mjs */
/* ─────────────────────────────────────────────────────────────
   v8، پاسِ دوم — اصلاحِ حاشیه‌ی شفاف.

   ⚠️ بسته‌ی Logo-green محتوا را در ۵۵٪ عرض و ۴۵٪ ارتفاعِ بوم گذاشته
   (اندازه‌گیریِ trim: ۲۸۰×۲۳۰ از ۵۱۲). نسخه‌ی v7 تقریبا تمامِ بوم را
   پر می‌کرد. نتیجه‌اش این بود که قابِ ۴۰px نوار — که سایه و برجستگیِ
   داخلی دارد و برای کاشیِ پر طراحی شده بود — مثل جعبه‌ای خالی با یک
   نشانِ ریزِ شناور دیده می‌شد. و آیکونِ maskable فقط ۳۵٪ پر می‌شد.

   پس همه‌ی خروجی‌ها از نشانِ *بریده‌شده* ساخته می‌شوند، نه از بومِ
   خام. اندازه‌های خودِ بسته (۱۹۲/۵۱۲/۱۸۰/۱۶/۳۲) هم بازسازی می‌شوند
   تا همه یک نسبت داشته باشند.
   ───────────────────────────────────────────────────────────── */
import { createRequire } from 'node:module'
import { copyFileSync } from 'node:fs'
const req = createRequire('I:/Billiard Plus/billiard-plus/package.json')
const sharp = req('sharp')

const DIR = 'public/images/Logo/'
const PACK = 'assets/Logo-green/'
const out = []

/* نشانِ بریده — منبعِ همه‌ی خروجی‌ها */
const MARK = await sharp(PACK + 'android-chrome-512x512.png').trim({ threshold: 6 }).png().toBuffer()

/** نشان را روی بومِ مربعی می‌نشاند، با حاشیه‌ی دلخواه. */
const tile = async (size, pad, bg) => {
  const inner = Math.round(size * (1 - pad * 2))
  const m = await sharp(MARK).resize(inner, inner, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: m, gravity: 'center' }]).png({ compressionLevel: 9 }).toBuffer()
}
const T = { r: 0, g: 0, b: 0, alpha: 0 }

/* ── آیکون‌های شفاف: حاشیه‌ی ۸٪ ── */
for (const [size, name] of [[192, 'bh-icon-192-v8.png'], [512, 'bh-icon-512-v8.png'],
                            [96, 'bh-favicon-96-v8.png'], [512, 'bh-header-v8.png'], [256, 'bh-mark-256-v8.png']]) {
  await sharp(await tile(size, 0.08, T)).toFile(DIR + name)
  out.push([name, size + '×' + size + '، حاشیه ۸٪'])
}
await sharp(await tile(16, 0.04, T)).toFile(DIR + 'bh-favicon-16-v8.png'); out.push(['bh-favicon-16-v8.png', '۱۶×۱۶'])
await sharp(await tile(32, 0.05, T)).toFile(DIR + 'bh-favicon-32-v8.png'); out.push(['bh-favicon-32-v8.png', '۳۲×۳۲'])
await sharp(await tile(256, 0.08, T)).webp({ quality: 92 }).toFile(DIR + 'bh-mark-256-v8.webp')
out.push(['bh-mark-256-v8.webp', '۲۵۶×۲۵۶'])

/* ── اپل: مات، وگرنه iOS پشتش را سیاه می‌کند ── */
await sharp(await tile(180, 0.12, { r: 255, g: 255, b: 255, alpha: 1 })).toFile(DIR + 'bh-apple-180-v8.png')
out.push(['bh-apple-180-v8.png', '۱۸۰ مات، حاشیه ۱۲٪'])

/* ── maskable: اندروید تا ۲۰٪ هر لبه را می‌برد ── */
await sharp(await tile(512, 0.18, { r: 255, g: 255, b: 255, alpha: 1 })).toFile(DIR + 'bh-maskable-512-v8.png')
out.push(['bh-maskable-512-v8.png', 'محتوا در ۶۴٪ مرکزی، مات'])

/* ── OG ── */
const og = await sharp(MARK).resize(520, 520, { fit: 'inside' }).png().toBuffer()
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#ffffff' } })
  .composite([{ input: og, gravity: 'center' }]).png({ compressionLevel: 9 }).toFile(DIR + 'bh-og-v8.png')
out.push(['bh-og-v8.png', '۱۲۰۰×۶۳۰'])

copyFileSync(PACK + 'favicon.ico', 'app/favicon.ico')
out.push(['app/favicon.ico', 'کپی از بسته'])

for (const [f, note] of out) console.log('  ✓ ' + f.padEnd(26) + note)
