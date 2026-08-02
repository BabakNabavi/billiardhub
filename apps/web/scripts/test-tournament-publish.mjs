/* چرخه‌ی انتشارِ مسابقه — پیش‌نویس ← منتشر ← بستنِ ثبت‌نام ← باز.
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-tournament-publish.mjs

   مسابقه‌ی آزمایشی خودش ساخته و در پایان حذف می‌شود، پس داده‌ی واقعی
   دست نمی‌خورد. آنچه سنجیده می‌شود «دکمه هست» نیست — بلکه اینکه
   مسابقه واقعاً در فهرستِ عمومی ظاهر و ناپدید می‌شود. */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BH_BASE ?? 'http://localhost:3000'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const CLUB = process.env.BH_CLUB_ID ?? '2c0f00e1-7b92-48c5-9474-0a7dcf6a1f64'
const PHONE = process.env.BH_TEST_PHONE, PASS = process.env.BH_TEST_PASS
if (!PHONE || !PASS) { console.log('\n  ⏭  اعتبارنامه نیست — رد شد.\n'); process.exit(0) }

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1360, height: 1100 })

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' }); await sleep(1400)
await page.evaluate((ph, pw) => {
  const ins = [...document.querySelectorAll('input.au-inp')]
  const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
  set(ins.find(i => i.type === 'tel'), ph); set(ins.find(i => i.type === 'password'), pw)
}, PHONE, PASS)
await sleep(400)
await page.evaluate(() => [...document.querySelectorAll('button')].find(x => /ورود به حساب/.test(x.innerText))?.click())
await sleep(6000)

/* ورود باید ثابت شود، وگرنه همه‌ی سنجش‌های بعدی «۴۰۱» می‌گیرند و
   خطا به گردنِ منطقِ انتشار می‌افتد در حالی که ربطی ندارد. */
const me = await page.evaluate(async () => (await fetch('/api/users/profile', { cache: 'no-store' })).status)
if (me !== 200) {
  console.log(`\n  ✗ ورود انجام نشد (profile → ${me}) — ادامه بی‌معنی است\n`)
  await browser.close(); process.exit(1)
}

/** فراخوانِ API با توکنِ CSRF، مثلِ خودِ برنامه */
const call = (path, method, body) => page.evaluate(async (p, m, bd) => {
  const tok = document.cookie.match(/(?:^|; )bh_csrf=([^;]*)/)?.[1]
  const r = await fetch(p, {
    method: m,
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': tok ? decodeURIComponent(tok) : '' },
    ...(bd ? { body: JSON.stringify(bd) } : {}),
  })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, j }
}, path, method, body ?? null)

/** آیا در فهرستِ عمومی هست؟ */
const isPublic = async id => {
  const r = await page.evaluate(async () => (await fetch('/api/tournaments', { cache: 'no-store' })).json())
  return (r?.tournaments ?? []).some(x => x.id === id)
}

const TITLE = 'آزمایشِ چرخه‌ی انتشار'
console.log('\n■ ساخت به‌صورت پیش‌نویس')
const made = await call('/api/tournaments', 'POST', {
  clubId: CLUB, title: TITLE, discipline: 'snooker', maxPlayers: 8, entryFee: 0,
  startsAt: '2026-12-01T14:00:00+03:30', matchFormat: 'bo5', status: 'draft',
})
t('ساخته شد', made.status === 201, JSON.stringify(made.j).slice(0, 120))
const id = made.j?.tournament?.id
if (!id) { await browser.close(); console.log('\n  ✗ بدونِ شناسه ادامه ممکن نیست\n'); process.exit(1) }
t('وضعیتش draft است', made.j.tournament.status === 'draft', made.j.tournament.status)
t('در فهرستِ عمومی دیده نمی‌شود', !(await isPublic(id)))

console.log('\n■ انتشار')
const pub = await call(`/api/tournaments/${id}`, 'PATCH', { status: 'registration_open' })
t('پذیرفته شد', pub.status === 200, JSON.stringify(pub.j).slice(0, 120))
t('حالا در فهرستِ عمومی هست', await isPublic(id))

console.log('\n■ بستنِ ثبت‌نام')
const closed = await call(`/api/tournaments/${id}`, 'PATCH', { status: 'registration_closed' })
t('پذیرفته شد', closed.status === 200)
/* بسته‌شدنِ ثبت‌نام یعنی دیگر ثبت‌نام نمی‌گیرد، نه اینکه ناپدید شود */
t('همچنان عمومی دیده می‌شود', await isPublic(id))

console.log('\n■ باز کردنِ دوباره')
const reopen = await call(`/api/tournaments/${id}`, 'PATCH', { status: 'registration_open' })
t('پذیرفته شد', reopen.status === 200)

console.log('\n■ بازگشت به پیش‌نویس')
const back = await call(`/api/tournaments/${id}`, 'PATCH', { status: 'draft' })
t('پذیرفته شد (چون ثبت‌نامی ندارد)', back.status === 200, JSON.stringify(back.j).slice(0, 120))
t('دوباره از فهرستِ عمومی رفت', !(await isPublic(id)))

console.log('\n■ گذرِ نامعتبر')
const bad = await call(`/api/tournaments/${id}`, 'PATCH', { status: 'completed' })
t('گذرِ بی‌معنی رد می‌شود', bad.status === 409, `${bad.status}`)
t('پیامِ روشن دارد', /مجاز نیست/.test(String(bad.j?.message ?? '')), String(bad.j?.message))

console.log('\n■ پاک‌سازی')
const del = await call(`/api/tournaments/${id}`, 'DELETE')
t('مسابقه‌ی آزمایشی حذف شد', del.status === 200, `${del.status}`)
t('دیگر در فهرست نیست', !(await isPublic(id)))

await browser.close()
console.log(`\n  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
