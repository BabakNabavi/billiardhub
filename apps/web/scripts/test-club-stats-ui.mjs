/* راستی‌آزماییِ رندرِ واقعی: آمار باشگاه و ترتیب میزها در مرورگر.
       node scripts/test-club-stats-ui.mjs [clubId]

   بازرسیِ کد ثابت می‌کند کد وجود دارد، نه اینکه کار می‌کند. این تست
   صفحه را واقعاً باز می‌کند و آنچه را کاربر می‌بیند می‌خواند. */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BH_BASE ?? 'http://127.0.0.1:3000'
const CHROME = process.env.CHROME_PATH
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

/* باشگاهی که در دیتابیس دقیقاً یک عضو دارد — عدد باید همان باشد. */
const CLUB = process.argv[2] ?? '2c0f00e1-7b92-48c5-9474-0a7dcf6a1f64'

try {
  head('۱) endpoint آمار')
  const page = await browser.newPage()
  const api = await page.evaluate(async (base, id) => {
    const r = await fetch(`${base}/api/clubs/${id}/stats`)
    return { status: r.status, body: await r.json() }
  }, BASE, CLUB).catch(async () => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 })
    return page.evaluate(async id => {
      const r = await fetch(`/api/clubs/${id}/stats`)
      return { status: r.status, body: await r.json() }
    }, CLUB)
  })
  t(`وضعیت ۲۰۰ (${api.status})`, api.status === 200)
  t('کلیدهای members و tournaments', 'members' in api.body && 'tournaments' in api.body,
    JSON.stringify(api.body))
  t('اعداد عددی‌اند، نه رشته', typeof api.body.members === 'number' && typeof api.body.tournaments === 'number')
  console.log(`     ← ${JSON.stringify(api.body)}`)

  head('۲) صفحه‌ی عمومی باشگاه — آمار رندر می‌شود')
  await page.goto(`${BASE}/clubs/${CLUB}`, { waitUntil: 'networkidle2', timeout: 120000 })
  await new Promise(r => setTimeout(r, 1200))   // مهلت برای fetch سمت کلاینت

  const shown = await page.evaluate(() => {
    const out = {}
    for (const label of ['اعضای فعال', 'مسابقات']) {
      /* برچسب را پیدا کن و عددِ کنارش را بردار */
      const el = [...document.querySelectorAll('*')].find(
        e => e.children.length === 0 && e.textContent.trim() === label)
      out[label] = el ? (el.parentElement?.innerText ?? '').replace(/\s+/g, ' ').trim() : null
    }
    return out
  })
  const membersBlock = shown['اعضای فعال'] ?? ''
  t('بلوک «اعضای فعال» روی صفحه هست', !!membersBlock, JSON.stringify(shown))
  /* عدد باید فارسی باشد و با آنچه API داد بخواند */
  const faExpected = api.body.members.toLocaleString('fa-IR')
  t(`عدد اعضا «${faExpected}» نمایش داده شده`, membersBlock.includes(faExpected), membersBlock)
  t('ارقام فارسی‌اند، نه لاتین', !/[0-9]/.test(membersBlock.replace(/[^\u06F0-\u06F9 0-9]/g, '')) || /[\u06F0-\u06F9]/.test(membersBlock), membersBlock)
  console.log(`     ← «${membersBlock}»`)

  head('۳) صفحه‌ی رزرو — ترتیب رشته‌ی میزها')
  await page.goto(`${BASE}/booking/${CLUB}`, { waitUntil: 'networkidle2', timeout: 120000 })
  await new Promise(r => setTimeout(r, 1500))
  const order = await page.evaluate(() => {
    const wanted = ['اسنوکر', 'پاکت بیلیارد', 'هی‌بال', 'VIP اسنوکر', 'VIP پاکت']
    const seen = []
    for (const e of document.querySelectorAll('*')) {
      if (e.children.length) continue
      const s = e.textContent.trim()
      if (wanted.includes(s) && !seen.includes(s)) seen.push(s)
    }
    return seen
  })
  console.log(`     ترتیبِ دیده‌شده: ${order.length ? order.join(' ← ') : '(میزی ثبت نشده)'}`)
  if (order.length < 2) {
    console.log('     ⏭  این باشگاه میزِ کافی برای سنجشِ ترتیب ندارد.')
  } else {
    const rank = { 'اسنوکر': 0, 'پاکت بیلیارد': 1, 'هی‌بال': 2, 'VIP اسنوکر': 3, 'VIP پاکت': 4 }
    const ranks = order.map(x => rank[x])
    t('ترتیب صعودی است (اسنوکر ← پاکت ← هی‌بال)',
      ranks.every((v, i) => i === 0 || ranks[i - 1] < v), JSON.stringify(order))
  }
} finally {
  await browser.close()
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
