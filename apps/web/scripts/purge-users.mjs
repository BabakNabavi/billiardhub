/* حذفِ فایل‌های Storageِ چند حساب — کدِ پیامکی، دایرکت، اعلان، استوری، عکس و ویدیو و مدرکِ پروفایل.
       node scripts/purge-users.mjs --phones 09936333087,09000000101   (پیش‌نمایش)
       node scripts/purge-users.mjs --phones ... --apply                 (اجرا)
   گزینه‌ها:
       --admin-ok 09000000103   ادمین بودنِ همین شماره(ها) مانع نیست (حسابِ آزمونی)
       --ids <uuid>,...         شناسه‌ها وقتی ردیفِ users دیگر نیست (اجرای دوباره پس از ۱۱۶)
       --allow-missing          اگر همه‌ی شماره‌ها حساب نداشتند، ادامه بده

   روی خودِ سرور اجرا می‌شود (/opt/billiardhub/apps/web) تا همان .env.local را
   بخواند. ترتیب: پیش‌نمایشِ مهاجرتِ ۱۱۶ (باید بی‌خطا باشد) ⟵ این اسکریپت
   (پیش‌نمایش، بعد --apply) ⟵ ۱۱۶ با apply=1. این‌جا حذف برگشت‌پذیر نیست،
   پس اول باید مطمئن بود SQL متوقف نمی‌شود.

   چرا اسکریپت و نه SQL: این فایل‌ها ردیفِ جدول نیستند؛ حذفِ ردیفِ
   storage.objects از SQL فایل را روی دیسک یتیم می‌گذارد. فایل‌های مشترک
   ویرایش می‌شوند، نه حذف — و هر کدام درست پیش از نوشتن دوباره خوانده می‌شود:
     • social/stories/index.json — استوری‌های این حساب‌ها (و عکسشان)
     • social/dm-idx/<طرفِ گفتگو>.json — گفتگو با این حساب‌ها
     • social/notif/<دیگران>.json — اعلان‌هایی که این حساب‌ها فرستاده‌اند
   محتوای حذف‌شده جایی ذخیره نمی‌شود — فقط فهرستِ مسیرها چاپ می‌شود. */

import fs from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  fs.readFileSync(join(here, '..', '.env.local'), 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }),
)
const U = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const K = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
if (!U || !K) { console.error('Supabase credentials missing in .env.local'); process.exit(1) }

const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? '' : (process.argv[i + 1] ?? '') }
const csv = s => s.split(',').map(x => x.trim()).filter(Boolean)
const APPLY = process.argv.includes('--apply')
const PHONES = csv(arg('--phones'))
const ADMIN_OK = new Set(csv(arg('--admin-ok')))
const EXTRA_IDS = csv(arg('--ids'))
const bad = [...PHONES.filter(p => !/^09\d{9}$/.test(p)), ...EXTRA_IDS.filter(i => !/^[0-9a-f-]{36}$/i.test(i))]
if (!PHONES.length || bad.length) { console.error(`usage: --phones 09xxxxxxxxx,... [--apply]  (bad: ${bad.join(', ') || '-'})`); process.exit(1) }

const H = { apikey: K, Authorization: `Bearer ${K}` }
const PUBLIC = 'club-media', PRIVATE = 'bh-private', SELLER = 'seller-media'
/* همان lib/social-server */
const PRIVATE_PREFIXES = ['social/dm/', 'social/dm-idx/', 'social/dm-poll/', 'social/notif/', 'social/push/', 'social/otp/', 'social/seen/', 'documents/']
const bucketFor = p => PRIVATE_PREFIXES.some(x => p.startsWith(x)) ? PRIVATE : PUBLIC
const safeKey = k => (k || 'x').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80)
const rest = async path => {
  const r = await fetch(`${U}/rest/v1/${path}`, { headers: H })
  const j = await r.json().catch(() => null)
  if (!r.ok || !Array.isArray(j)) throw new Error(`read ${path.split('?')[0]}: ${r.status} ${JSON.stringify(j)}`)
  return j
}
const inList = xs => encodeURIComponent(`(${xs.map(x => `"${x}"`).join(',')})`)

/* ── حساب‌ها ── */
const users = await rest(`users?select=id,phone,firstName,lastName,avatar,is_platform_owner,primaryRole,secondaryRoles&phone=in.${inList(PHONES)}`)
console.log(`\n== accounts (${users.length}/${PHONES.length}) ==`)
for (const u of users) console.log(`  ${u.phone}  ${u.id}  ${u.firstName ?? ''} ${u.lastName ?? ''}  ${u.primaryRole}`)
if (users.length !== PHONES.length && !process.argv.includes('--allow-missing')) {
  const found = new Set(users.map(u => u.phone))
  console.error(`ABORT: no account for ${PHONES.filter(p => !found.has(p)).join(', ')} (use --allow-missing after SQL 116, with --ids)`)
  process.exit(1)
}
if (users.some(u => u.is_platform_owner)) { console.error('ABORT: the platform owner is in the list'); process.exit(1) }
const strayAdmin = users.filter(u => (u.primaryRole === 'admin' || (u.secondaryRoles ?? []).includes('admin')) && !ADMIN_OK.has(u.phone))
if (strayAdmin.length) { console.error(`ABORT: admin account(s) not allowed by --admin-ok: ${strayAdmin.map(u => u.phone).join(', ')}`); process.exit(1) }

