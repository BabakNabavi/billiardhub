/* راستی‌آزماییِ صفحه‌ی داشبورد باشگاه در مرورگرِ واقعی.
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-club-dashboard-ui.mjs

   این صفحه پشتِ ورود است، پس بازرسیِ کد تنها چیزی بود که بدون حساب
   می‌شد سنجید — و بازرسیِ کد فقط ثابت می‌کند کد هست، نه اینکه کار
   می‌کند. این تست با یک نشستِ واقعی وارد می‌شود و آنچه را کاربر
   می‌بیند می‌خواند.

   رمز فقط از متغیرِ محیطی خوانده می‌شود و هیچ‌جا نوشته نمی‌شود. */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BH_BASE ?? 'http://127.0.0.1:3010'
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
const head = s => console.log(`\n■ ${s}`)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000 })

/** کلیک روی دکمه/تب بر اساس متنِ دقیق */
/* دکمه‌ها آیکون هم دارند، پس «برگِ متنیِ خالص» پیدا نمی‌شود؛
   innerText خودِ دکمه ملاک است. */
const clickText = async (text, tag = 'button, a, [role=tab]') => page.evaluate((text, tag) => {
  const el = [...document.querySelectorAll(tag)].find(e => (e.innerText ?? '').trim() === text)
  if (!el) return false
  el.click(); return true
}, text, tag)

/** مقدار و قفلِ یک فیلد از روی برچسبش */
const fieldByLabel = async label => page.evaluate(label => {
  const lb = [...document.querySelectorAll('label')].find(e => e.textContent.trim() === label)
  const inp = lb?.parentElement?.querySelector('input')
  if (!inp) return null
  const hint = [...(lb?.parentElement?.querySelectorAll('span') ?? [])]
    .map(s => s.textContent.trim()).filter(Boolean).pop() ?? ''
  return {
    value: inp.value,
    readOnly: inp.readOnly,
    disabled: inp.disabled,
    width: Math.round(inp.getBoundingClientRect().width),
    hint,
  }
}, label)

