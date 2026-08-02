/* سناریوهای ۱۷ و ۱۸ — دسترسی به داده‌ی مالی، در سطحِ HTTP.
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-finance-access.mjs

   RLS جلوی دسترسیِ مستقیم به جدول‌ها را می‌گیرد، ولی مسیرهای API با
   service-role کار می‌کنند — پس مجوز باید در خودِ endpoint بررسی شود.
   این تست همان را می‌سنجد: با یک نشستِ واقعی، نه با فرضِ اینکه کد
   درست نوشته شده.

   هیچ داده‌ای ساخته یا عوض نمی‌شود؛ فقط خواندن. */

import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BH_BASE ?? 'http://localhost:3000'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PHONE = process.env.BH_TEST_PHONE, PASS = process.env.BH_TEST_PASS
if (!PHONE || !PASS) { console.log('\n  ⏭  اعتبارنامه نیست — رد شد.\n'); process.exit(0) }

const env = Object.fromEntries(
  fs.readFileSync(join(here, '..', '.env.local'), 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`) }
const head = s => console.log(`\n■ ${s}`)
const sleep = ms => new Promise(r => setTimeout(r, ms))

/* باشگاه‌ها و مالکانشان را از دیتابیس بردار تا بدانیم «باشگاهِ دیگری»
   یعنی چه — بدونِ این، تست فقط حدس می‌زند. */
const svc = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: `Bearer ${K}` } })).json()
const me = (await svc(`users?select=id,phone,"primaryRole"&phone=eq.${PHONE}`))[0]
if (!me) { console.log('  ✗ کاربر پیدا نشد'); process.exit(1) }
const clubs = await svc('clubs?select=id,name,"ownerId"')
const mine = clubs.filter(c => c.ownerId === me.id)
const others = clubs.filter(c => c.ownerId !== me.id)

console.log(`\n  کاربر: ${me.phone} | نقش: ${me.primaryRole} | باشگاه‌های خودش: ${mine.length} | دیگران: ${others.length}`)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

/* ── بدونِ ورود ── */
head('بدونِ ورود')
const anon = async path => page.evaluate(async p => {
  const r = await fetch(p, { cache: 'no-store' })
  return { s: r.status }
}, path)
/* صفحه‌ی سبک، نه صفحه‌ی اصلی: در dev کامپایلِ اولِ صفحه‌ی اصلی از
   مهلتِ پیش‌فرضِ ۳۰ ثانیه رد می‌شود و تست را بی‌دلیل قرمز می‌کند. */
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
t('۱۸. داشبورد مالی ادمین برای مهمان بسته است', (await anon('/api/admin/finance')).s >= 400, `${(await anon('/api/admin/finance')).s}`)
t('    تراکنش‌ها برای مهمان بسته است', (await anon('/api/admin/finance/transactions')).s >= 400)
if (mine[0]) t('    مالیِ باشگاه برای مهمان بسته است', (await anon(`/api/clubs/${mine[0].id}/finance`)).s >= 400)

/* ── ورود ── */
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 120_000 }); await sleep(1400)
await page.evaluate((ph, pw) => {
  const ins = [...document.querySelectorAll('input.au-inp')]
  const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
  set(ins.find(i => i.type === 'tel'), ph); set(ins.find(i => i.type === 'password'), pw)
}, PHONE, PASS)
await sleep(400)
await page.evaluate(() => [...document.querySelectorAll('button')].find(x => /ورود به حساب/.test(x.innerText))?.click())
await sleep(5500)

const authed = async path => page.evaluate(async p => {
  const r = await fetch(p, { cache: 'no-store', credentials: 'include' })
  let body = null; try { body = await r.json() } catch {}
  return { s: r.status, keys: body && typeof body === 'object' ? Object.keys(body).slice(0, 6) : null }
}, path)

const prof = await authed('/api/users/profile')
if (prof.s !== 200) { console.log(`\n  ✗ ورود انجام نشد (${prof.s})\n`); await browser.close(); process.exit(1) }

head('۱۷) باشگاه A نباید مالیِ باشگاه B را ببیند')
if (mine[0]) {
  const own = await authed(`/api/clubs/${mine[0].id}/finance`)
  t('مالکِ باشگاه، مالیِ باشگاهِ خودش را می‌بیند', own.s === 200, `HTTP ${own.s}`)
} else { console.log('  ⏭  این کاربر باشگاهی ندارد') }

if (others[0]) {
  const foreign = await authed(`/api/clubs/${others[0].id}/finance`)
  const isAdminUser = me.primaryRole === 'admin'
  if (isAdminUser) {
    t('۱۷. (این کاربر ادمین است ⇒ دسترسی عمدی مجاز)', foreign.s === 200, `HTTP ${foreign.s}`)
  } else {
    t('۱۷. مالیِ باشگاهِ دیگری بسته است', foreign.s === 403,
      `HTTP ${foreign.s} — باید ۴۰۳ باشد`)
  }
} else { console.log('  ⏭  باشگاهِ دیگری وجود ندارد') }

head('۱۸) کاربرِ غیرادمین نباید مالیِ پلتفرم را ببیند')
const adminFin = await authed('/api/admin/finance')
const adminTx = await authed('/api/admin/finance/transactions')
if (me.primaryRole === 'admin') {
  t('ادمین به داشبورد مالی دسترسی دارد', adminFin.s === 200, `HTTP ${adminFin.s}`)
  t('ادمین به فهرست تراکنش‌ها دسترسی دارد', adminTx.s === 200, `HTTP ${adminTx.s}`)
  t('پاسخِ خلاصه شاملِ تفکیکِ درآمد است',
    (adminFin.keys ?? []).includes('overview'), JSON.stringify(adminFin.keys))
} else {
  t('۱۸. داشبورد مالی برای غیرادمین بسته است', adminFin.s === 403, `HTTP ${adminFin.s}`)
  t('    فهرست تراکنش‌ها برای غیرادمین بسته است', adminTx.s === 403, `HTTP ${adminTx.s}`)
}

head('دسترسیِ مستقیم به جدول‌های مالی (RLS)')
/* کلیدِ anon عمومی است و در مرورگر هم هست؛ باید هیچ ردیفی ندهد */
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (anonKey) {
  for (const tbl of ['ledger_entries', 'payments', 'settlements', 'club_accounts', 'refunds']) {
    const r = await fetch(`${U}/rest/v1/${tbl}?select=id&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } })
    const b = await r.json().catch(() => null)
    const blocked = r.status >= 400 || (Array.isArray(b) && b.length === 0)
    t(`${tbl} از کلیدِ عمومی خوانده نمی‌شود`, blocked, `HTTP ${r.status} ${JSON.stringify(b).slice(0, 80)}`)
  }
} else { console.log('  ⏭  کلیدِ anon در .env.local نیست') }

await browser.close()
console.log(`\n${'─'.repeat(52)}`)
console.log(`  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
