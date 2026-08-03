/* سنجشِ کارایی و نرمیِ رندر — با Chrome واقعی، نه تخمین.
       node scripts/perf-audit.mjs [--url=…] [--tag=before]

   چه چیزی اندازه گرفته می‌شود و چرا:

   · TTFB / FCP / LCP  — «کِی چیزی دیده شد»
   · CLS + منبعِ هر پرش — «چه چیزی جابه‌جا شد»؛ فقط عددِ CLS بدونِ
     اینکه بدانیم کدام عنصر پرید، برای رفعِ اشکال بی‌فایده است
   · Long Task / TBT   — «کِی صفحه یخ زد»
   · شمارشِ درخواست‌ها و تکراری‌ها
   · نسخه‌برداریِ زمانیِ محتوای دیده‌شده — این کلید ماجراست: هر ۱۰۰
     میلی‌ثانیه شمرده می‌شود چند عنصرِ متنی/تصویری واقعاً *دیده* می‌شوند
     (opacity و visibility حساب می‌شود، نه فقط وجودشان در DOM).
     همین ستون نشان می‌دهد آیا محتوا «آمد و رفت» یا پایدار ماند. */

import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const arg = (n, d) => (process.argv.find(a => a.startsWith(`--${n}=`)) ?? `--${n}=${d}`).split('=').slice(1).join('=')
const URL = arg('url', 'http://localhost:3000/')
const TAG = arg('tag', 'run')
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = 'C:/Users/bob/AppData/Local/Temp/claude/i--Billiard-Plus-billiard-plus/473a918a-66cf-4e60-b7f6-a2dbc7e084d7/scratchpad'

/* در همان سندِ صفحه اجرا می‌شود، پیش از هر اسکریپتِ دیگر */
const PROBE = () => {
  const P = { lcp: 0, lcpEl: '', cls: 0, shifts: [], longTasks: [], fcp: 0, frames: [] }
  window.__perf = P
  const nameOf = n => (n && n.tagName
    ? n.tagName.toLowerCase() + (n.className ? '.' + String(n.className).split(' ')[0] : '')
    : '?')

  try {
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') P.fcp = e.startTime
    }).observe({ type: 'paint', buffered: true })

    new PerformanceObserver(l => {
      const es = l.getEntries()
      const last = es[es.length - 1]
      if (last) { P.lcp = last.startTime; P.lcpEl = nameOf(last.element) }
    }).observe({ type: 'largest-contentful-paint', buffered: true })

    new PerformanceObserver(l => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue
        P.cls += e.value
        P.shifts.push({
          v: Number(e.value.toFixed(4)), t: Math.round(e.startTime),
          el: nameOf(e.sources && e.sources[0] && e.sources[0].node),
        })
      }
    }).observe({ type: 'layout-shift', buffered: true })

    new PerformanceObserver(l => {
      for (const e of l.getEntries()) P.longTasks.push({ t: Math.round(e.startTime), d: Math.round(e.duration) })
    }).observe({ type: 'longtask', buffered: true })
  } catch { /* مرورگر قدیمی */ }

  /* ── نسخه‌برداریِ زمانیِ «چه چیزی واقعاً دیده می‌شود» ── */
  const seen = () => {
    let visible = 0, imgs = 0, text = 0, faded = 0
    if (!document.body) return { visible, imgs, text, faded }
    const vh = window.innerHeight, vw = window.innerWidth
    for (const el of Array.from(document.body.querySelectorAll('img,h1,h2,h3,p,span,a,button'))) {
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue
      if (!r.width || !r.height) continue
      const s = getComputedStyle(el)
      if (s.visibility === 'hidden' || s.display === 'none') continue
      /* کدورتِ مؤثر: کدورتِ صفرِ هر والدی، فرزند را هم نامرئی می‌کند */
      let op = 1
      for (let p = el; p && p !== document.body; p = p.parentElement) op *= Number(getComputedStyle(p).opacity || 1)
      /* `faded` = در DOM هست، در قابِ دید هست، ولی کدورتش صفر است.
         این دقیقاً همان محتوایی است که سرور فرستاده و کاربر نمی‌بیند. */
      if (op < 0.05) { faded++; continue }
      visible++
      if (el.tagName === 'IMG') imgs++
      else if ((el.textContent || '').trim().length > 1) text++
    }
    return { visible, imgs, text, faded }
  }
  const t0 = performance.now()
  const tick = () => {
    const t = performance.now() - t0
    try { P.frames.push(Object.assign({ t: Math.round(t) }, seen())) } catch (e) { P.frameErr = String(e) }
    if (t < 6000) setTimeout(tick, 100)
  }
  setTimeout(tick, 0)
}