const IDS = [...new Set([...users.map(u => u.id), ...EXTRA_IDS])]
/* پروفایل‌ها — فایل‌های فروشگاه و ویدیوی پروفایل زیرِ شناسه‌ی پروفایل‌اند */
const profiles = IDS.length ? await rest(`profiles?select=id,kind,slug&owner_id=in.${inList(IDS)}`) : []
const videos = IDS.length ? await rest(`videos?select=id,storage_key,thumb_key&owner_id=in.${inList(IDS)}`) : []

/* کلیدهای «حساب» (شماره و شناسه — کلیدِ دایرکت/اعلان) جدا از کلیدهای مسیر (+ پروفایل) */
const ACCOUNT_KEYS = new Set([...PHONES, ...IDS].map(safeKey))
const PATH_KEYS = new Set([...ACCOUNT_KEYS, ...profiles.map(p => safeKey(p.id))])
/* تطبیقِ بخشِ مسیر، نه زیررشته — وگرنه «09000000101» درونِ یک نامِ زمان‌دار
   هم پیدا می‌شد. شکل‌ها: <key>، <key>.json، <key>-<زمان>.jpg (عکسِ پروفایل)،
   <a>__<b> (شناسه‌ی گفتگو) */
const segMatch = seg => {
  const base = seg.replace(/\.[a-z0-9]+$/i, '')
  if (PATH_KEYS.has(seg) || PATH_KEYS.has(base) || base.split('__').some(k => PATH_KEYS.has(k))) return true
  return [...PATH_KEYS].some(k => base.startsWith(`${k}-`) && /^\d+$/.test(base.slice(k.length + 1)))
}
const hasKey = path => path.split('/').some(segMatch)

