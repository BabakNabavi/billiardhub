/* فرمِ ساختِ مسابقه در مرورگرِ واقعی.
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-tournament-ui.mjs

   چیزی ثبت نمی‌شود؛ فقط رفتارِ فرم سنجیده می‌شود — تقویم، سال‌ها،
   ساعتِ مهلت، برچسبِ فرمت، فارسی‌شدنِ اعداد و خطای درون‌صفحه‌ای. */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BH_BASE ?? 'http://localhost:3000'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PHONE = process.env.BH_TEST_PHONE, PASS = process.env.BH_TEST_PASS
if (!PHONE || !PASS) { console.log('\n  ⏭  اعتبارنامه نیست — رد شد.\n'); process.exit(0) }

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1360, height: 1150 })

/* پنجره‌ی خودِ مرورگر نباید اصلاً باز شود */
let nativeDialogs = 0
page.on('dialog', async d => { nativeDialogs++; await d.dismiss() })

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' }); await sleep(1400)
await page.evaluate((ph, pw) => {
  const ins = [...document.querySelectorAll('input.au-inp')]
  const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
  set(ins.find(i => i.type === 'tel'), ph); set(ins.find(i => i.type === 'password'), pw)
}, PHONE, PASS)
await sleep(400)
await page.evaluate(() => [...document.querySelectorAll('button')].find(x => /ورود به حساب/.test(x.innerText))?.click())
await sleep(5000)

await page.goto(`${BASE}/dashboard/club`, { waitUntil: 'networkidle2' }); await sleep(3000)
await page.evaluate(() => [...document.querySelectorAll('button')].find(x => (x.innerText ?? '').trim().startsWith('مسابقات'))?.click())
await sleep(1500)

console.log('\n■ فهرستِ مسابقات')
t('مسابقه‌ی موجود دیده می‌شود', await page.evaluate(() => document.body.innerText.includes('جام قهرمانان')))
t('برچسبِ فرمت انگلیسی است',
  await page.evaluate(() => !/Best Of [۰-۹]/.test(document.body.innerText)))

/* رفتن به فرمِ ساخت */
await page.evaluate(() => [...document.querySelectorAll('button')].find(x => /ثبت مسابقه جدید/.test(x.innerText))?.click())
await sleep(1500)

console.log('\n■ تقویمِ تاریخ برگزاری')
const openPicker = async label => page.evaluate(l => {
  const lb = [...document.querySelectorAll('label')].find(e => e.textContent.trim() === l)
  const btn = lb?.parentElement?.querySelector('button')
  if (!btn) return false
  btn.click(); return true
}, label)

t('تقویم باز شد', await openPicker('تاریخ برگزاری'))
await sleep(800)

const cal = await page.evaluate(() => {
  /* دکمه‌های روز: متنِ عددیِ فارسی */
  const days = [...document.querySelectorAll('button')].filter(b => /^[۰-۹]{1,2}$/.test(b.innerText.trim()))
  /* سال و ماه انتخابگرِ سفارشی‌اند نه <select> بومی — با
     aria-label پیدا می‌شوند. */
  const yearBox = document.querySelector('[aria-label="سال"], [aria-label*="سال"]')
  const years = yearBox
    ? [...yearBox.querySelectorAll('option, [role=option], li, button')].map(o => o.textContent?.trim()).filter(Boolean)
    : []
  return {
    dayCount: days.length,
    disabledDays: days.filter(b => b.disabled).length,
    enabledDays: days.filter(b => !b.disabled).length,
    yearOptions: [...new Set(years)],
    /* اگر انتخابگر باز نشده، دستِ‌کم متنِ سالِ نمایش‌داده‌شده */
    yearShown: yearBox?.textContent?.trim() ?? null,
  }
})
t('روزها رندر شدند', cal.dayCount > 20, `${cal.dayCount}`)
/* ماهِ جاری: روزهای پیش از امروز باید بسته باشند */
t('روزهای گذشته خاموش‌اند', cal.disabledDays > 0, `${cal.disabledDays} بسته`)
t('روزهای آینده باز مانده‌اند', cal.enabledDays > 0, `${cal.enabledDays} باز`)

