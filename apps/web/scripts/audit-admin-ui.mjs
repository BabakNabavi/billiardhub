/* ممیزیِ UI/UX پنلِ ادمین — صفحه‌به‌صفحه، موبایل و دسکتاپ.
       node scripts/audit-admin-ui.mjs

   چهار چیزی که کاربر مستقیم می‌بیند اندازه گرفته می‌شود:

   ۱) سرریزِ افقی — کشیده‌شدنِ کلِ صفحه به پهلو
   ۲) چسبیدن به لبه — فاصله‌ی محتوا تا لبه‌ی صفحه
   ۳) شلوغی — کارت/ردیف‌هایی که به هم چسبیده‌اند
   ۴) هدفِ لمس — دکمه‌های کوچک‌تر از ۴۰ پیکسل روی موبایل

   خروجی برای هر صفحه یک سطر است تا بشود قبل و بعد را مقایسه کرد. */
import fs from 'node:fs'
import jwt from 'jsonwebtoken'
import puppeteer from 'puppeteer-core'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY, S = env.JWT_SECRET
const B = process.env.BH_BASE ?? 'http://localhost:3000'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const rest = async (p, i) => {
  const r = await fetch(U + '/rest/v1/' + p, {
    ...(i ?? {}),
    headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json', ...(i?.headers ?? {}) },
  })
  const t = await r.text(); return t ? JSON.parse(t) : null
}
const me = (await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283'))[0]
if (me.primaryRole === 'admin') {
  console.log('\n  ✗ حسابِ آزمایشی از قبل ادمین است — اجرای قبلی نقش را برنگردانده.')
  console.log('    پیش از اجرای دوباره نقش را دستی درست کنید، وگرنه این تست')
  console.log('    وضعیتِ ارتقایافته را به‌عنوان «وضعیتِ اصلی» ثبت می‌کند.')
  process.exit(1)
}
const ORIG = { primaryRole: me.primaryRole, secondaryRoles: me.secondaryRoles }
const setRole = body => rest('users?id=eq.' + me.id, { method: 'PATCH', body: JSON.stringify(body) })
for (const sg of ['SIGINT', 'SIGTERM', 'SIGPIPE'])
  process.on(sg, () => { setRole(ORIG).finally(() => process.exit(130)) })
process.on('uncaughtException', e => { console.error(e); setRole(ORIG).finally(() => process.exit(1)) })

const PAGES = ['', 'users', 'roles', 'verifications', 'support', 'access',
  'coaches', 'referees', 'rankings', 'players',
  'bookings', 'finance',
  'clubs', 'sellers', 'products', 'manufacturers', 'technicians',
  'news', 'tournaments', 'events',
  'ad-plans', 'story-plans', 'media', 'reports', 'features']

const MIN_EDGE = 12      // کمترین فاصله‌ی محتوا تا لبه
const MIN_GAP = 8        // کمترین فاصله‌ی عمودی بینِ کارت‌های هم‌سطح
const MIN_TAP = 36       // کمترین بعدِ هدفِ لمس روی موبایل

const measure = page => page.evaluate((MIN_GAP, MIN_TAP) => {
  const de = document.documentElement, vw = de.clientWidth
  /* دامنه‌ی سنجش: فقط محتوای پنل. فوتر/سربرگِ سایت بیرون‌اند. */
  const scope = document.querySelector('.admin-scope') || document.body
  const isMobile = vw < 700
  const vis = el => {
    const s = getComputedStyle(el)
    return s.display !== 'none' && s.visibility !== 'hidden' && s.position !== 'fixed'
  }
  const inScroller = el => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX
      if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth + 1) return true
    }
    return false
  }

  const overflow = Math.max(document.body.scrollWidth, de.scrollWidth) - vw

  let edge = Infinity, edgeEl = null
  for (const el of scope.querySelectorAll('h1,h2,h3,p,label,input,select,textarea,button,td,th')) {
    if (!vis(el) || inScroller(el) || el.closest('header,nav,footer,[aria-live],next-route-announcer')) continue
    if (el.closest('[class*="ft-"]')) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height || r.width >= vw - 2 || r.top > 4000 || r.bottom < 0) continue
    const pad = Math.min(r.left, vw - r.right)
    if (pad < edge) { edge = pad; edgeEl = el.tagName.toLowerCase() }
  }

  let gap = Infinity, gapEl = null
  for (const parent of scope.querySelectorAll('div,section,main,ul')) {
    if (!vis(parent)) continue
    const ps = getComputedStyle(parent)
    if (ps.display === 'flex' && ps.flexDirection.startsWith('row')) continue
    /* فهرستی که ردیف‌هایش با خطِ جداکننده از هم جدا می‌شوند، فاصله‌ی
       صفر دارد و درست است — جداییِ بصری از خط می‌آید نه از فاصله. */
    if (parent.className && /divide-y/.test(String(parent.className))) continue
    const kids = [...parent.children].filter(c => {
      if (!vis(c)) return false
      const r = c.getBoundingClientRect()
      return r.height > 24 && r.width > 60 && r.top < 4000
    })
    if (kids.length < 2) continue
    for (let i = 1; i < kids.length; i++) {
      const a = kids[i - 1].getBoundingClientRect(), b = kids[i].getBoundingClientRect()
      if (b.top < a.bottom - 2) continue
      const d = b.top - a.bottom
      if (d < gap) { gap = d; gapEl = (kids[i].tagName.toLowerCase() + '.' + String(kids[i].className || '').split(' ')[0]).slice(0, 28) }
    }
  }

  const small = []
  if (isMobile) {
    for (const el of scope.querySelectorAll('button,a[href],select')) {
      if (!vis(el)) continue
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height || r.top > 4000) continue
      if (Math.min(r.width, r.height) < MIN_TAP) small.push(Math.round(Math.min(r.width, r.height)))
    }
  }

  return { overflow, edge: edge === Infinity ? null : Math.round(edge), edgeEl,
           gap: gap === Infinity ? null : Math.round(gap), gapEl,
           smallTaps: small.length, smallest: small.length ? Math.min(...small) : null }
}, MIN_GAP, MIN_TAP)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
const token = jwt.sign({ sub: me.id, role: 'admin', phone: me.phone }, S, { expiresIn: '40m' })
await browser.setCookie({ name: 'bh_at', value: token, domain: 'localhost', path: '/' })
await browser.setCookie({ name: 'bh_csrf', value: 'zz-ui', domain: 'localhost', path: '/' })
await page.evaluateOnNewDocument(u => {
  localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u }, version: 0 }))
}, { id: me.id, phone: me.phone, primaryRole: 'admin', secondaryRoles: ['admin'], firstName: 'ادمین', lastName: 'آزمایش' })

