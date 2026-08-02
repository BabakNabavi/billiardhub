/* سلسله‌مراتبِ بستنِ رزرو در مرورگرِ واقعی.
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-closure-ui.mjs

   تستِ واحد ثابت می‌کند تابع درست حساب می‌کند؛ این‌جا ثابت می‌شود که
   خودِ دکمه‌ها واقعاً خاموش و رنگی می‌شوند. هر حالت روی سرور ذخیره
   می‌شود، پس در پایان همه‌چیز به «باز» برگردانده می‌شود — وگرنه
   باشگاهِ واقعی بسته می‌ماند. */

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
await page.setViewport({ width: 1360, height: 1100 })

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
await page.evaluate(() => [...document.querySelectorAll('button')].find(x => (x.innerText ?? '').trim().startsWith('رزروها'))?.click())
await sleep(1800)

/** وضعیتِ دکمه‌های بستن + تیکِ امروز */
const state = () => page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].filter(b => /^بستن برای/.test((b.innerText ?? '').replace(/^●\s*/, '')))
  const cb = document.querySelector('input[type=checkbox]')
  return {
    buttons: btns.map(b => ({
      label: b.innerText.replace(/^●\s*/, '').replace('بستن برای ', '').trim(),
      disabled: b.disabled,
      /* «زده‌شده» با نقطه و رنگِ قرمز نشان داده می‌شود */
      active: b.innerText.trim().startsWith('●'),
    })),
    todayChecked: !!cb?.checked,
    todayDisabled: !!cb?.disabled,
    hasOpenBtn: [...document.querySelectorAll('button')].some(b => /باز کردن رزرو/.test(b.innerText)),
  }
})

const click = label => page.evaluate(l => {
  const b = [...document.querySelectorAll('button')].find(x => (x.innerText ?? '').replace(/^●\s*/, '').trim() === `بستن برای ${l}`)
  if (!b || b.disabled) return false
  b.click(); return true
}, label)

const openAgain = async () => {
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /باز کردن رزرو/.test(b.innerText))?.click())
  await sleep(1800)
  /* تیکِ امروز جدا ذخیره می‌شود و با «باز کردن» برداشته نمی‌شود */
  await page.evaluate(() => { const cb = document.querySelector('input[type=checkbox]'); if (cb?.checked && !cb.disabled) cb.click() })
  await sleep(1800)
}

const find = (s, l) => s.buttons.find(b => b.label === l) ?? {}

console.log('\n■ حالتِ اولیه')
await openAgain()
let s = await state()
t('چهار دکمه هست', s.buttons.length === 4, `${s.buttons.length}`)
t('هیچ‌کدام خاموش نیست', s.buttons.every(b => !b.disabled))
t('هیچ‌کدام فعال نیست', s.buttons.every(b => !b.active))
t('تیکِ امروز روشن و بی‌تیک', !s.todayDisabled && !s.todayChecked)

console.log('\n■ بستن برای ۶ ساعت ⇒ فقط ۳ خاموش')
await click('۶ ساعت'); await sleep(2000)
s = await state()
t('۶ ساعت فعال دیده می‌شود', find(s, '۶ ساعت').active)
t('۳ ساعت خاموش شد', find(s, '۳ ساعت').disabled)
t('۱۲ ساعت هنوز روشن', !find(s, '۱۲ ساعت').disabled)
t('«همیشه» هنوز روشن', !find(s, 'همیشه').disabled)
t('تیکِ امروز هنوز روشن', !s.todayDisabled)
t('دکمه‌ی باز کردن آمد', s.hasOpenBtn)

console.log('\n■ بستن برای ۱۲ ساعت ⇒ ۶ و ۳ خاموش')
await openAgain(); await click('۱۲ ساعت'); await sleep(2000)
s = await state()
t('۱۲ ساعت فعال دیده می‌شود', find(s, '۱۲ ساعت').active)
t('۶ ساعت خاموش شد', find(s, '۶ ساعت').disabled)
t('۳ ساعت خاموش شد', find(s, '۳ ساعت').disabled)
t('«همیشه» هنوز روشن', !find(s, 'همیشه').disabled)

console.log('\n■ تیکِ «بستن رزرو امروز» ⇒ هر سه ساعتی خاموش')
await openAgain()
await page.evaluate(() => { const cb = document.querySelector('input[type=checkbox]'); if (!cb.checked) cb.click() })
await sleep(2200)
s = await state()
t('تیک خورد', s.todayChecked)
t('۳ و ۶ و ۱۲ خاموش شدند',
  ['۳ ساعت', '۶ ساعت', '۱۲ ساعت'].every(l => find(s, l).disabled))
t('«همیشه» همچنان روشن است', !find(s, 'همیشه').disabled)

console.log('\n■ «همیشه» ⇒ همه‌چیز خاموش جز باز کردن')
await click('همیشه'); await sleep(2200)
s = await state()
t('«همیشه» فعال دیده می‌شود', find(s, 'همیشه').active)
t('هر چهار دکمه خاموش‌اند', s.buttons.every(b => b.disabled))
t('تیکِ امروز هم خاموش شد', s.todayDisabled)
t('فقط «باز کردن رزرو» مانده', s.hasOpenBtn)

console.log('\n■ صفحه‌ی باشگاه وقتی «همیشه» بسته است')
const clubId = await page.evaluate(() => location.pathname && window.__clubId)
  ?? '2c0f00e1-7b92-48c5-9474-0a7dcf6a1f64'
await page.goto(`${BASE}/clubs/${clubId}`, { waitUntil: 'networkidle2' }); await sleep(2500)
const pub = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].filter(x => /رزرو/.test(x.innerText))
  return {
    msg: document.body.innerText.includes('تا اطلاع بعدی بسته است'),
    disabled: b.length > 0 && b.every(x => x.disabled || !/رزرو آنلاین/.test(x.innerText)),
  }
})
t('پیامِ «تا اطلاع بعدی بسته است» دیده می‌شود', pub.msg)
t('دکمه‌ی رزرو خاموش است', pub.disabled)

/* ── برگرداندن به حالتِ باز ── */
console.log('\n■ بازگرداندن')
await page.goto(`${BASE}/dashboard/club`, { waitUntil: 'networkidle2' }); await sleep(3000)
await page.evaluate(() => [...document.querySelectorAll('button')].find(x => (x.innerText ?? '').trim().startsWith('رزروها'))?.click())
await sleep(1800)
await openAgain()
s = await state()
t('همه‌چیز به حالتِ باز برگشت',
  s.buttons.every(b => !b.disabled && !b.active) && !s.todayChecked && !s.todayDisabled,
  JSON.stringify(s))

await browser.close()
console.log(`\n  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
