#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   گزارشِ فایل‌های بی‌ارجاع در Storage.

   ── چرا لازم است ──
   هیچ‌جای پروژه فایلی از Storage حذف نمی‌کند. حذفِ باشگاه، محصول یا
   پروفایل فقط رکورد را می‌برد و فایل تا ابد می‌ماند. استوری هم بعد از
   ۲۴ ساعت از فهرست بیرون می‌رود ولی عکسش می‌ماند.

   با هزار کاربرِ فعال و روزی یک استوری، سالی صدها هزار فایلِ مرده
   جمع می‌شود که هیچ‌وقت دیده نمی‌شوند و فقط هزینه می‌برند.

   ── چرا فقط گزارش، بدونِ حذف ──
   تشخیصِ «بی‌ارجاع» ذاتاً خطرناک است: اگر جایی را برای جست‌وجو از قلم
   بیندازیم، عکسِ واقعیِ یک کاربر «یتیم» تشخیص داده می‌شود. پس این
   ابزار هرگز چیزی پاک نمی‌کند — فقط نشان می‌دهد چه چیزی *نامزدِ* حذف
   است تا با چشم بررسی شود.

   ── روشِ یافتنِ ارجاع‌ها ──
   به‌جای شمردنِ دستیِ ستون‌ها (که با هر ستونِ تازه کهنه می‌شود)، هر
   ردیفِ هر جدول به jsonb تبدیل و کلِ متنش دنبالِ مسیرهای Storage
   گشته می‌شود. یعنی نشانی هرجای دیتابیس باشد — ستونِ ساده، آرایه،
   JSON تودرتو — پیدا می‌شود.

   فهرستِ استوری‌ها داخلِ خودِ Storage است (یک فایلِ JSON)، پس آن هم
   جداگانه خوانده می‌شود.

   اجرا:  node scripts/orphan-report.mjs
   ───────────────────────────────────────────────────────────── */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(process.cwd(), process.cwd().endsWith('web') ? '../..' : '.')

function envFrom(file, key) {
  try {
    const t = fs.readFileSync(path.join(ROOT, file), 'utf8')
    return t.match(new RegExp(key + '\\s*=\\s*"?([^"\\r\\n]+)'))?.[1]?.trim()
  } catch { return undefined }
}

const DB = process.env.DATABASE_URL ?? envFrom('.env', 'DATABASE_URL')
const SU = process.env.NEXT_PUBLIC_SUPABASE_URL ?? envFrom('apps/web/.env.local', 'NEXT_PUBLIC_SUPABASE_URL')
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY ?? envFrom('apps/web/.env.local', 'SUPABASE_SERVICE_ROLE_KEY')
if (!DB || !SU || !SK) {
  console.error('DATABASE_URL / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY لازم است')
  process.exit(1)
}

const { Client } = require('pg')
const c = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } })
await c.connect()

/* ── ۱) هر مسیری که در دیتابیس به آن اشاره شده ── */
const tables = (await c.query(`
  SELECT c.relname AS t FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' ORDER BY 1`)).rows.map(r => r.t)

