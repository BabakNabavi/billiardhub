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

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const URL_ = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''

if (!URL_ || !KEY) {
  console.error(`
✗ متغیرهای محیطی تنظیم نشده‌اند.

  در PowerShell:
    $env:NEXT_PUBLIC_SUPABASE_URL   = "https://xxxx.supabase.co"
    $env:SUPABASE_SERVICE_ROLE_KEY  = "…"
    node apps/web/scripts/backup.mjs

  کلید را جایی ننویسید که در گیت برود.
`)
  process.exit(1)
}

const PAGE = 1000
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
const OUT = join(process.argv[2] || join(process.cwd(), 'backups'), stamp)
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
const buckets = ['club-media', 'documents']
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