try {
  head('۱) ورود')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 120000 })
  /* فیلدها با نوعشان انتخاب می‌شوند، نه با ترتیب: اولین <input> صفحه
     سرچِ نوبار است و ورودی‌های ورود اصلاً داخل <form> نیستند. */
  await page.waitForSelector('input[type=tel]', { timeout: 30000 })
  await page.click('input[type=tel]')
  await page.type('input[type=tel]', PHONE, { delay: 12 })
  await page.click('input[type=password]')
  await page.type('input[type=password]', PASS, { delay: 12 })
  await sleep(300)
  await clickText('ورود به حساب')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 }).catch(() => {})
  await sleep(2500)
  t(`وارد شد (${new URL(page.url()).pathname})`, !page.url().includes('/login'), page.url())

  head('۲) اطلاعات باشگاه — نام مدیر')
  await page.goto(`${BASE}/dashboard/club`, { waitUntil: 'networkidle2', timeout: 120000 })
  await sleep(3500)
  /* تبِ پیش‌فرض «داشبورد» است، نه «اطلاعات» */
  await clickText('اطلاعات')
  await sleep(1500)
  const mgr = await fieldByLabel('نام مدیر')
  t('فیلد «نام مدیر» روی صفحه هست', !!mgr, 'پیدا نشد')
  if (mgr) {
    console.log(`     مقدار: «${mgr.value}»   قفل: ${mgr.readOnly}   راهنما: «${mgr.hint}»`)
    t('قفل است (readOnly)', mgr.readOnly)
    t('مقدار خالی نیست', mgr.value.trim().length > 0, mgr.value)
    t('راهنمای «قابل تغییر نیست» دیده می‌شود', mgr.hint.includes('قابل تغییر نیست'), mgr.hint)
    /* آزمونِ واقعی: تایپ کن و ببین عوض می‌شود یا نه */
    const after = await page.evaluate(() => {
      const lb = [...document.querySelectorAll('label')].find(e => e.textContent.trim() === 'نام مدیر')
      const inp = lb.parentElement.querySelector('input')
      const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
      d.set.call(inp, 'نامِ جعلی')
      inp.dispatchEvent(new Event('input', { bubbles: true }))
      return inp.value
    })
    await sleep(400)
    const now = (await fieldByLabel('نام مدیر')).value
    t('تایپ کردن مقدار را عوض نمی‌کند', now === mgr.value, `شد «${now}» (لحظه‌ای «${after}»)`)
  }

  head('۳) آمار باشگاه — شمرده‌شده و قفل')
  for (const label of ['اعضای فعال', 'مسابقات']) {
    const f = await fieldByLabel(label)
    t(`«${label}» پیدا شد`, !!f)
    if (f) {
      console.log(`     ${label}: «${f.value}»   قفل: ${f.readOnly}   راهنما: «${f.hint}»`)
      t(`«${label}» قفل است`, f.readOnly)
      t(`«${label}» ارقام فارسی دارد`, /[۰-۹]/.test(f.value) || f.value === '—', f.value)
      t(`«${label}» ارقام لاتین ندارد`, !/[0-9]/.test(f.value), f.value)
    }
  }
  const years = await fieldByLabel('سال‌ها سابقه')
  t('«سال‌ها سابقه» همچنان قابل ویرایش است', years && !years.readOnly, JSON.stringify(years))

  head('۴) میزها — ترتیب نمایش')
  await clickText('میزها')
  await sleep(2000)
  const order = await page.evaluate(() => [...document.querySelectorAll('*')]
    .filter(e => e.children.length === 0 && /^میز \S+ — /.test(e.textContent.trim()))
    .map(e => e.textContent.trim()))
  console.log(`     ${order.length ? order.join('  ⟵  ') : '(میزی نیست)'}`)
  if (order.length >= 2) {
    const rank = { 'اسنوکر': 0, 'پاکت بیلیارد': 1, 'هی‌بال': 2, 'VIP اسنوکر': 3, 'VIP پاکت': 4 }
    const rs = order.map(s => rank[s.split('—')[1]?.trim()] ?? 99)
    t('ترتیب: اسنوکر ← پاکت ← هی‌بال', rs.every((v, i) => i === 0 || rs[i - 1] <= v), JSON.stringify(order))
    t('عنوانِ میز به شکل «میز X — رشته» است', /^میز \S+ — /.test(order[0]), order[0])
    t('شماره‌ی میز فارسی است', /^میز [۰-۹]/.test(order[0]), order[0])
  } else {
    console.log('     ⏭  میزِ کافی برای سنجشِ ترتیب نیست.')
  }

  head('۵) فرم ویرایش میز — هزینه‌ی بازیکن اضافه')
  const opened = await clickText('ویرایش')
  await sleep(1600)
  t('پنل ویرایش باز شد', opened)
  const edit = await page.evaluate(() => {
    const txt = document.body.innerText
    const lab = l => [...document.querySelectorAll('div')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === l).length
    const byAria = a => {
      const i = document.querySelector(`input[aria-label="${a}"]`)
      return i ? { ok: true, align: getComputedStyle(i).textAlign, ph: i.placeholder } : { ok: false }
    }
    const num = document.querySelector('input[aria-label="شماره میز"]')
    const pct = [...document.querySelectorAll('div')].filter(
      e => e.children.length === 0 && e.textContent.trim() === '٪')
    return {
      hasSurchargeTitle: txt.includes('هزینه‌ی بازیکن اضافه'),
      freeUpTo: byAria('تا چند نفر رایگان'),
      perPerson: byAria('درصد به ازای هر نفر'),
      discountPct: byAria('درصد تخفیف'),
      numberWidth: num ? Math.round(num.getBoundingClientRect().width) : null,
      pctLabelAligns: pct.map(e => getComputedStyle(e).textAlign),
      discountLabels: lab('٪'),
    }
  })
  t('عنوان «هزینه‌ی بازیکن اضافه» در فرم ویرایش هست', edit.hasSurchargeTitle)
  t('فیلد «تا چند نفر رایگان» هست', edit.freeUpTo.ok)
  t('فیلد «درصد به ازای هر نفر» هست', edit.perPerson.ok)
  t('هر دو «پیش‌فرض باشگاه» را راهنما دارند',
    edit.freeUpTo.ph === 'پیش‌فرض باشگاه' && edit.perPerson.ph === 'پیش‌فرض باشگاه',
    `${edit.freeUpTo.ph} / ${edit.perPerson.ph}`)
  t('هر دو وسط‌چین‌اند',
    edit.freeUpTo.align === 'center' && edit.perPerson.align === 'center',
    `${edit.freeUpTo.align} / ${edit.perPerson.align}`)

  head('۶) درصد تخفیف و شماره‌ی میز')
  t('ورودی درصد تخفیف وجود دارد', edit.discountPct.ok)
  t('درصد تخفیف وسط‌چین است', edit.discountPct.align === 'center', edit.discountPct.align)
  t('برچسب ٪ وسط‌چین است', edit.pctLabelAligns.every(a => a === 'center'),
    JSON.stringify(edit.pctLabelAligns))
  console.log(`     عرضِ فیلد شماره میز: ${edit.numberWidth}px`)
  t('شماره‌ی میز باریک است (≤۱۰۰px)', edit.numberWidth !== null && edit.numberWidth <= 100,
    String(edit.numberWidth))

  head('۷) ارقام فارسی در فیلدهای عددی')
  const digits = await page.evaluate(() => {
    const out = {}
    for (const a of ['شماره میز', 'درصد تخفیف', 'تا چند نفر رایگان']) {
      const i = document.querySelector(`input[aria-label="${a}"]`)
      if (i) out[a] = i.value
    }
    return out
  })
  console.log(`     ${JSON.stringify(digits)}`)
  for (const [k, v] of Object.entries(digits)) {
    if (v) t(`«${k}» بدون ارقام لاتین`, !/[0-9]/.test(v), v)
  }
} finally {
  await browser.close()
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
