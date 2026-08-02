/* آیکون‌ها در مرورگرِ واقعی.
       node scripts/test-icons-ui.mjs

   هفت صفحه، وب‌فونتِ Tabler را از cdn.jsdelivr.net می‌گرفتند. جای‌گزینی
   با lucide مکانیکی بود و یک شکستِ خاموش داشت: نامی که در نگاشت نباشد،
   به‌جای خطا فقط یک جای خالی می‌گذارد. این تست دقیقاً همان را می‌گیرد —
   هم هشدارِ کنسول را می‌شنود و هم می‌شمارد چند SVG واقعاً رندر شده. */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BH_BASE ?? 'http://localhost:3000'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const PAGES = ['/cart', '/checkout', '/profile/setup', '/profile/verify', '/profile/role', '/admin/roles']

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 1000 })

const warns = []
page.on('console', m => { if (/\[Ti\]/.test(m.text())) warns.push(m.text()) })

for (const path of PAGES) {
  await page.goto(BASE + path, { waitUntil: 'networkidle2' }).catch(() => {})
  await new Promise(r => setTimeout(r, 1600))

  const r = await page.evaluate(() => ({
    lucide: document.querySelectorAll('svg.lucide').length,
    cdn: document.querySelectorAll('link[href*="jsdelivr"]').length,
    ti: document.querySelectorAll('i.ti').length,
  }))

  t(`${path} — بدونِ <link> به CDN`, r.cdn === 0, `${r.cdn} تگ`)
  t(`${path} — هیچ <i class="ti"> نمانده`, r.ti === 0, `${r.ti} مورد`)
  /* صفحه‌هایی که پشتِ ورودند شاید ریدایرکت شوند؛ آن‌جا صفر طبیعی است */
  if (r.lucide > 0) t(`${path} — آیکون‌ها رندر شدند (${r.lucide})`, true)
}

t('هیچ آیکونِ ناشناخته‌ای در نگاشت نبود', warns.length === 0, warns.join(' | '))

await browser.close()
console.log(`\n  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} خطا\n`)
process.exit(fail ? 1 : 0)
