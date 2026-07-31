/* تستِ رندرِ واقعیِ شیتِ «افزودن به صفحه‌ی اصلی» در مرورگرِ واقعی، با
   UA و ابعادِ دستگاه‌های iOS. سرورِ بیلدشده باید روی BASE بالا باشد.
       node scripts/test-a2hs-ui.mjs [BASE] */

import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] || 'http://localhost:3112'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

const DEVICES = [
  { name: 'iPhone SE',          w: 375, h: 667, ua: IOS_UA },
  { name: 'iPhone 14',          w: 390, h: 844, ua: IOS_UA },
  { name: 'iPhone 14 Plus',     w: 428, h: 926, ua: IOS_UA },
  { name: 'iPhone 15 Pro (DI)', w: 393, h: 852, ua: IOS_UA },
  { name: 'iPhone 15 Pro Max',  w: 430, h: 932, ua: IOS_UA },
  { name: 'iPhone باریک ۳۲۰',   w: 320, h: 568, ua: IOS_UA },
  { name: 'iPhone لنداسکیپ',    w: 844, h: 390, ua: IOS_UA },
  { name: 'iPad',               w: 820, h: 1180, ua: IPAD_UA },
  { name: 'iPad لنداسکیپ',      w: 1180, h: 820, ua: IPAD_UA },
]

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

