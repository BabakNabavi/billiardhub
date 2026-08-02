/* دو مسیرِ تازه‌ی پنلِ ادمین، در سطحِ HTTP:
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-admin-manage.mjs

   · /api/admin/tournaments  — دیدن، ساخت، تغییرِ وضعیت و حذفِ مسابقه
   · /api/admin/grant-admin  — اعطا و لغوِ دسترسیِ ادمین

   ── چه چیزی این‌جا سنجیده می‌شود و چه چیزی نه ──
   حسابِ آزمایشیِ در دسترس `club_owner` است، نه ادمین. پس این تست
   نیمه‌ی امنیتیِ ماجرا را می‌سنجد — که همان نیمه‌ی خطرناک است: آیا
   کسی که ادمین نیست می‌تواند مسابقه بسازد، حذف کند، یا به خودش
   دسترسیِ ادمین بدهد؟ مسیرِ مثبت (ادمینِ واقعی) عمداً آزموده نمی‌شود؛
   برای آن باید حسابِ ادمین بالا بیاید و این تست حق ندارد نقشِ کسی را
   در دیتابیسِ واقعی عوض کند.

   هیچ داده‌ای ساخته یا حذف نمی‌شود. */

import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BH_BASE ?? 'http://localhost:3000'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PHONE = process.env.BH_TEST_PHONE, PASS = process.env.BH_TEST_PASS
/* بی‌اعتبارنامه هم بخشِ «بدونِ ورود» اجرا می‌شود — همان بخشی که اگر
   بشکند، هر رهگذری می‌تواند مسابقه حذف کند یا خودش را ادمین کند. */
const LOGGED = Boolean(PHONE && PASS)

