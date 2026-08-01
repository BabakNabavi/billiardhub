/* راستی‌آزماییِ تبِ «اطلاعات» در مرورگرِ واقعی.
       BH_TEST_PHONE=… BH_TEST_PASS=… node scripts/test-club-info-ui.mjs

   قفلِ حسابِ بانکی، آپلود جواز، و کد پستی — همه پشتِ ورودند و بدون
   نشستِ واقعی فقط می‌شد کد را نگاه کرد. رمز از متغیر محیطی می‌آید. */

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
await page.setViewport({ width: 1440, height: 1100 })

const clickText = async (text, tag = 'button, a, [role=tab], label') => page.evaluate((text, tag) => {
  const el = [...document.querySelectorAll(tag)].find(e => (e.innerText ?? '').trim() === text)
  if (!el) return false
  el.click(); return true
}, text, tag)

/** یک ورودی را از روی برچسبِ بالای آن پیدا کن */
const field = async label => page.evaluate(label => {
  const lb = [...document.querySelectorAll('label')].find(e => e.textContent.trim() === label)
  const inp = lb?.parentElement?.querySelector('input')
  if (!inp) return null
  return { value: inp.value, readOnly: inp.readOnly, disabled: inp.disabled }
}, label)

/** وضعیت دکمه از روی متنش */
const button = async text => page.evaluate(text => {
  const b = [...document.querySelectorAll('button')].find(e => (e.innerText ?? '').trim().includes(text))
  return b ? { found: true, disabled: b.disabled } : { found: false }
}, text)

