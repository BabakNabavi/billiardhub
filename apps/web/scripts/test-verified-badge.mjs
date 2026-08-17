/* تأییدِ واقعیِ جای تیک — هندسه، نه گرپِ کد.
 *
 * پرسش: «تیک کنارِ نام است یا روی عکس؟»
 *
 * سنجه‌ی قبلی از لبه‌ی **کادرِ عنصر** فاصله می‌گرفت؛ عنصرِ عنوان تمامِ
 * عرضِ کارت را می‌گیرد، پس تیکی که دقیقاً چسبیده به متن است ۶۵ پیکسل
 * دور به‌نظر می‌رسید. این نسخه با Range، کادرِ خودِ **متن** را می‌گیرد.
 *
 * ادعا: **هر** تیکی که در صفحه هست باید هم‌خط و چسبیده به متنِ نام
 * باشد. «روی عکس نبودن» به‌تنهایی سنجه‌ی خوبی نیست — هیروی صفحه‌ی
 * باشگاه یک تصویرِ تمام‌عرضِ پس‌زمینه دارد و عنوان رویش می‌نشیند، پس
 * تیکِ درست هم داخلِ کادرِ آن تصویر می‌افتد. آنچه ایراد داشت تیکِ
 * بی‌صاحب بود: پین‌شده به گوشه‌ی کارت و دور از هر نامی.
 *
 * ── این گارد سنجیده شده ──
 * روی کدِ قبلی (سایتِ زنده، پیش از این تغییر) هر شش مورد رد شد و
 * روی کدِ تازه هر شش قبول:
 *     BH_BASE=https://billiardhub.net npm run test:verified:ui
 *
 * پیش‌نیاز: سرورِ بیلدشده روی پورت ۳۰۰۰ و دستِ‌کم یک باشگاهِ تیک‌دار
 * (خودش از /api/clubs پیدایش می‌کند). مسیرِ کروم را با CHROME_PATH
 * می‌شود عوض کرد.
 */
import puppeteer from 'puppeteer-core'

/* مسیرِ کروم روی هر دستگاه فرق می‌کند */
const CHROME = process.env.CHROME_PATH
  || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BH_BASE || 'http://localhost:3000'

/* ── چرا هدف از API خوانده می‌شود ──
   نامِ باشگاه هاردکد بود؛ روزی که آن باشگاه نامش عوض شود یا تیکش
   برداشته شود، این گارد بی‌صدا سبز می‌ماند — چون هیچ نامی پیدا
   نمی‌کند تا دنبالِ تیکِ کنارش بگردد. حالا خودش یک باشگاهِ تیک‌دارِ
   واقعی برمی‌دارد، و اگر هیچ‌کدام نبود صریح می‌گوید نه سبز. */
const clubs = await fetch(BASE + '/api/clubs')
  .then(r => (r.ok ? r.json() : []))
  .catch(() => [])
const target = (Array.isArray(clubs) ? clubs : []).find(c => c?.isVerified)
if (!target) {
  console.log('⏭  هیچ باشگاهِ تیک‌داری نیست — این گارد چیزی برای سنجیدن ندارد.')
  process.exit(0)
}
const NAME = String(target.name ?? '').trim()
const SLUG = String(target.slug || target.id)
console.log(`هدف: «${NAME}»  (/clubs/${SLUG})\n`)

const PAGES = [
  { url: '/', label: 'صفحه‌ی اول — باشگاه‌های پیشنهادی', w: 1280 },
  { url: '/', label: 'صفحه‌ی اول', w: 390 },
  { url: '/clubs', label: 'فهرستِ باشگاه‌ها', w: 1280 },
  { url: '/clubs', label: 'فهرستِ باشگاه‌ها', w: 390 },
  { url: `/clubs/${SLUG}`, label: 'صفحه‌ی خودِ باشگاه', w: 1280 },
  { url: `/clubs/${SLUG}`, label: 'صفحه‌ی خودِ باشگاه', w: 390 },
]