/* ── Storage API ── */
async function list(bucket, prefix) {
  const out = []
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${U}/storage/v1/object/list/${bucket}`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
    })
    const items = await r.json().catch(() => null)
    if (!r.ok || !Array.isArray(items)) {
      if (/bucket not found/i.test(JSON.stringify(items))) { console.log(`  (bucket ${bucket} does not exist - skipped)`); return [] }
      throw new Error(`list ${bucket}/${prefix}: ${r.status} ${JSON.stringify(items)}`)
    }
    out.push(...items)
    if (items.length < 1000) break
  }
  return out
}
/* پیمایشِ بازگشتی؛ `descend(path)` می‌گوید به کدام پوشه وارد شود */
async function walk(bucket, prefix, descend, files = []) {
  for (const it of await list(bucket, prefix)) {
    const path = prefix ? `${prefix}/${it.name}` : it.name
    if (it.id === null) { if (descend(path)) await walk(bucket, path, descend, files) }
    else files.push(path)
  }
  return files
}
async function readJson(path) {
  const r = await fetch(`${U}/storage/v1/object/${bucketFor(path)}/${path}`, { headers: H })
  if (r.status === 400 || r.status === 404) return null
  if (!r.ok) throw new Error(`read ${path}: ${r.status}`)
  return r.json()
}
async function writeJson(path, obj) {
  const r = await fetch(`${U}/storage/v1/object/${bucketFor(path)}/${path}`, {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json', 'x-upsert': 'true', 'cache-control': '0' },
    body: JSON.stringify(obj),
  })
  if (!r.ok) throw new Error(`write ${path}: ${r.status} ${await r.text()}`)
}
async function remove(entries) {
  const byBucket = new Map()
  for (const [b, p] of entries) byBucket.set(b, [...(byBucket.get(b) ?? []), p])
  let n = 0
  for (const [b, ps] of byBucket) for (let i = 0; i < ps.length; i += 500) {
    const r = await fetch(`${U}/storage/v1/object/${b}`, {
      method: 'DELETE', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: ps.slice(i, i + 500) }),
    })
    const j = await r.json().catch(() => [])
    if (!r.ok) throw new Error(`delete in ${b}: ${r.status} ${JSON.stringify(j)}`)
    n += Array.isArray(j) ? j.length : 0
  }
  return n
}
const urlToPath = (u, bucket = PUBLIC) => (String(u ?? '').split(`/${bucket}/`)[1] ?? '').split('?')[0]

/* ── ۱) فایل‌هایی که مسیرشان کلیدِ این حساب‌ها را دارد ── */
const doomed = new Map()   // "bucket:path" ⟵ [bucket, path]
const add = (b, p) => { if (p) doomed.set(`${b}:${p}`, [b, p]) }
const touchedConvs = new Set()
const notifFiles = []
/* خصوصی: پوشه‌های کاربرمحور کامل، ولی در social/dm فقط گفتگوهای همین حساب‌ها */
for (const f of await walk(PRIVATE, 'social', p => p === 'social/dm' || !p.startsWith('social/dm/') || hasKey(p))) {
  if (hasKey(f)) add(PRIVATE, f)
  else if (f.startsWith('social/notif/')) notifFiles.push(f)
  const m = /^social\/dm\/([^/]+)\//.exec(f)
  if (m && hasKey(m[1])) touchedConvs.add(m[1])
}
for (const f of await walk(PRIVATE, 'documents', () => true)) if (hasKey(f)) add(PRIVATE, f)
/* عمومی: پروفایل (profiles/<kind>/<id>، profiles/videos/<id>، profiles/<id>-<زمان>.jpg) و تبلیغ (ads/<userId>/) */
for (const f of await walk(PUBLIC, 'profiles', () => true)) if (hasKey(f)) add(PUBLIC, f)
for (const f of await walk(PUBLIC, 'ads', p => hasKey(p))) if (hasKey(f)) add(PUBLIC, f)
for (const f of await walk(SELLER, 'sellers', p => hasKey(p))) if (hasKey(f)) add(SELLER, f)
/* عکسِ پروفایلِ ثبت‌شده و فایل‌های ویدیوی این حساب‌ها */
for (const u of users) { const p = urlToPath(u.avatar); if (p.startsWith('profiles/')) add(PUBLIC, p) }
for (const v of videos) for (const k of [v.storage_key, v.thumb_key]) if (k && k.startsWith('media/')) add(PUBLIC, k)

/* ── ۲) استوری‌ها ── */
const STORIES = 'social/stories/index.json'
const isMine = s => ACCOUNT_KEYS.has(safeKey(String(s?.ownerKey ?? '')))
const mine = ((await readJson(STORIES)) ?? []).filter(isMine)
for (const s of mine) { const p = urlToPath(s.mediaUrl); if (p.startsWith('social/stories/')) add(PUBLIC, p) }

/* ── ۳) فهرستِ گفتگوی طرفِ مقابل و اعلان‌های دیگران ── */
const keepConv = it => !String(it?.convId ?? '').split('__').some(k => ACCOUNT_KEYS.has(k))
  && !ACCOUNT_KEYS.has(safeKey(String(it?.otherKey ?? '')))
const keepNotif = n => !ACCOUNT_KEYS.has(safeKey(String(n?.fromKey ?? '')))
const counterparts = new Set()
for (const cid of touchedConvs) for (const side of cid.split('__')) if (!ACCOUNT_KEYS.has(side)) counterparts.add(side)
const edits = []   // { path, keep, removed }
for (const other of counterparts) {
  const path = `social/dm-idx/${other}.json`
  const idx = await readJson(path)
  if (Array.isArray(idx) && idx.some(it => !keepConv(it))) edits.push({ path, keep: keepConv, removed: idx.filter(it => !keepConv(it)).length })
}
for (const path of notifFiles) {
  const list_ = await readJson(path)
  if (Array.isArray(list_) && list_.some(n => !keepNotif(n))) edits.push({ path, keep: keepNotif, removed: list_.filter(n => !keepNotif(n)).length })
}

console.log(`\n== profiles: ${profiles.length}, videos: ${videos.length} ==`)
console.log(`\n== files to delete (${doomed.size}) ==`)
for (const [b, p] of [...doomed.values()].sort((x, y) => (x[0] + x[1]).localeCompare(y[0] + y[1]))) console.log(`  ${b}  ${p}`)
console.log(`\n== stories removed from index: ${mine.length} ==`)
for (const s of mine) console.log(`  ${s.id}  ${new Date(s.createdAt).toISOString()}  ${s.roleLabel ?? ''}`)
console.log(`\n== shared files edited: ${edits.length} ==`)
for (const e of edits) console.log(`  ${e.path}  (-${e.removed})`)

if (!APPLY) { console.log('\n>>> PREVIEW ONLY - nothing was changed. Re-run with --apply.'); process.exit(0) }

/* فهرست‌ها اول، هر کدام تازه خوانده: اگر حذفِ فایل نیمه‌کاره بماند، دست‌کم
   دیگر به فایلِ ناموجود اشاره نمی‌کنند، و نوشتنِ تازه‌ی دیگران گم نمی‌شود */
if (mine.length) {
  const fresh = (await readJson(STORIES)) ?? []
  await writeJson(STORIES, fresh.filter(s => !isMine(s)))
}
for (const e of edits) {
  const fresh = await readJson(e.path)
  if (Array.isArray(fresh)) await writeJson(e.path, fresh.filter(e.keep))
}
const n = await remove([...doomed.values()])
console.log(`\n>>> APPLIED. files deleted: ${n}/${doomed.size}, stories removed: ${mine.length}, shared files edited: ${edits.length}`)