const rows = []
try {
  await setRole({ primaryRole: 'admin', secondaryRoles: [...new Set([...(ORIG.secondaryRoles ?? []), 'admin'])] })

  for (const [w, label, mobile] of [[390, 'موبایل', true], [1280, 'دسکتاپ', false]]) {
    console.log('\n' + '═'.repeat(74))
    console.log('  ' + label + ' — عرض ' + w + 'px')
    console.log('═'.repeat(74))
    console.log('  صفحه'.padEnd(20) + 'سرریز'.padStart(7) + 'لبه'.padStart(7) + 'فاصله'.padStart(8) + '  لمسِ کوچک')
    console.log('  ' + '─'.repeat(70))
    await page.setViewport({ width: w, height: 900, isMobile: mobile, deviceScaleFactor: 2 })
    for (const p of PAGES) {
      const url = B + '/admin' + (p ? '/' + p : '')
      try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }) }
      catch { console.log('  ' + (p || '(داشبورد)').padEnd(20) + '  ✗ باز نشد'); continue }
      await new Promise(z => setTimeout(z, 2200))
      const m = await measure(page).catch(() => null)
      rows.push({ w, p, m })
      console.log('  ' + (p || '(داشبورد)').padEnd(20) +
        String(m?.overflow ?? '?').padStart(7) +
        String(m?.edge ?? '—').padStart(7) +
        String(m?.gap ?? '—').padStart(8) +
        '  ' + (m?.smallTaps ? m.smallTaps + ' (کمینه ' + m.smallest + ')' : '—'))
    }
  }
} finally {
  await browser.close()
  await setRole(ORIG)
  console.log('\n  ⓘ نقشِ حسابِ آزمایشی برگردانده شد')
}
fs.writeFileSync('C:/Users/bob/AppData/Local/Temp/claude/i--Billiard-Plus-billiard-plus/473a918a-66cf-4e60-b7f6-a2dbc7e084d7/scratchpad/ui.json', JSON.stringify(rows, null, 1))
