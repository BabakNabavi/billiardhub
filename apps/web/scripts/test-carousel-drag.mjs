/* رفتارِ سه نوارِ افقیِ صفحه‌ی اول — در مرورگرِ واقعی.
       node scripts/test-carousel-drag.mjs

   دو ادعا:
   ۱) چرخِ عمودیِ ماوس روی نوار، *صفحه* را اسکرول می‌کند نه کارت‌ها را.
      این فقط حذفِ شنونده نیست: کروم خودش روی عنصرِ `overflow-x` چرخِ
      عمودی را به حرکتِ افقی ترجمه می‌کند و باید خنثی شود.
   ۲) درگ کارت‌ها را می‌برد و پس از رهاکردن با اینرسی ادامه می‌دهد.

   ── دو دامِ سنجش که این‌جا رعایت شده ──
   · جهت: در RTL نوارِ روی موقعیتِ ۰ با کشیدن به یک سمت اصلاً تکان
     نمی‌خورد چون به دیوار خورده. جهتِ درگ از فضای خالیِ واقعیِ نوار
     انتخاب می‌شود، نه ثابت.
   · دو نوارِ «بازار» و «فروشندگان» حرکتِ خودکار دارند؛ پس اینرسی
     نسبت به همان جهتِ درگ سنجیده می‌شود، نه با عددِ خام. */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BH_BASE ?? 'http://localhost:3000'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${extra ? '  ← ' + extra : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const RAILS = [
  { sel: '.clubs-strip',  name: 'باشگاه‌های پیشنهادی' },
  { sel: '.mkt-split',    name: 'بیلیارد بازار' },
  { sel: '.sellers-desk', name: 'فروشندگان تجهیزات' },
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('pageerror', e => { fail++; console.log(`  ✗ خطای صفحه  ← ${e.message}`) })

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await sleep(5000)

const box = sel => page.evaluate(s => {
  const el = document.querySelector(s); if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height }
}, sel)
const pos = sel => page.evaluate(s => Math.abs(document.querySelector(s).scrollLeft), sel)

/* بدونِ انیمیشن جای می‌گیرد و بعد صبر می‌کند تا اسکرولِ صفحه ثابت شود */
const center = async sel => {
  await page.evaluate(s => {
    const r = document.querySelector(s).getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + r.top - (innerHeight - r.height) / 2, behavior: 'instant' })
  }, sel)
  let prev = -1
  for (let i = 0; i < 20; i++) {
    await sleep(60)
    const y = await page.evaluate(() => Math.round(window.scrollY))
    if (y === prev) return
    prev = y
  }
}
const room = sel => page.evaluate(s => {
  const e = document.querySelector(s); return e.scrollWidth - e.clientWidth
}, sel)

for (const rail of RAILS) {
  console.log(`\n── ${rail.name} ──`)
  const exists = await page.evaluate(s => !!document.querySelector(s), rail.sel)
  if (!exists) { t('نوار روی صفحه هست', false, rail.sel); continue }

  await center(rail.sel)

  /* نوارِ بی‌کارت چیزی برای کشیدن ندارد — این نبودِ داده است نه اشکالِ
     رفتار، پس رد می‌شود تا سنجش دروغِ سبز یا قرمز ندهد. */
  const kids = await page.evaluate(s => document.querySelector(s).children.length, rail.sel)
  const max = await room(rail.sel)
  if (kids === 0 || max <= 4) {
    console.log(`  ⏭  رد شد — نوار خالی است (${kids} کارت، ${Math.round(max)}px فضا)`)
    continue
  }
  t('نوار محتوای بیشتر از عرضِ صفحه دارد', max > 100, `${Math.round(max)}px فضا`)

  /* ── ۱) چرخِ عمودیِ ماوس ── */
  const b1 = await box(rail.sel)
  const railBefore = await pos(rail.sel)
  const winBefore = await page.evaluate(() => window.scrollY)
  await page.mouse.move(b1.x + b1.w / 2, b1.y + b1.h / 2)
  await page.mouse.wheel({ deltaY: 300 })
  await sleep(900)
  const railAfter = await pos(rail.sel)
  const winAfter = await page.evaluate(() => window.scrollY)

  /* نوارهای خودکار در همین ۹۰۰ms چند ده پیکسل خودشان می‌روند؛
     ربودنِ چرخ صدها پیکسل بود، پس آستانه‌ی ۸۰ تفکیک‌کننده است. */
  t('چرخ کارت‌ها را نمی‌رباید', Math.abs(railAfter - railBefore) < 80,
    `Δrail=${Math.round(railAfter - railBefore)}`)
  t('چرخ صفحه را اسکرول می‌کند', winAfter - winBefore > 100,
    `Δwindow=${Math.round(winAfter - winBefore)}`)

  /* ── ۲) درگ ── */
  await center(rail.sel)
  const b2 = await box(rail.sel)
  const p0 = await pos(rail.sel)

  /* به سمتی بکش که فضا دارد: نزدیکِ ۰ باید جلو برود، نزدیکِ max عقب */
  const forward = p0 < max / 2
  const y = b2.y + b2.h / 2
  const startX = forward ? b2.x + b2.w * 0.25 : b2.x + b2.w * 0.75
  const stepX = forward ? 45 : -45

  await page.mouse.move(startX, y)
  await page.mouse.down()
  for (let k = 1; k <= 10; k++) { await page.mouse.move(startX + k * stepX, y); await sleep(10) }
  const atRelease = await pos(rail.sel)
  await page.mouse.up()

  const dragDelta = atRelease - p0
  const dir = Math.sign(dragDelta) || 1
  t('درگ کارت‌ها را جابه‌جا می‌کند', Math.abs(dragDelta) > 100,
    `${Math.round(dragDelta)}px (${forward ? 'جلو' : 'عقب'})`)

  /* اینرسی: بلافاصله پس از رهاکردن، حرکت باید در همان جهت ادامه یابد */
  await sleep(400)
  const glided = (await pos(rail.sel)) - atRelease
  t('پس از رهاکردن با اینرسی ادامه می‌دهد', glided * dir > 25 || Math.abs(atRelease - (dir > 0 ? max : 0)) < 3,
    `${Math.round(glided * dir)}px در جهتِ درگ`)

  await sleep(900)
  const settled = await pos(rail.sel)
  t('از مرزِ نوار نمی‌گذرد', settled >= -1 && settled <= max + 1,
    `${Math.round(settled)} از ${Math.round(max)}`)

  t('درگ به ناوبریِ ناخواسته تبدیل نشد', new URL(page.url()).pathname === '/', page.url())
}

/* کلیکِ ساده باید هنوز کار کند */
const href = await page.evaluate(() => {
  const a = document.querySelector('.clubs-strip a[href]')
  return a ? a.getAttribute('href') : null
})
t('کارت‌ها هنوز لینکِ قابلِ کلیک دارند', !!href, href ?? 'لینکی نبود')

await browser.close()
console.log(`\n${'─'.repeat(44)}\n  موفق: ${pass}   ناموفق: ${fail}\n`)
process.exit(fail ? 1 : 0)
