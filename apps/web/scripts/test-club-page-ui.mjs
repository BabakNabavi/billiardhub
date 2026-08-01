/* راستی‌آزماییِ صفحه‌ی عمومیِ باشگاه در مرورگرِ واقعی.
       node scripts/test-club-page-ui.mjs

   چهار چیزی که این‌جا سنجیده می‌شود فقط با خواندنِ کد قابل اثبات نبودند:
   ترتیبِ کارت‌ها، سرریزِ افقی در موبایل، چیدمانِ دوستونیِ آمارِ میزها،
   و نشانِ پیش‌فرضِ باشگاه وقتی لوگویی آپلود نشده. */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BH_BASE ?? 'http://127.0.0.1:3010'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)
const sleep = ms => new Promise(r => setTimeout(r, ms))

/* یک باشگاهِ تأییدشده از خودِ فهرست بردار — idهای ثابت با هر بار
   ریست‌شدنِ داده‌ی نمونه می‌شکنند. */
const list = await fetch(`${BASE}/api/clubs`).then(r => r.json()).catch(() => null)
const clubs = Array.isArray(list) ? list : (list?.data ?? [])
if (!clubs.length) {
  console.log('\n  ⏭  هیچ باشگاهی برنگشت — رد شد.\n')
  process.exit(0)
}
const club = clubs[0]

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()

const open = async (w, h) => {
  await page.setViewport({ width: w, height: h })
  await page.goto(`${BASE}/clubs/${club.id}`, { waitUntil: 'networkidle2' })
  await sleep(900)
}

/* ── ۱) ترتیب: امتیاز و نظرها پس از موقعیت مکانی ── */
head('ترتیبِ کارت‌ها')
await open(1280, 1000)

const order = await page.evaluate(() => {
  const yOf = txt => {
    const el = [...document.querySelectorAll('h2, h3, div')]
      .find(e => e.children.length <= 2 && (e.textContent ?? '').trim().startsWith(txt))
    return el ? el.getBoundingClientRect().top + window.scrollY : null
  }
  return { map: yOf('موقعیت مکانی'), reviews: yOf('امتیاز و نظر') }
})
t('«موقعیت مکانی» پیدا شد', order.map != null, String(order.map))
t('«امتیاز و نظرها» پیدا شد', order.reviews != null, String(order.reviews))
t('نظرها پایین‌تر از موقعیت مکانی است',
  order.map != null && order.reviews != null && order.reviews > order.map,
  `map=${Math.round(order.map)} reviews=${Math.round(order.reviews)}`)

/* ── ۲) سرریزِ افقی در موبایل ── */
head('سرریزِ افقی — موبایل')
for (const w of [390, 360]) {
  await open(w, 780)

  const doc = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }))
  t(`${w}px — بدنه‌ی صفحه پهن‌تر از قاب نیست`,
    doc.scrollW <= doc.clientW + 1, `scrollW=${doc.scrollW} clientW=${doc.clientW}`)

  /* عنصرهایی که واقعاً از لبه بیرون زده‌اند.
     دو استثنا که سرریزِ واقعی نیستند:
     · position:fixed — نوارِ چسبیده به قابِ دید، نه به صفحه.
     · هرچه یکی از والدینش clip می‌کند — مثلِ عکسِ پس‌زمینه‌ی هیرو که
       عمداً کمی بزرگ‌تر از قاب است و والدش overflow:hidden دارد. */
  const bad = await page.evaluate(() => {
    const clipped = el => {
      for (let n = el.parentElement; n; n = n.parentElement) {
        const o = getComputedStyle(n).overflowX
        if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') return true
      }
      return false
    }
    const out = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0) continue
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        if (getComputedStyle(el).position === 'fixed') continue
        if (clipped(el)) continue
        out.push({ tag: el.tagName, cls: el.className?.toString().slice(0, 40), l: Math.round(r.left), r: Math.round(r.right) })
      }
    }
    return out.slice(0, 6)
  })
  t(`${w}px — هیچ عنصری از لبه بیرون نزده`, bad.length === 0, JSON.stringify(bad))

  /* گالری هم همان مشکل را داشت — تبِ گالری را باز کن */
  const opened = await page.evaluate(() => {
    const el = [...document.querySelectorAll('button, [role=tab]')].find(e => (e.innerText ?? '').includes('گالری'))
    if (!el) return false
    el.click(); return true
  })
  if (opened) {
    await sleep(700)
    const g = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }))
    t(`${w}px — تبِ گالری هم سرریز ندارد`, g.scrollW <= g.clientW + 1, `scrollW=${g.scrollW} clientW=${g.clientW}`)
  }
}

/* ── ۳) آمارِ میزها: دو ستون، مجموع تمام‌عرض ── */
head('آمارِ میزها در موبایل')
await open(390, 780)
const stats = await page.evaluate(() => {
  const grid = document.querySelector('.tbl-stats')
  if (!grid) return null
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length
  const total = grid.querySelector('.tbl-stats-total')
  const gw = grid.getBoundingClientRect().width
  return {
    cols,
    hasTotal: !!total,
    totalFull: total ? Math.abs(total.getBoundingClientRect().width - gw) <= 2 : false,
    totalLast: total ? total === grid.lastElementChild : false,
  }
})
if (!stats) {
  console.log('  ⏭  این باشگاه میزی ندارد — بخشِ آمار رد شد.')
} else {
  t('شبکه دو ستون است', stats.cols === 2, `cols=${stats.cols}`)
  t('«مجموع» وجود دارد', stats.hasTotal)
  t('«مجموع» تمام‌عرض است', stats.totalFull)
  t('«مجموع» آخرین آیتم است', stats.totalLast)
}

/* ── ۴) نشانِ پیش‌فرضِ باشگاه ── */
head('نشانِ پیش‌فرضِ باشگاه')
await open(1280, 1000)
const mark = await page.evaluate(() => {
  const el = document.querySelector('[role=img][aria-label]')
  const img = document.querySelector('span > img[alt]')
  return { hasSvgMark: !!el?.querySelector('svg'), hasUploaded: !!img }
})
t('یا لوگوی آپلودشده هست یا نشانِ SVG',
  mark.hasSvgMark || mark.hasUploaded, JSON.stringify(mark))
t('حرفِ تنهای نام دیگر جای لوگو نیست',
  await page.evaluate(() => {
    const box = document.querySelector('[role=img][aria-label]')
    if (!box) return true          /* لوگو آپلود شده */
    return box.textContent.trim() === ''
  }))

await browser.close()
console.log(`\n  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
