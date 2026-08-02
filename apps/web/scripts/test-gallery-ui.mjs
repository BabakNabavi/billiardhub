/* تبِ گالری در مرورگرِ واقعی، پس از انتقالش به کامپوننتِ خودش.
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-gallery-ui.mjs

   انتقالِ ۵۲۳ خط state و هندلر و JSX، اگر جایی بشکند، در typecheck و
   build دیده نمی‌شود — فقط وقتی تب باز شود. این تست همان را می‌آزماید:
   تب باز می‌شود، بخش‌هایش رندر می‌شوند، و هیچ خطای زمانِ اجرا نیست.
   چیزی آپلود یا حذف نمی‌شود؛ داده‌ی واقعی دست‌نخورده می‌ماند. */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BH_BASE ?? 'http://localhost:3000'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PHONE = process.env.BH_TEST_PHONE
const PASS = process.env.BH_TEST_PASS

if (!PHONE || !PASS) {
  console.log('\n  ⏭  BH_TEST_PHONE / BH_TEST_PASS تنظیم نشده — رد شد.\n')
  process.exit(0)
}

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1360, height: 1100 })

const errors = []
page.on('pageerror', e => errors.push(String(e).slice(0, 200)))
page.on('console', m => {
  if (m.type() === 'error' && !/webpack-hmr|WebSocket|favicon/.test(m.text())) errors.push(m.text().slice(0, 200))
})

/* ── ورود ── */
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' })
await sleep(1200)
await page.evaluate((ph, pw) => {
  /* `.au-inp` یعنی ورودی‌های خودِ فرم. با `input[0]` جعبه‌ی جستجوی
     هدر انتخاب می‌شد و شماره هرگز پر نمی‌شد. */
  const ins = [...document.querySelectorAll('input.au-inp')]
  const set = (el, v) => {
    const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const tel = ins.find(i => i.type === 'tel') ?? ins[0]
  const pwEl = ins.find(i => i.type === 'password')
  if (tel) set(tel, ph)
  if (pwEl) set(pwEl, pw)
}, PHONE, PASS)
await sleep(400)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /ورود به حساب/.test(x.innerText))
  b?.click()
})
await sleep(4500)

await page.goto(`${BASE}/dashboard/club`, { waitUntil: 'networkidle2' })
await sleep(3000)

const loggedIn = await page.evaluate(() => !document.body.innerText.includes('با شماره موبایل خود وارد شوید'))
t('ورود انجام شد', loggedIn, 'هنوز صفحه‌ی ورود است')
if (!loggedIn) { await browser.close(); process.exit(1) }

/* ── باز کردن تبِ گالری ──
   از این‌جا به بعد خطاها شمرده می‌شوند. مرحله‌ی ورود و بارگذاریِ
   داشبورد چند درخواستِ ۴۰۳ـی دارد که ربطی به گالری ندارند؛ نشمردنِ
   جداگانه‌شان یعنی این تست چیزی را گزارش کند که نمی‌سنجد. */
errors.length = 0
const opened = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => (x.innerText ?? '').trim().includes('گالری'))
  if (!b) return false
  b.click(); return true
})
t('تبِ گالری پیدا و باز شد', opened)
await sleep(2500)

const ui = await page.evaluate(() => {
  const txt = document.body.innerText
  return {
    logo: txt.includes('لوگو / آواتار باشگاه'),
    photos: /عکس‌های باشگاه|از ۱۰/.test(txt),
    albums: txt.includes('آلبوم'),
    background: txt.includes('پس‌زمینه‌ی صفحه‌ی عمومی'),
    fileInputs: document.querySelectorAll('input[type=file]').length,
    logoMark: !!document.querySelector('[role=img][aria-label], span > img[alt]'),
  }
})

t('بخشِ لوگو رندر شد', ui.logo)
t('بخشِ عکس‌های باشگاه رندر شد', ui.photos)
t('بخشِ آلبوم رندر شد', ui.albums)
t('توضیحِ پس‌زمینه هست', ui.background)
t('ورودی‌های آپلود هستند', ui.fileInputs >= 2, `${ui.fileInputs} ورودی`)
t('نشانِ لوگو رندر شد', ui.logoMark)

/* شمارنده‌ی «N از ۱۰» باید با عکس‌های واقعیِ سرور بخواند */
const counter = await page.evaluate(() => {
  const m = document.body.innerText.match(/([۰-۹0-9]+)\s*از\s*[۱1][۰0]/)
  return m ? m[1] : null
})
t('شمارنده‌ی عکس نمایش داده می‌شود', counter !== null, 'پیدا نشد')

t('باز کردنِ گالری هیچ خطایی نداد', errors.length === 0, errors.slice(0, 3).join(' | '))

await browser.close()
console.log(`\n  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
