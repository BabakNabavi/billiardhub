/* پاک‌کردنِ رزروهای آزمایشی — با پشتیبان و راستی‌آزمایی.
       node scripts/purge-test-bookings.mjs --dry     (فقط گزارش)
       node scripts/purge-test-bookings.mjs --apply   (اجرا)

   چرا اسکریپت و نه یک DELETE دستی: حذفِ رزرو به booking_slots و
   payments و refunds آبشار می‌شود، ولی `ledger_entries.booking_id`
   کلیدِ خارجی *ندارد* — پس ردیف‌های مالی یتیم می‌مانند و تبِ «مالی»
   همچنان پولی را نشان می‌دهد که رزروش وجود ندارد. این‌جا آن‌ها هم
   جداگانه پاک می‌شوند.

   پیش از هر حذف، همه‌چیز در یک فایلِ JSON بیرون از مخزن ذخیره می‌شود. */

import fs from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  fs.readFileSync(join(here, '..', '.env.local'), 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }),
)
const U = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const K = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
if (!U || !K) { console.log('اعتبارنامه‌ی Supabase نیست — رد شد.'); process.exit(0) }

const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' }
const get = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: H })).json().catch(() => null)
const del = async p => {
  const r = await fetch(`${U}/rest/v1/${p}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=representation' } })
  const b = await r.json().catch(() => null)
  return { status: r.status, n: Array.isArray(b) ? b.length : 0, body: b }
}

const APPLY = process.argv.includes('--apply')

/* ── ۱) عکسِ فعلی ── */
const TABLES = ['bookings', 'booking_slots', 'payments', 'refunds', 'ledger_entries']
const snap = {}
for (const t of TABLES) snap[t] = (await get(`${t}?select=*`)) ?? []

console.log('■ وضعیتِ فعلی')
for (const t of TABLES) console.log(`  ${t.padEnd(16)} ${snap[t].length} ردیف`)

if (!snap.bookings.length) { console.log('\n  چیزی برای پاک‌کردن نیست.\n'); process.exit(0) }

const clubs = (await get('clubs?select=id,name')) ?? []
const nameOf = id => clubs.find(c => c.id === id)?.name ?? String(id).slice(0, 8)
const byClub = {}
for (const b of snap.bookings) byClub[b.clubId] = (byClub[b.clubId] ?? 0) + 1
console.log('\n■ رزروها به تفکیکِ باشگاه')
for (const [c, n] of Object.entries(byClub)) console.log(`  ${nameOf(c).padEnd(20)} ${n}`)

if (!APPLY) {
  console.log('\n  (حالتِ گزارش — چیزی حذف نشد. برای اجرا: --apply)\n')
  process.exit(0)
}

/* ── ۲) پشتیبان، بیرون از مخزن ── */
const bak = `C:/Users/bob/AppData/Local/Temp/bookings-backup-${snap.bookings.length}rows.json`
fs.writeFileSync(bak, JSON.stringify(snap, null, 2))
console.log(`\n■ پشتیبان: ${bak}`)

/* ── ۳) حذف ──
   ledger اول: کلیدِ خارجی ندارد، پس آبشار پاکش نمی‌کند و اگر بعد از
   حذفِ رزروها بیاید، دیگر نمی‌دانیم کدام ردیف مالِ کدام رزرو بود. */
const ids = snap.bookings.map(b => b.id)
console.log('\n■ حذف')

const ledgerIds = snap.ledger_entries.filter(l => l.booking_id && ids.includes(l.booking_id)).map(l => l.id)
if (ledgerIds.length) {
  const r = await del(`ledger_entries?id=in.(${ledgerIds.join(',')})`)
  console.log(`  ledger_entries   ${r.n} ردیف (${r.status})`)
}
const r2 = await del(`bookings?id=in.(${ids.join(',')})`)
console.log(`  bookings         ${r2.n} ردیف (${r2.status})`)
if (r2.status >= 400) { console.log('  ✗ خطا:', JSON.stringify(r2.body).slice(0, 200)); process.exit(1) }

/* ── ۴) راستی‌آزمایی — دوباره از سرور، نه با فرضِ موفقیت ── */
console.log('\n■ پس از حذف')
let bad = 0
for (const t of TABLES) {
  const rows = (await get(`${t}?select=id`)) ?? []
  const expected = t === 'ledger_entries' ? snap.ledger_entries.length - ledgerIds.length : 0
  const ok = rows.length === expected
  if (!ok) bad++
  console.log(`  ${ok ? '✓' : '✗'} ${t.padEnd(16)} ${rows.length} ردیف (انتظار ${expected})`)
}
console.log(bad ? '\n  ✗ همه‌چیز پاک نشد\n' : '\n  ✓ رزروها پاک شدند — آماده‌ی آزمایشِ تازه\n')
process.exit(bad ? 1 : 0)