const SCENARIOS = [
  { name: 'دسکتاپ · بدون محدودیت', w: 1440, h: 900, mobile: false, cpu: 1, net: null },
  { name: 'دسکتاپ · CPU ۴×', w: 1440, h: 900, mobile: false, cpu: 4, net: null },
  { name: 'موبایل ۳۹۰ · CPU ۴×', w: 390, h: 844, mobile: true, cpu: 4, net: null },
  /* نامِ فیلدها در CDP دقیقاً downloadThroughput/uploadThroughput است */
  { name: 'موبایل ۳۹۰ · 4G کند + CPU ۴×', w: 390, h: 844, mobile: true, cpu: 4,
    net: { downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 } },
]

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const results = []
for (const sc of SCENARIOS) {
  const page = await browser.newPage()
  await page.setViewport({ width: sc.w, height: sc.h, isMobile: sc.mobile, deviceScaleFactor: sc.mobile ? 2 : 1 })
  await page.setCacheEnabled(false)                    // هر اجرا مثل بازدیدِ اول
  const cdp = await page.createCDPSession()
  await cdp.send('Network.enable')
  if (sc.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: sc.cpu })
  if (sc.net) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...sc.net })

  const reqs = []
  page.on('request', r => reqs.push({ url: r.url(), type: r.resourceType() }))

  await page.evaluateOnNewDocument(PROBE)
  const t0 = Date.now()
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 90_000 }).catch(() => {})
  await new Promise(z => setTimeout(z, 6200))

  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0]
    return n ? { ttfb: Math.round(n.responseStart), domLoaded: Math.round(n.domContentLoadedEventEnd) } : null
  })
  const p = await page.evaluate(() => (window).__perf)

  const byUrl = {}
  for (const r of reqs) byUrl[r.url] = (byUrl[r.url] ?? 0) + 1
  const dups = Object.entries(byUrl).filter(([, n]) => n > 1)

  results.push({ scenario: sc.name, wall: Date.now() - t0, nav, perf: p, reqs: reqs.length, dups })
  await page.close()
}
await browser.close()

/* ── چاپ ── */
const pad = (s, n) => String(s).padEnd(n)
console.log('\n' + '═'.repeat(78))
console.log('  سنجشِ کارایی — ' + TAG + '   ' + URL)
console.log('═'.repeat(78))

for (const r of results) {
  const p = r.perf ?? {}
  console.log('\n■ ' + r.scenario)
  console.log('  ' + pad('TTFB', 10) + Math.round(r.nav?.ttfb ?? 0) + ' ms')
  console.log('  ' + pad('FCP', 10) + Math.round(p.fcp ?? 0) + ' ms')
  console.log('  ' + pad('LCP', 10) + Math.round(p.lcp ?? 0) + ' ms' + (p.lcpEl ? '   ← ' + p.lcpEl : ''))
  console.log('  ' + pad('CLS', 10) + Number(p.cls ?? 0).toFixed(4))
  const lt = (p.longTasks ?? [])
  const tbt = lt.reduce((s, t) => s + Math.max(0, t.d - 50), 0)
  console.log('  ' + pad('TBT', 10) + tbt + ' ms   (' + lt.length + ' کارِ بلند، بلندترین ' + Math.max(0, ...lt.map(t => t.d)) + ' ms)')
  console.log('  ' + pad('درخواست', 10) + r.reqs + '   تکراری: ' + r.dups.length)
  for (const [u, n] of r.dups.slice(0, 5)) console.log('      ×' + n + '  ' + u.replace(/^https?:\/\/[^/]+/, '').slice(0, 68))

  const sh = (p.shifts ?? []).slice(0, 6)
  if (sh.length) {
    console.log('  پرشِ چیدمان:')
    for (const s of sh) console.log('      ' + pad(s.t + 'ms', 9) + s.v.toFixed(4) + '  ← ' + s.el)
  }

  /* ستونِ کلیدی: آیا محتوا آمد و رفت؟ */
  const f = (p.frames ?? [])
  if (f.length) {
    const marks = [0, 200, 400, 600, 800, 1000, 1500, 2000, 3000, 4000, 6000]
    const at = t => f.reduce((b, x) => (Math.abs(x.t - t) < Math.abs(b.t - t) ? x : b), f[0])
    console.log('  محتوا در طولِ زمان (ms →):')
    console.log('      ' + pad('', 10) + marks.map(m => pad(m, 7)).join(''))
    console.log('      ' + pad('دیده‌شده', 10) + marks.map(m => pad(at(m).visible, 7)).join(''))
    console.log('      ' + pad('کدورتِ ۰', 10) + marks.map(m => pad(at(m).faded, 7)).join(''))
    const peak = Math.max(...f.map(x => x.visible))
    const drops = f.filter((x, i) => i > 2 && f[i - 1] && x.visible < f[i - 1].visible - 3)
    if (drops.length) console.log('      ⚠ ' + drops.length + ' بار محتوا ناپدید شد — اوج ' + peak)
    const maxFaded = Math.max(...f.map(x => x.faded))
    if (maxFaded > 0) console.log('      ⚠ تا ' + maxFaded + ' عنصر در قابِ دید بودند ولی با کدورتِ صفر (نامرئی)')
  }
}

fs.writeFileSync(`${OUT}/perf-${TAG}.json`, JSON.stringify(results, null, 1))
console.log('\n  خام: perf-' + TAG + '.json\n')