function probe(name) {
  const BLUE = '#0095f6'
  const vis = r => r.width > 0 && r.height > 0

  const badges = [...document.querySelectorAll('svg')]
    .filter(el => el.getAttribute('viewBox') === '0 0 40 40'
      && [...el.querySelectorAll('path')].some(p => (p.getAttribute('fill') || '').toLowerCase() === BLUE))
    .map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(b => vis(b.r))

  /* کادرِ خودِ متن، نه کادرِ عنصر */
  const texts = []
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const i = (n.nodeValue || '').indexOf(name)
    if (i < 0) continue
    const rg = document.createRange()
    rg.setStart(n, i); rg.setEnd(n, i + name.length)
    const r = rg.getBoundingClientRect()
    if (vis(r)) texts.push(r)
  }

  /* یک تیک «کنارِ نام» است اگر هم‌خط و چسبیده باشد */
  const beside = badges.map(b => {
    let best = null
    for (const t of texts) {
      const dy = Math.abs((b.r.y + b.r.height / 2) - (t.y + t.height / 2))
      const dx = Math.min(Math.abs(b.r.right - t.x), Math.abs(t.right - b.r.x))
      if (!best || dx + dy < best.dx + best.dy) best = { dx, dy, th: t.height }
    }
    return best && best.dy <= best.th / 2 + 4 && best.dx <= 14 ? best : null
  })

  /* تیکی که مرکزش داخلِ یک تصویر باشد ⇒ هنوز «روی عکس» است */
  const imgs = [...document.querySelectorAll('img')].map(e => e.getBoundingClientRect()).filter(vis)
  const onImage = badges.filter(b => {
    const cx = b.r.x + b.r.width / 2, cy = b.r.y + b.r.height / 2
    return imgs.some(i => cx >= i.x && cx <= i.right && cy >= i.y && cy <= i.bottom)
  }).length

  return {
    badges: badges.length,
    texts: texts.length,
    beside: beside.filter(Boolean),
    onImage,
  }
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

let pass = 0, fail = 0
try {
for (const p of PAGES) {
  const page = await browser.newPage()
  await page.setViewport({ width: p.w, height: 900, deviceScaleFactor: 1 })
  await page.goto(BASE + p.url, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise(r => setTimeout(r, 2500))

  const res = await page.evaluate(probe, NAME)
  /* ادعا: هر تیکی که در صفحه هست باید چسبیده به نام باشد.
     «روی عکس نبودن» به‌تنهایی سنجه‌ی خوبی نیست — هیروی صفحه‌ی باشگاه
     یک تصویرِ تمام‌عرضِ پس‌زمینه دارد و عنوان رویش می‌نشیند، پس هر
     تیکِ درستی هم داخلِ کادرِ آن تصویر می‌افتد. آنچه اشکال داشت
     تیکِ **بی‌صاحب** بود: چسبیده به گوشه‌ی کارت و دور از هر نامی. */
  const ok = res.texts > 0 && res.badges > 0 && res.beside.length === res.badges

  ok ? pass++ : fail++
  console.log(`${ok ? '✓' : '✗'} ${p.label} — ${p.w}px`)
  console.log(`    نامِ «${NAME}»: ${res.texts} جا · تیک: ${res.badges}`
    + ` · کنارِ نام: ${res.beside.length} · روی عکس: ${res.onImage}`)
  for (const b of res.beside) console.log(`      dx=${b.dx.toFixed(1)}px  dy=${b.dy.toFixed(1)}px`)
  if (!ok) {
    if (!res.texts) console.log('      ← نامِ باشگاه اصلاً رندر نشد')
    else if (!res.beside.length) console.log('      ← هیچ تیکی چسبیده به نام نیست')
    else console.log('      ← تیکی هست که به هیچ نامی نچسبیده (احتمالاً گوشه‌ی کارت)')
  }
  await page.close()
}
} finally { await browser.close() }
console.log(`\n${fail ? '❌' : '✅'}  ${pass} قبول · ${fail} رد`)
process.exit(fail ? 1 : 0)