/* انتخابگرِ سال یک listboxِ سفارشی است و باید باز شود */
await page.evaluate(() => document.querySelector('[aria-label="سال"]')?.click())
await sleep(600)
const years = await page.evaluate(() =>
  [...document.querySelectorAll('[role=option]')].map(o => o.textContent?.trim()).filter(t => /^[۰-۹]{4}$/.test(t ?? '')))
t('فقط دو سال در فهرست است', years.length === 2, JSON.stringify(years))

await page.keyboard.press('Escape'); await sleep(400)
await page.keyboard.press('Escape'); await sleep(500)

console.log('\n■ مهلتِ ثبت‌نام')
const fields = await page.evaluate(() => [...document.querySelectorAll('label')].map(l => l.textContent.trim()))
t('تاریخِ مهلت هست', fields.includes('مهلت ثبت‌نام'))
t('ساعتِ پایانِ ثبت‌نام هم اضافه شد', fields.includes('ساعت پایان ثبت‌نام'))

console.log('\n■ فرمتِ مسابقه')
/* `SelectField` هم listboxِ سفارشی است، پس اول باز می‌شود */
await page.evaluate(() => document.querySelector('[aria-label="فرمت مسابقه"]')?.click())
await sleep(600)
const formats = await page.evaluate(() =>
  [...document.querySelectorAll('[role=option]')].map(o => o.textContent?.trim()).filter(Boolean))
t('گزینه‌ها انگلیسی‌اند', formats.length > 0 && formats.every(f => /^Best of \d+$/.test(f)), JSON.stringify(formats))

console.log('\n■ اعدادِ فارسی در جوایز و قوانین')
const typeInto = async (label, text) => page.evaluate((l, txt) => {
  const lb = [...document.querySelectorAll('label')].find(e => e.textContent.trim() === l)
  const ta = lb?.parentElement?.querySelector('textarea')
  if (!ta) return null
  const d = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
  d.set.call(ta, txt); ta.dispatchEvent(new Event('input', { bubbles: true }))
  return true
}, label, text)

await typeInto('جوایز', 'نفر اول 10000000 تومان'); await sleep(400)
const prize = await page.evaluate(() => {
  const lb = [...document.querySelectorAll('label')].find(e => e.textContent.trim() === 'جوایز')
  return lb?.parentElement?.querySelector('textarea')?.value ?? ''
})
t('عدد فارسی شد', /[۰-۹]/.test(prize) && !/\d/.test(prize), prize)
t('جداکننده خورد', prize.includes('٬'), prize)

await typeInto('قوانین', 'قانون 1 و 2'); await sleep(400)
const rules = await page.evaluate(() => {
  const lb = [...document.querySelectorAll('label')].find(e => e.textContent.trim() === 'قوانین')
  return lb?.parentElement?.querySelector('textarea')?.value ?? ''
})
t('قوانین هم فارسی شد', /قانون ۱ و ۲/.test(rules), rules)

console.log('\n■ خطای درون‌صفحه‌ای')
/* بدونِ نام، ثبت باید خطای درون‌صفحه بدهد نه پنجره‌ی مرورگر */
/* دکمه‌ی ثبت حالا «ثبت و انتشار» است (کنارش «ذخیره‌ی پیش‌نویس») */
const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /^ثبت و انتشار$/.test(x.innerText.trim()))
  if (!b) return false
  b.click(); return true
})
t('دکمه‌ی ثبت پیدا شد', clicked)
await sleep(1200)
t('پنجره‌ی خودِ مرورگر باز نشد', nativeDialogs === 0, `${nativeDialogs} پنجره`)
t('خطا داخلِ صفحه دیده می‌شود',
  await page.evaluate(() => document.body.innerText.includes('نام مسابقه الزامی است')))

await browser.close()
console.log(`\n  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
