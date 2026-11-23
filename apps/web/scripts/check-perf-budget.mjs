/* سقفِ حجم — جلوگیری از برگشتِ کندی (آذرِ ۱۴۰۵). بی وابستگی؛ بعد از `next build`:
       node scripts/check-perf-budget.mjs

   ۱) جاوااسکریپتِ کلاینت: مجموعِ gzipِ همه‌ی چانک‌ها و بزرگ‌ترین چانک
   ۲) تصویرهای public: هیچ فایلِ تازه‌ای بالای سقف — فایل‌های بزرگِ موجود
      در فهرستِ «قدیمی» نام برده شده‌اند تا بیلد امروز قرمز نشود، ولی
      بزرگ‌تر شدنشان هم مجاز نیست

   سقف‌ها کمی بالاتر از اندازه‌ی امروزند (۲۳ نوامبرِ ۲۰۲۶). اگر عمداً
   چیزی سنگین اضافه شد، عدد را این‌جا بالا ببر و دلیلش را کنارش بنویس. */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const KB = 1024

const BUDGET = {
  /** مجموعِ gzipِ همه‌ی چانک‌های .next/static/chunks */
  totalJsGzip: 2600 * KB,
  /** بزرگ‌ترین چانکِ تکی (gzip) */
  largestChunkGzip: 230 * KB,
  /** هر تصویرِ تازه در public */
  imageMax: 300 * KB,
}

/* فایل‌های بزرگِ موجود — سقفِ هرکدام اندازه‌ی امروزش است */
const LEGACY_IMAGES = {
  'public/images/clubs/wallpaper3.png': 1100 * KB,
  'public/images/clubs/wallpaper4.png': 870 * KB,
  'public/images/clubs/wallpaper21.jpg': 350 * KB,
  /* جایگزین‌های صفحه‌ی اصلی (IMG در HomeClient، STORE_IMG در home-featured) —
     نامزدِ تبدیل به WebP */
  'public/images/learn/learn.png': 531 * KB,
  'public/images/manufactures/IMG_0966.png': 555 * KB,
  'public/images/services/IMG_0963.png': 506 * KB,
  'public/images/stores/IMG_0974.png': 567 * KB,
  'public/images/stores/IMG_0975.png': 546 * KB,
  /* در کد ارجاعی ندارند (۲۳ نوامبرِ ۲۰۲۶) */
  'public/images/about/5.png': 424 * KB,
  'public/images/background/44.png': 557 * KB,
  'public/images/background/paper.png': 442 * KB,
  'public/images/clubs/club83.png': 473 * KB,
  'public/images/shop/accessori.png': 428 * KB,
}

let fail = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) fail++ }

console.log('\n■ جاوااسکریپتِ کلاینت (gzip)')
/* خروجیِ پیش‌فرضِ next build (CI و محلی). روی سرور اجرا نمی‌شود. */
const chunksDir = join(ROOT, '.next/static/chunks')
if (!existsSync(chunksDir)) {
  console.log('  ✗ .next/static/chunks نیست — اول next build')
  process.exit(1)
}
let total = 0, largest = 0, largestName = ''
/* بازگشتی — بیلدِ webpack چانک‌ها را در زیرپوشه‌ها (chunks/app/**) می‌گذارد */
const jsFiles = d => readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? jsFiles(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : [])
for (const p of jsFiles(chunksDir)) {
  const f = relative(chunksDir, p).split('\\').join('/')
  const g = gzipSync(readFileSync(p)).length
  total += g
  if (g > largest) { largest = g; largestName = f }
}
ok(total <= BUDGET.totalJsGzip, `مجموع ${Math.round(total / KB)}KB ≤ ${BUDGET.totalJsGzip / KB}KB`)
ok(largest <= BUDGET.largestChunkGzip, `بزرگ‌ترین چانک ${Math.round(largest / KB)}KB ≤ ${BUDGET.largestChunkGzip / KB}KB (${largestName})`)

console.log('\n■ تصویرهای public')
const IMG = /\.(png|jpe?g|webp|avif|gif|jfif)$/i
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(d, e.name)) : IMG.test(e.name) ? [join(d, e.name)] : [])
let over = 0
for (const p of walk(join(ROOT, 'public'))) {
  const rel = relative(ROOT, p).replace(/\\/g, '/')
  const size = statSync(p).size
  const cap = LEGACY_IMAGES[rel] ?? BUDGET.imageMax
  if (size > cap) { over++; ok(false, `${rel} ${Math.round(size / KB)}KB > ${Math.round(cap / KB)}KB — کوچکش کن (WebP/AVIF، عرضِ لازم)`) }
}
if (!over) ok(true, `هیچ تصویری بالای سقف نیست (تازه‌ها ${BUDGET.imageMax / KB}KB)`)

console.log(`\n  نتیجه: ${fail ? `${fail} ناموفق` : 'همه در سقف'}`)
process.exit(fail ? 1 : 0)