const env = Object.fromEntries(
  fs.readFileSync(join(here, '..', '.env.local'), 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`) }
const head = s => console.log(`\n■ ${s}`)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const svc = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: `Bearer ${K}` } })).json()

const me = LOGGED ? (await svc(`users?select=id,phone,"primaryRole"&phone=eq.${PHONE}`))[0] : null
if (LOGGED && !me) { console.log('  ✗ کاربر پیدا نشد'); process.exit(1) }
const admins = await svc('users?select=id,phone&primaryRole=eq.admin')
const tours = await svc('tournaments?select=id,title,status,club_id&limit=50')
const clubs = await svc('clubs?select=id,name&limit=5')

console.log(`\n  کاربرِ آزمایش: ${LOGGED ? `${me.phone} · نقش: ${me.primaryRole}` : '— اعتبارنامه نیست؛ فقط بخشِ بدونِ ورود'}`)
console.log(`  ادمین‌های سامانه: ${admins.length} · مسابقات: ${tours.length} · باشگاه‌ها: ${clubs.length}`)
if (LOGGED) t('حسابِ آزمایشی عمداً ادمین نیست', me.primaryRole !== 'admin', me.primaryRole)
t('سامانه دست‌کم یک ادمین دارد', admins.length >= 1, String(admins.length))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

const call = (path, init) => page.evaluate(async (p, i) => {
  const r = await fetch(p, { ...(i ?? {}), credentials: 'include' })
  let body = null; try { body = await r.json() } catch { /* بدنه‌ی غیرJSON */ }
  return { status: r.status, body }
}, path, init ?? null)

const J = obj => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) })

/* ── ۱) بدونِ ورود ── */
head('بدونِ ورود')
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await sleep(1500)

for (const [name, path, init] of [
  ['خواندنِ مسابقات', '/api/admin/tournaments', null],
  ['ساختِ مسابقه', '/api/admin/tournaments', J({ clubId: clubs[0]?.id, title: 'zz' })],
  ['حذفِ مسابقه', `/api/admin/tournaments?id=${tours[0]?.id ?? 'x'}`, { method: 'DELETE' }],
  ['فهرستِ ادمین‌ها', '/api/admin/grant-admin', null],
  ['اعطای دسترسیِ ادمین', '/api/admin/grant-admin', J({ userId: admins[0]?.id ?? 'x', grant: true })],
]) {
  const r = await call(path, init)
  t(`${name} بسته است`, r.status === 401 || r.status === 403, `HTTP ${r.status}`)
}

/* ── ۲) با ورودِ کاربرِ غیرادمین ── */
if (LOGGED) {
head('واردشده، ولی ادمین نیست')
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await sleep(2500)
await page.evaluate((ph, pw) => {
  const ins = [...document.querySelectorAll('input')]
  const phone = ins.find(i => i.type === 'tel' || /09|موبایل|شماره/.test(i.placeholder ?? ''))
  const pass = ins.find(i => i.type === 'password')
  const set = (el, v) => {
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  if (phone) set(phone, ph)
  if (pass) set(pass, pw)
}, PHONE, PASS)
await sleep(400)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /ورود|تأیید|تایید/.test(x.textContent ?? ''))
  b?.click()
})
await sleep(4000)

const who = await call('/api/auth/me')
t('ورود انجام شد', who.status === 200, `HTTP ${who.status}`)

for (const [name, path, init] of [
  ['خواندنِ مسابقات', '/api/admin/tournaments', null],
  ['ساختِ مسابقه', '/api/admin/tournaments', J({ clubId: clubs[0]?.id, title: 'zz-باید-رد-شود' })],
  ['حذفِ مسابقه', `/api/admin/tournaments?id=${tours[0]?.id ?? 'x'}`, { method: 'DELETE' }],
  ['تغییرِ وضعیتِ مسابقه', '/api/admin/tournaments',
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tours[0]?.id, status: 'cancelled' }) }],
  ['فهرستِ ادمین‌ها', '/api/admin/grant-admin', null],
  ['ادمین‌کردنِ خود', '/api/admin/grant-admin', J({ userId: me.id, grant: true })],
  ['ادمین‌زدایی از ادمینِ واقعی', '/api/admin/grant-admin', J({ userId: admins[0]?.id, grant: false })],
]) {
  const r = await call(path, init)
  t(`${name} برای غیرادمین بسته است`, r.status === 403, `HTTP ${r.status}`)
}

} else {
  console.log('\n  ⏭  بخشِ «واردشده ولی غیرادمین» رد شد — BH_TEST_PHONE/BH_TEST_PASS تنظیم نشده.')
}

/* ── ۳) هیچ‌چیز عوض نشده باشد ── */
head('ناوردایی — دیتابیس دست‌نخورده')
const admins2 = await svc('users?select=id,phone&primaryRole=eq.admin')
const tours2 = await svc('tournaments?select=id,status')
t('شمارِ ادمین‌ها عوض نشد', admins2.length === admins.length, `${admins.length} → ${admins2.length}`)
t('شمارِ مسابقات عوض نشد', tours2.length === tours.length, `${tours.length} → ${tours2.length}`)
t('وضعیتِ مسابقه‌ها عوض نشد',
  tours.every(o => tours2.find(n => n.id === o.id)?.status === o.status), 'وضعیتی تغییر کرد')
if (LOGGED) {
  const meNow = (await svc(`users?select=id,"primaryRole"&phone=eq.${PHONE}`))[0]
  t('نقشِ کاربرِ آزمایشی عوض نشد', meNow.primaryRole === me.primaryRole,
    `${me.primaryRole} → ${meNow.primaryRole}`)
}

/* ── ۴) صفحه‌های پنل برای غیرادمین باز نمی‌شوند ── */
head('صفحه‌های پنل')
for (const p of ['/admin/tournaments', '/admin/access']) {
  await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await sleep(2500)
  const txt = await page.evaluate(() => document.body.innerText)
  const denied = /دسترسی مجاز نیست|دسترسی ندارید|ورود/.test(txt)
  t(`${p} برای غیرادمین داده لو نمی‌دهد`, denied, txt.slice(0, 90).replace(/\s+/g, ' '))
}

await browser.close()
console.log(`\n${'─'.repeat(46)}\n  موفق: ${pass}   ناموفق: ${fail}\n`)
console.log('  ⓘ مسیرِ مثبت (ادمینِ واقعی مسابقه بسازد/حذف کند و دسترسی بدهد)')
console.log('    این‌جا آزموده نشد: حسابِ ادمین در اختیارِ این تست نیست و')
console.log('    این تست نقشِ هیچ کاربری را در دیتابیسِ واقعی عوض نمی‌کند.\n')
process.exit(fail ? 1 : 0)