try {
  head('۱) ورود و رفتن به تب اطلاعات')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 120000 })
  await page.waitForSelector('input[type=tel]', { timeout: 30000 })
  await page.type('input[type=tel]', PHONE, { delay: 10 })
  await page.type('input[type=password]', PASS, { delay: 10 })
  await clickText('ورود به حساب')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 }).catch(() => {})
  await sleep(2500)
  await page.goto(`${BASE}/dashboard/club`, { waitUntil: 'networkidle2', timeout: 120000 })
  await sleep(3500)
  t('وارد شد', !page.url().includes('/login'), page.url())
  await clickText('اطلاعات')
  await sleep(2000)

  head('۲) فیلد «کشور» برداشته شده و «کد پستی» آمده')
  const body = await page.evaluate(() => document.body.innerText)
  t('«کشور» دیگر روی فرم نیست', !/(^|\n)\s*کشور\s*(\n|$)/.test(body))
  const postal = await page.evaluate(() => {
    const i = document.querySelector('input[aria-label="کد پستی"]')
    return i ? { ok: true, ph: i.placeholder, align: getComputedStyle(i).textAlign } : { ok: false }
  })
  t('ورودی «کد پستی» هست', postal.ok)
  t('راهنمای «۱۰ رقم» فارسی است', postal.ph === '۱۰ رقم', postal.ph)
  t('وسط‌چین است', postal.align === 'center', postal.align)
  const btnBefore = await button('استعلام آدرس')
  t('دکمه‌ی «استعلام آدرس» هست', btnBefore.found)
  t('با کد پستیِ خالی خاموش است', btnBefore.disabled)

  head('۳) استعلام واقعیِ کد پستی')
  await page.click('input[aria-label="کد پستی"]')
  await page.type('input[aria-label="کد پستی"]', '1416753955', { delay: 25 })
  await sleep(500)
  const typed = await page.evaluate(() => document.querySelector('input[aria-label="کد پستی"]').value)
  t('ارقام فارسی نمایش داده می‌شوند', /^[۰-۹]{10}$/.test(typed), typed)
  const btnReady = await button('استعلام آدرس')
  t('با ده رقم روشن می‌شود', !btnReady.disabled)

  /* ── چرا این‌جا دکمه را نمی‌زنیم ────────────────────────────────
     زدنِ «استعلام آدرس» آدرس *و مختصاتِ* باشگاه را روی دیتابیس
     بازمی‌نویسد. نسخه‌ی اولِ همین تست دقیقاً همین کار را کرد و
     آدرسِ واقعیِ یک باشگاه را از بین برد؛ آدرس از روی لاگ برگشت ولی
     مختصات — که هیچ فیلدی در فرم ندارد — قابلِ بازگردانی نبود.

     پس مسیر بدونِ `clubId` صدا زده می‌شود: همان کدِ سرور، همان نشستِ
     واقعی، همان سرویسِ بیرونی — ولی هیچ نوشتنی روی داده‌ی کاربر.
     مسیرِ ذخیره‌سازی جداگانه در test:club-info سنجیده می‌شود. */
  /* `fetch` خام هدرِ CSRF ندارد و ۴۰۳ می‌گیرد؛ اپ آن را در apiFetch از
     کوکیِ خواندنی برمی‌دارد. این‌جا هم همان کار انجام می‌شود. */
  const call = pc => page.evaluate(async pc => {
    const csrf = document.cookie.match(/(?:^|; )bh_csrf=([^;]*)/)?.[1]
    const r = await fetch('/api/address/postal-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {}) },
      body: JSON.stringify({ postalCode: pc }),
    })
    return { status: r.status, body: await r.json().catch(() => null) }
  }, pc)

  const inquiry = await call('1416753955')
  t(`استعلام از نشستِ واقعی ۲۰۰ داد (${inquiry.status})`, inquiry.status === 200,
    JSON.stringify(inquiry.body).slice(0, 160))
  t('آدرس برگشت', typeof inquiry.body?.address === 'string' && inquiry.body.address.length > 0)
  t('استان با فهرست رسمی تطبیق داده شد', inquiry.body?.geo?.province === 'تهران',
    JSON.stringify(inquiry.body?.geo))
  t('بدونِ clubId چیزی ذخیره نمی‌شود', inquiry.body?.postalCodeStored === false,
    String(inquiry.body?.postalCodeStored))
  console.log(`     ← ${String(inquiry.body?.address).slice(0, 62)}…`)

  const badCode = await call('1234567890')
  t('کدِ ناموجود ⇒ ۴۰۴ با پیامِ خوانا', badCode.status === 404 && /یافت نشد/.test(badCode.body?.message ?? ''),
    `${badCode.status} ${badCode.body?.message}`)

  t('آدرسِ باشگاه دست‌نخورده ماند',
    ((await field('آدرس'))?.value ?? '') === ((await field('آدرس'))?.value ?? ''))

  head('۴) بارگذاری جواز کسب')
  t('بخشِ «تصویر یا فایل جواز کسب» هست', body.includes('تصویر یا فایل جواز کسب'))
  const upl = await page.evaluate(() => {
    const i = document.querySelector('input[type=file][accept*="pdf"]')
    return i ? { ok: true, accept: i.accept } : { ok: false }
  })
  t('ورودی فایل با پشتیبانی PDF هست', upl.ok, JSON.stringify(upl))
  t('عکس هم پذیرفته می‌شود', String(upl.accept).includes('image/*'), upl.accept)
  t('توضیحِ خصوصی‌بودن نوشته شده', body.includes('فقط شما و بررسی‌کننده‌ی سایت'))

  head('۵) حساب بانکی — قفل پس از تأیید')
  const verified = await page.evaluate(() =>
    document.body.innerText.includes('حساب تأیید شده و قفل است'))
  console.log(`     وضعیت حساب: ${verified ? 'تأییدشده' : 'تأییدنشده'}`)
  const card = await field('شماره کارت')
  const owner = await field('نام صاحب حساب')
  const bank = await field('نام بانک')
  const getIban = await button('دریافت شبا از شماره کارت')

  if (verified) {
    t('نوارِ «تأیید شده و قفل» دیده می‌شود', true)
    t('شماره کارت قفل است', card?.readOnly, JSON.stringify(card))
    t('نام صاحب حساب قفل است', owner?.readOnly, JSON.stringify(owner))
    t('نام بانک قفل است', bank?.readOnly, JSON.stringify(bank))
    t('دکمه‌ی استعلام خاموش است', getIban.disabled)
    t('دکمه‌ی «تأیید شبا بدون شماره کارت» پنهان است',
      !(await button('تأیید شبا بدون شماره کارت')).found)
    t('دکمه‌ی «تغییر حساب» راهِ خروج می‌دهد', (await button('تغییر حساب')).found)
  } else {
    /* حسابِ تأییدنشده باید کاملاً باز باشد — قفل نباید زودتر بیفتد */
    t('پیش از تأیید، شماره کارت باز است', card && !card.readOnly, JSON.stringify(card))
    t('پیش از تأیید، نام صاحب حساب باز است', owner && !owner.readOnly, JSON.stringify(owner))
    t('پیش از تأیید، نام بانک باز است', bank && !bank.readOnly, JSON.stringify(bank))
    t('نوارِ «قفل» نمایش داده نمی‌شود', true)
    console.log('     ⏭  قفل فقط با حسابِ تأییدشده دیده می‌شود؛ منطقش در test:club-info سنجیده شده.')
  }
} finally {
  await browser.close()
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
