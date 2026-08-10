/* پشتیبان‌گیری از دیتابیس و فهرستِ فایل‌ها.
       node apps/web/scripts/backup.mjs [پوشه‌ی مقصد]

   ── چرا این مهم‌ترین اسکریپتِ پروژه است ──
   داده روی سرویسی است که شرایطِ استفاده‌اش کشورِ ما را نمی‌پذیرد.
   بستنِ حساب — چه به‌خاطر تحریم، چه اشتباه، چه هر دلیلِ دیگر — بدونِ
   نسخه‌ی پشتیبان یعنی همه‌چیز در همان لحظه رفته: کاربران، رزروها،
   دفترِ مالی. با پشتیبان یعنی چند ساعت کار.

   این تفاوت را با چند مگابایت می‌شود خرید. مهاجرتِ کامل هفته‌ها کار
   می‌برد و همین ریسک را کم می‌کند — پس اول این.

   ── چه چیزی برمی‌دارد ──
   • همه‌ی جدول‌ها، به‌صورت JSON (فهرستِ جدول‌ها از خودِ PostgREST
     خوانده می‌شود، نه هاردکد — وگرنه جدولِ تازه بی‌صدا جا می‌ماند)
   • فهرست و اندازه‌ی فایل‌های هر باکت (خودِ فایل‌ها نه؛ حجمشان زیاد
     می‌شود و ابزارِ همگام‌سازی کارِ بهتری می‌کند)

   ── ⚠️ این فایل‌ها داده‌ی هویتی دارند ──
   کد ملی، شماره کارت، شماره موبایل. جایی نگهشان دارید که رمز داشته
   باشد و هرگز داخلِ گیت نروند.
*/

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/* ── کلیدها از فایلِ env محلی ──
   کپی‌کردنِ دستیِ کلیدِ سرویس در خطِ فرمان یعنی نشستنش در تاریخچه‌ی
   PowerShell — جایی که هیچ‌کس پاکش نمی‌کند. همان فایلی که خودِ برنامه
   می‌خواند این‌جا هم خوانده می‌شود.

   متغیرِ محیطیِ واقعی اولویت دارد، تا در سرور یا CI بشود بدونِ فایل
   اجرا کرد. */
const HERE = dirname(fileURLToPath(import.meta.url))
const WEB = join(HERE, '..')
for (const f of ['.env.local', '.env', join('..', '..', '.env')]) {
  const p = join(WEB, f)
  if (!existsSync(p)) continue
  try {
    /* ⚠️ تقسیم با `/\r?\n/` نه `'\n'`.
       فایلِ env روی ویندوز CRLF است و در جاوااسکریپت `.` کاراکترِ `\r`
       را نمی‌گیرد (خودش پایان‌خط شمرده می‌شود). با `split('\n')` هر خط
       یک `\r` ته‌اش می‌ماند، `(.*)$` تا آن‌جا نمی‌رسد و **هیچ کلیدی
       خوانده نمی‌شود** — جز آخرین خط که `\r` ندارد. دقیقاً همین شد:
       هشت کلید در فایل بود و فقط یکی پیدا شد. */
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/)
      if (!m) continue
      const k = m[1]
      if (process.env[k]) continue                       // محیط برنده است
      process.env[k] = (m[2] ?? '').trim().replace(/^["']|["']$/g, '')
    }
  } catch { /* خواندنی نبود — سراغِ بعدی */ }
}

const URL_ = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''

if (!URL_ || !KEY) {
  console.error(`
✗ نشانی یا کلیدِ سرویس پیدا نشد.

  معمولاً یعنی در apps/web/.env.local این دو نیستند:
    NEXT_PUBLIC_SUPABASE_URL=https://billiardhub.net
    SUPABASE_SERVICE_ROLE_KEY=…

  این پروژه از Supabase خودمیزبان استفاده می‌کند (داکر روی همان سرور)،
  نه از پروژه‌ی ابری؛ پس داشبوردِ supabase.co در کار نیست. کلیدِ
  service_role در تنظیماتِ همان نصب است — روی سرور کنارِ بقیه‌ی
  متغیرها در /opt/billiardhub/apps/web/.env.local.
  (کلیدِ anon کافی نیست؛ با آن بیشترِ جدول‌ها خالی برمی‌گردند.)
`)
  process.exit(1)
}

const PAGE = 1000
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

/* ── مقصد ──
   اولویت: آرگومانِ خطِ فرمان ← متغیرِ `BH_BACKUP_DIR` ← پوشه‌ی پروژه.

   پیش‌فرضِ داخلِ پروژه بهتر از هیچ است ولی هدف را کامل نمی‌کند: بکاپی
   که روی همان دیسکِ پروژه بماند، با خرابیِ همان دیسک از بین می‌رود.
   `BH_BACKUP_DIR` در `.env.local` یعنی یک‌بار تنظیم و بعد هر بار فقط
   `npm run backup`. */
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
const DEST = process.argv[2] || process.env.BH_BACKUP_DIR || join(process.cwd(), 'backups')
const OUT = join(DEST, stamp)
mkdirSync(join(OUT, 'tables'), { recursive: true })