/* رفتارِ گیت روی دستگاه‌های غیرِ iOS */
console.log('\n■ گیت — دستگاه‌های غیرِ iOS (نباید چیزی نشان دهد)')
for (const [label, ua, w, h] of [
  ['اندروید کروم', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36', 412, 915],
  ['دسکتاپ کروم', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', 1440, 900],
  ['کرومِ iOS',   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1', 390, 844],
]) {
  const p = await browser.newPage()
  await p.setUserAgent(ua)
  await p.setViewport({ width: w, height: h })
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 3200))          // بیش از تأخیرِ ۱۶۰۰ms
  t(label, (await p.$$('.bh-a2hs-sheet')).length === 0, 'شیت ظاهر شد!')
  await p.close()
}

/* چیدمانِ شیت روی دستگاه‌های iOS */
for (const d of DEVICES) {
  console.log(`\n■ ${d.name}  (${d.w}×${d.h})`)
  const p = await browser.newPage()
  await p.setUserAgent(d.ua)
  await p.setViewport({ width: d.w, height: d.h, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
  await p.evaluateOnNewDocument(() => { try { localStorage.clear() } catch {} })
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await p.waitForSelector('.bh-a2hs-sheet', { timeout: 15000 }).catch(() => {})

  const r = await p.evaluate(() => {
    const sheet = document.querySelector('.bh-a2hs-sheet')
    if (!sheet) return { found: false }
    const b = sheet.getBoundingClientRect()
    const btns = [...sheet.querySelectorAll('button')].map(n => {
      const q = n.getBoundingClientRect()
      return { label: n.getAttribute('aria-label') || n.textContent.trim(), w: Math.round(q.width), h: Math.round(q.height) }
    })
    return {
      found: true,
      docScrollW: document.documentElement.scrollWidth,
      docClientW: document.documentElement.clientWidth,
      bodyScrollW: document.body.scrollWidth,
      left: Math.round(b.left), right: Math.round(b.right),
      top: Math.round(b.top), bottom: Math.round(b.bottom),
      width: Math.round(b.width), height: Math.round(b.height),
      vw: window.innerWidth, vh: window.innerHeight,
      role: sheet.getAttribute('role'),
      ariaModal: sheet.getAttribute('aria-modal'),
      ariaLabel: !!sheet.getAttribute('aria-label'),
      focused: document.activeElement === sheet,
      btns,
      steps: sheet.querySelectorAll('.bh-a2hs-step').length,
      // z-index مؤثر
      z: getComputedStyle(sheet.parentElement).zIndex,
      sheetScrolls: sheet.scrollHeight > sheet.clientHeight + 1,
    }
  })

  if (!r.found) { t('شیت رندر شد', false, 'پیدا نشد'); await p.close(); continue }

  t('شیت رندر شد', true)
  t('بدونِ اسکرولِ افقی', r.docScrollW <= r.docClientW && r.bodyScrollW <= r.docClientW,
     `scrollW=${r.docScrollW} clientW=${r.docClientW} body=${r.bodyScrollW}`)
  t('داخلِ عرضِ صفحه', r.left >= 0 && r.right <= r.vw + 1, `left=${r.left} right=${r.right} vw=${r.vw}`)
  t('بالای شیت از کادر بیرون نزده', r.top >= -1, `top=${r.top}`)
  t('ارتفاع در viewport جا می‌شود', r.height <= r.vh, `h=${r.height} vh=${r.vh}${r.sheetScrolls ? ' (خودش اسکرول دارد)' : ''}`)
  t('هر ۳ مرحله نمایش داده شد', r.steps === 3, `steps=${r.steps}`)
  t('role=dialog + aria-modal + aria-label', r.role === 'dialog' && r.ariaModal === 'true' && r.ariaLabel)
  t('فوکوس روی دیالوگ', r.focused)
  t('z-index لایه = ۹۹۹۱', r.z === '9991', `z=${r.z}`)
  const small = r.btns.filter(b => b.h < 44 || b.w < 44)
  t('همه‌ی دکمه‌ها ≥ ۴۴px', small.length === 0, small.map(b => `${b.label}:${b.w}×${b.h}`).join(', '))
  await p.close()
}

/* چرخه‌ی رد کردن: «بعداً» ⇒ رفرش ⇒ نباید برگردد */
console.log('\n■ چرخه‌ی رد کردن روی مرورگرِ واقعی')
{
  const p = await browser.newPage()
  await p.setUserAgent(IOS_UA)
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  /* عمداً `evaluateOnNewDocument` نیست: آن روی *هر* بارگذاری اجرا می‌شود و
     رفرشِ همین تست را هم پاک می‌کرد — یعنی تست هرگز چیزی را نمی‌سنجید. */
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await p.evaluate(() => { try { localStorage.clear() } catch {} })
  await p.reload({ waitUntil: 'networkidle2' })
  await p.waitForSelector('.bh-a2hs-sheet', { timeout: 15000 })
  t('بارِ اول ظاهر شد', true)

  await p.evaluate(() => [...document.querySelectorAll('.bh-a2hs-ghost')][0].click())
  await new Promise(r => setTimeout(r, 300))
  t('بعد از «بعداً» بسته شد', (await p.$$('.bh-a2hs-sheet')).length === 0)

  const stored = await p.evaluate(() => localStorage.getItem('bh_a2hs_ios'))
  t('در localStorage ثبت شد', !!stored && JSON.parse(stored).s === 'later', String(stored))

  await p.reload({ waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 3200))
  t('بعد از رفرش دوباره ظاهر نشد', (await p.$$('.bh-a2hs-sheet')).length === 0)

  /* «متوجه شدم» ⇒ سکوتِ بلند */
  await p.evaluate(() => localStorage.removeItem('bh_a2hs_ios'))
  await p.reload({ waitUntil: 'networkidle2' })
  await p.waitForSelector('.bh-a2hs-sheet', { timeout: 15000 })
  await p.evaluate(() => document.querySelector('.bh-a2hs-primary').click())
  await new Promise(r => setTimeout(r, 300))
  const ok = await p.evaluate(() => JSON.parse(localStorage.getItem('bh_a2hs_ios') || '{}').s)
  t('«متوجه شدم» ثبت شد', ok === 'ok', String(ok))
  await p.close()
}

/* standalone ⇒ هرگز */
console.log('\n■ حالتِ نصب‌شده (standalone)')
for (const [label, script] of [
  ['navigator.standalone = true', () => Object.defineProperty(navigator, 'standalone', { get: () => true, configurable: true })],
  ['display-mode: standalone', () => {
    const mm = window.matchMedia.bind(window)
    window.matchMedia = q => (q.includes('display-mode: standalone') ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : mm(q))
  }],
]) {
  const p = await browser.newPage()
  await p.setUserAgent(IOS_UA)
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await p.evaluateOnNewDocument(script)
  await p.evaluateOnNewDocument(() => { try { localStorage.clear() } catch {} })
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 3200))
  t(label, (await p.$$('.bh-a2hs-sheet')).length === 0, 'شیت ظاهر شد!')
  await p.close()
}

/* مسیرهای حساس + کیبورد + خطاهای کنسول */
console.log('\n■ مسیرهای حساس و دسترس‌پذیری')
for (const route of ['/login', '/register']) {
  const p = await browser.newPage()
  await p.setUserAgent(IOS_UA)
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await p.evaluateOnNewDocument(() => { try { localStorage.clear() } catch {} })
  await p.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 3200))
  t(`در ${route} مزاحم نمی‌شود`, (await p.$$('.bh-a2hs-sheet')).length === 0)
  await p.close()
}
{
  const p = await browser.newPage()
  const errs = []
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  p.on('pageerror', e => errs.push(String(e)))
  await p.setUserAgent(IOS_UA)
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await p.evaluateOnNewDocument(() => { try { localStorage.clear() } catch {} })
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await p.waitForSelector('.bh-a2hs-sheet', { timeout: 15000 })

  await p.keyboard.press('Escape')
  await new Promise(r => setTimeout(r, 300))
  t('Escape می‌بندد', (await p.$$('.bh-a2hs-sheet')).length === 0)

  const hydration = errs.filter(e => /hydrat|did not match|Text content does not/i.test(e))
  t('بدونِ خطای hydration', hydration.length === 0, hydration.join(' | '))
  t('بدونِ خطای کنسولِ مربوط به این قابلیت',
     errs.filter(e => /a2hs|AddToHome/i.test(e)).length === 0, errs.join(' | '))
  if (errs.length) console.log('      (خطاهای نامرتبطِ صفحه: ' + errs.length + ')')
  await p.close()
}

await browser.close()
console.log(`\n${'─'.repeat(46)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