const referenced = new Set()
/* هم نشانیِ کاملِ عمومی، هم مسیرِ خام (بعضی ستون‌ها فقط مسیر دارند) */
const URL_RE = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/[a-z0-9-]+\/([^"'\s?)\\]+)/gi
const BARE_RE = /(?:^|["'\s,:[])((?:clubs|products|profiles|sellers|social|documents)\/[A-Za-z0-9_./-]{4,})/g

for (const t of tables) {
  let rows
  try {
    rows = (await c.query(`SELECT to_jsonb(x)::text AS j FROM "${t}" x`)).rows
  } catch { continue }
  for (const r of rows) {
    const s = r.j ?? ''
    for (const m of s.matchAll(URL_RE)) referenced.add(decodeURIComponent(m[1]))
    for (const m of s.matchAll(BARE_RE)) referenced.add(m[1])
  }
}

/* ── ۲) فهرست‌هایی که داخلِ خودِ Storage زندگی می‌کنند ──

   ⚠️ این بخش نخستین بار فقط استوری را می‌خواند و `social/media/*.json`
   را نه. نتیجه‌اش این شد که دو ویدیوی واقعیِ کاربر «بی‌ارجاع» تشخیص
   داده و حذف شدند — تنها ارجاعشان در همان فهرستی بود که خوانده
   نمی‌شد.

   پس به‌جای نامِ ثابت، *هر* فایلِ JSONِ زیرِ `social/` خوانده می‌شود.
   قاعده‌ی ساختاری با هر فهرستِ تازه‌ای هم درست می‌ماند؛ فهرستِ دستی
   دوباره همان اشتباه را می‌سازد. */
const sb = (bucket, p) => `${SU}/storage/v1/object/${bucket}/${p}`
const H = { apikey: SK, authorization: 'Bearer ' + SK }

const stateFiles = (await c.query(`
  SELECT name FROM storage.objects
  WHERE bucket_id='club-media' AND name LIKE 'social/%' AND name LIKE '%.json'
`)).rows.map(r => r.name)

for (const p of stateFiles) {
  try {
    const r = await fetch(sb('club-media', p), { headers: H })
    if (!r.ok) continue
    const txt = await r.text()
    for (const m of txt.matchAll(URL_RE)) referenced.add(decodeURIComponent(m[1]))
    for (const m of txt.matchAll(BARE_RE)) referenced.add(m[1])
  } catch { /* نبود */ }
}

/* ── ۳) هرچه واقعاً در Storage هست ── */
const objects = (await c.query(`
  SELECT bucket_id, name, coalesce((metadata->>'size')::bigint,0) AS size, created_at
  FROM storage.objects ORDER BY created_at`)).rows

/* فایل‌های زیرِ این پیشوندها زیرساختِ خودِ سایت‌اند و ارجاعِ دیتابیسی
   ندارند — نباید یتیم شمرده شوند. */
const INFRA = ['social/dm/', 'social/dm-idx/', 'social/dm-poll/', 'social/notif/',
  'social/push/', 'social/otp/', 'social/seen/', 'social/live']

/* ⚠️ هر فایلِ حالتِ زیرِ `social/` هم زیرساخت است، نه رسانه.

   نخستین اجرا این را نداشت و `social/stories/index.json` — یعنی خودِ
   فهرستِ استوری‌ها — «بی‌ارجاع» تشخیص داده و حذف شد. منطقی هم بود:
   هیچ رکوردی به آن اشاره نمی‌کند، چون خودش فهرست است.

   نامِ تک‌تکِ فایل‌ها را شمردن همین اشتباه را دوباره می‌سازد (فهرست
   `social/stories.json` را داشت که اصلاً مسیرِ درستی نبود). قاعده‌ی
   ساختاری امن‌تر است: رسانه‌ی کاربران هیچ‌وقت `.json` نیست. */
const isStateFile = (n) => n.startsWith('social/') && n.endsWith('.json')

/* ── محافظِ مستقل از درستیِ منطقِ بالا ──

   دو اشتباهِ بالا هر دو از یک جنس بودند: منطق درست اجرا شد ولی روی
   ورودیِ ناقص. چنین چیزی همیشه ممکن است — یک فهرستِ تازه، یک ستونِ
   تازه، یک مسیرِ تازه.

   پس یک شرطِ بیرونی هم گذاشته می‌شود که به هیچ‌کدام از آن‌ها وابسته
   نیست: اگر شمارشِ ارجاع‌ها مشکوک کم باشد در حالی که فایلِ زیاد
   داریم، یعنی احتمالاً جایی از خواندنِ ارجاع‌ها شکسته — و در آن
   حالت حذف اصلاً اجرا نمی‌شود.

   عدد سخت‌گیرانه نیست؛ فقط جلوی فاجعه را می‌گیرد. */
const SANITY_MIN_REF = Number(process.env.SANITY_MIN_REF ?? 0)

const GRACE_DAYS = Number(process.env.GRACE_DAYS ?? 7)
const cutoff = Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000

const orphans = []
let infra = 0, young = 0, live = 0
for (const o of objects) {
  if (INFRA.some(p => o.name.startsWith(p)) || isStateFile(o.name)) { infra++; continue }
  if (referenced.has(o.name)) { live++; continue }
  if (new Date(o.created_at).getTime() > cutoff) { young++; continue }
  orphans.push(o)
}

const mb = n => (Number(n) / 1024 / 1024).toFixed(2)
const total = objects.reduce((s, o) => s + Number(o.size), 0)
const orphanBytes = orphans.reduce((s, o) => s + Number(o.size), 0)

console.log('\n════ گزارشِ فایل‌های بی‌ارجاع ════\n')
console.log('  کلِ فایل‌ها      : ' + objects.length + '   (' + mb(total) + ' MB)')
console.log('  ارجاع دارند     : ' + live)
console.log('  زیرساختِ سایت   : ' + infra + '   (دایرکت، اعلان، اشتراکِ push…)')
console.log('  تازه‌تر از ' + GRACE_DAYS + ' روز : ' + young + '   (مهلت — شاید هنوز ذخیره نشده)')
console.log('  ── نامزدِ حذف   : ' + orphans.length + '   (' + mb(orphanBytes) + ' MB)')

if (orphans.length) {
  const byPrefix = {}
  for (const o of orphans) {
    const k = o.bucket_id + '/' + o.name.split('/').slice(0, 2).join('/')
    byPrefix[k] = byPrefix[k] ?? { n: 0, b: 0 }
    byPrefix[k].n++; byPrefix[k].b += Number(o.size)
  }
  console.log('\n  به تفکیکِ مسیر:')
  for (const [k, v] of Object.entries(byPrefix).sort((a, b) => b[1].b - a[1].b))
    console.log('   ' + k.padEnd(42) + String(v.n).padStart(5) + ' فایل   ' + mb(v.b) + ' MB')

  if (process.env.SHOW_NAMES === '1') {
    console.log('\n  نمونه (۲۰ مورد):')
    for (const o of orphans.slice(0, 20)) console.log('   ' + o.bucket_id + '/' + o.name)
  } else {
    console.log('\n  (برای دیدنِ نام‌ها: SHOW_NAMES=1)')
  }
}

/* ── حذف ──

   عمداً پشتِ یک متغیرِ صریح است و پیش‌فرضش خاموش. اجرای بی‌پرچمِ این
   اسکریپت هرگز چیزی پاک نمی‌کند.

   پیش از حذف، فهرستِ کاملِ نام‌ها در یک فایل نوشته می‌شود. اگر بعداً
   معلوم شد چیزی اشتباه پاک شده، دستِ‌کم می‌دانیم دقیقاً چه بود —
   بدونِ آن، حذف یک عملیاتِ بی‌ردِ برگشت‌ناپذیر است.

   اجرا:  CONFIRM_DELETE=yes node scripts/orphan-report.mjs           */
const refCount = referenced.size
const stateRead = stateFiles.length
console.log('\n  ارجاع‌های یافته‌شده: ' + refCount +
  '   (از ' + tables.length + ' جدول و ' + stateRead + ' فهرستِ داخلِ Storage)')

/* اگر بیش از نیمی از فایل‌ها نامزدِ حذف‌اند، یا هیچ ارجاعی پیدا نشده
   در حالی که فایل زیاد است، احتمالاً خواندنِ ارجاع‌ها شکسته. */
const suspicious =
  (orphans.length > objects.length * 0.5 && objects.length > 20) ||
  (refCount <= SANITY_MIN_REF && objects.length > 20)

if (suspicious && process.env.CONFIRM_DELETE === 'yes') {
  console.log('\n  ⛔ حذف اجرا نشد — نسبتِ نامزدها مشکوک است.')
  console.log('     ' + orphans.length + ' از ' + objects.length + ' فایل نامزدِ حذف‌اند و ' +
    refCount + ' ارجاع پیدا شد.')
  console.log('     این معمولاً یعنی جایی از خواندنِ ارجاع‌ها کار نمی‌کند،')
  console.log('     نه اینکه واقعاً این‌همه فایلِ مرده داریم.')
  console.log('     اگر مطمئنی درست است: FORCE_DELETE=yes\n')
  if (process.env.FORCE_DELETE !== 'yes') { await c.end(); process.exit(2) }
}

if (orphans.length && process.env.CONFIRM_DELETE === 'yes') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const manifest = path.join(ROOT, `orphan-deleted-${stamp}.json`)
  fs.writeFileSync(manifest, JSON.stringify(
    orphans.map(o => ({ bucket: o.bucket_id, name: o.name, size: Number(o.size), created: o.created_at })),
    null, 1,
  ))
  console.log('  فهرستِ حذف‌شونده ثبت شد: ' + path.basename(manifest))

  /* دسته‌دسته: درخواستِ حذفِ صدها مسیر در یک تماس گاهی timeout می‌دهد
     و آن‌وقت معلوم نیست چه مقدارش انجام شده. */
  const byBucket = {}
  for (const o of orphans) (byBucket[o.bucket_id] ??= []).push(o.name)

  let removed = 0, failed = 0
  for (const [bucket, names] of Object.entries(byBucket)) {
    for (let i = 0; i < names.length; i += 50) {
      const batch = names.slice(i, i + 50)
      const r = await fetch(`${SU}/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: { ...H, 'content-type': 'application/json' },
        body: JSON.stringify({ prefixes: batch }),
      })
      if (r.ok) removed += batch.length
      else { failed += batch.length; console.error('  ✗ دسته ناموفق: ' + r.status + ' ' + (await r.text()).slice(0, 120)) }
    }
  }
  console.log('\n  حذف شد: ' + removed + '   ناموفق: ' + failed)

  const after = (await c.query(`
    SELECT count(*)::int AS n, coalesce(sum((metadata->>'size')::bigint),0) AS b FROM storage.objects`)).rows[0]
  console.log('  وضعیتِ Storage پس از حذف: ' + after.n + ' فایل   ' + mb(after.b) + ' MB')
} else {
  console.log('\n  ⚠ این اجرا چیزی حذف نکرد. فهرستِ بالا فقط نامزدِ بررسی است.')
  console.log('    پیش از هر حذفی باید چند مورد را با چشم باز کرد و مطمئن شد')
  console.log('    واقعاً بی‌استفاده‌اند — یک تشخیصِ اشتباه یعنی عکسِ یک کاربرِ واقعی.')
  if (orphans.length) console.log('    برای حذف: CONFIRM_DELETE=yes node scripts/orphan-report.mjs')
}
console.log('')

await c.end()