const fa = n => Number(n).toLocaleString('fa-IR')
const mb = b => `${(b / 1048576).toFixed(1)} MB`

/* ── فهرستِ جدول‌ها از OpenAPI خودِ PostgREST ──
   هاردکدکردنِ فهرست یعنی هر جدولِ تازه‌ای بی‌صدا از پشتیبان جا می‌ماند
   و کسی تا روزِ بازیابی نمی‌فهمد. */
async function tableNames() {
  const r = await fetch(`${URL_}/rest/v1/`, { headers })
  if (!r.ok) throw new Error(`فهرستِ جدول‌ها گرفته نشد (${r.status})`)
  const spec = await r.json()
  return Object.keys(spec?.definitions ?? spec?.components?.schemas ?? {}).sort()
}

async function dumpTable(name) {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const r = await fetch(`${URL_}/rest/v1/${name}?select=*`, {
      headers: { ...headers, Range: `${from}-${from + PAGE - 1}` },
    })
    if (!r.ok) {
      /* نما یا جدولِ بدونِ دسترسی — رد شو ولی سکوت نکن */
      return { name, rows: -1, note: `HTTP ${r.status}` }
    }
    const page = await r.json()
    if (!Array.isArray(page)) break
    rows.push(...page)
    if (page.length < PAGE) break
  }
  writeFileSync(join(OUT, 'tables', `${name}.json`), JSON.stringify(rows, null, 1), 'utf8')
  return { name, rows: rows.length }
}

/* فهرستِ فایل‌ها — خودشان نه. حجمشان با ویدیو به گیگابایت می‌رسد و
   دانلودِ تک‌تک از یک اسکریپت نه سریع است نه قابل‌اتکا. این فهرست
   می‌گوید چه چیزی باید باشد؛ همگام‌سازیِ واقعی کارِ ابزارِ مخصوصش است. */
async function listBucket(bucket, prefix = '', acc = []) {
  const r = await fetch(`${URL_}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: 'name', order: 'asc' } }),
  })
  if (!r.ok) return acc
  const items = await r.json()
  if (!Array.isArray(items)) return acc
  for (const it of items) {
    const path = prefix ? `${prefix}/${it.name}` : it.name
    if (it.id === null) await listBucket(bucket, path, acc)          // پوشه
    else acc.push({ path, size: it.metadata?.size ?? 0, updated: it.updated_at ?? null })
  }
  return acc
}

console.log(`\n■ پشتیبان‌گیری → ${OUT}\n`)

const names = await tableNames()
console.log(`  ${fa(names.length)} جدول پیدا شد\n`)

const results = []
for (const n of names) {
  const res = await dumpTable(n)
  results.push(res)
  console.log(res.rows < 0
    ? `  ⚠ ${n} — ${res.note}`
    : `  ✓ ${n} — ${fa(res.rows)} ردیف`)
}

console.log('')

/* ── باکت‌ها را نباید هاردکد کرد ──
   نسخه‌ی اول `['club-media','documents']` بود. ولی باکتِ خصوصی نامش
   `bh-private` است نه `documents` — یعنی پشتیبان **۳۴۰ فایلِ مدارک**
   را اصلاً نمی‌دید و به‌جایش باکتی را می‌شمرد که وجود نداشت (و صفر
   گزارش می‌کرد، که شبیهِ «مدرکی نیست» به‌نظر می‌رسید).

   همان درسِ فهرستِ جدول‌ها: هرچه هاردکد شود، روزی از پشتیبان جا
   می‌ماند و تا روزِ بازیابی کسی نمی‌فهمد. */
async function bucketNames() {
  try {
    const r = await fetch(`${URL_}/storage/v1/bucket`, { headers })
    if (!r.ok) return []
    const list = await r.json()
    return Array.isArray(list) ? list.map(b => String(b.name)).filter(Boolean) : []
  } catch { return [] }
}

const buckets = await bucketNames()
if (!buckets.length) console.log('  ⚠ فهرستِ باکت‌ها گرفته نشد')
const files = {}
for (const b of buckets) {
  const list = await listBucket(b)
  files[b] = list
  const total = list.reduce((s, f) => s + Number(f.size || 0), 0)
  console.log(`  ✓ باکت ${b} — ${fa(list.length)} فایل · ${mb(total)}`)
}
writeFileSync(join(OUT, 'storage-manifest.json'), JSON.stringify(files, null, 1), 'utf8')

const okRows = results.filter(r => r.rows >= 0).reduce((s, r) => s + r.rows, 0)
writeFileSync(join(OUT, 'summary.json'), JSON.stringify({
  at: new Date().toISOString(),
  tables: results,
  totalRows: okRows,
  buckets: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.length])),
}, null, 1), 'utf8')

console.log(`\n✅ ${fa(okRows)} ردیف در ${fa(results.filter(r => r.rows >= 0).length)} جدول\n`)
console.log('   ⚠️ این پوشه کد ملی و شماره کارت دارد — رمزگذاری‌اش کنید و هرگز در گیت نگذارید.\n')
