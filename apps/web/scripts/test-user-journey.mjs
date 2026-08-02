/* سفرِ کاربرِ واقعی — با نشستِ واقعی، در مرورگرِ واقعی.
       node scripts/test-user-journey.mjs

   «یک بار به‌عنوان کاربر برو، همه‌ی نقش‌ها را انتخاب کن و پروفایل
   بساز و ببین چه ایرادی دارد.»

   هر صفحه‌ی نقش باز می‌شود و بررسی می‌شود که: باز شود، خطای رندر
   ندهد، محتوای واقعی داشته باشد (نه فقط اسکلتِ خالی)، و از صفحه بیرون
   پرت نشود. هیچ داده‌ی واقعی‌ای عوض نمی‌شود؛ فقط پروفایل‌های zz که در
   پایان پاک می‌شوند. */
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
    headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(i?.headers ?? {}) },
  })
  const t = await r.text()
  return { s: r.status, b: t ? JSON.parse(t) : null }
}

const me = (await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
if (!me) { console.log('  ✗ حسابِ آزمایشی نیست'); process.exit(1) }
if (me.primaryRole === 'admin') { console.log('  ✗ حساب ادمین است — اجرای قبلی برنگردانده'); process.exit(1) }
const ORIG = { primaryRole: me.primaryRole, secondaryRoles: me.secondaryRoles }

const cleanup = async () => {
  try { await rest('profiles?slug=like.zz-*', { method: 'DELETE' }) } catch { /* رفته */ }
  try { await rest('role_requests?user_id=eq.' + me.id, { method: 'DELETE' }) } catch { /* رفته */ }
  await rest('users?id=eq.' + me.id, { method: 'PATCH', body: JSON.stringify(ORIG) })
}
for (const sg of ['SIGINT', 'SIGTERM', 'SIGPIPE']) process.on(sg, () => { cleanup().finally(() => process.exit(130)) })

let pass = 0, fail = 0
const t = (n, ok, x = '') => { ok ? pass++ : fail++; console.log('  ' + (ok ? '✓' : '✗') + ' ' + n + (ok ? '' : '  ← ' + x)) }
const head = x => console.log('\n■ ' + x)
const note = x => console.log('  ⓘ ' + x)

/* نشستِ واقعی: همان کوکیِ httpOnly که مسیرِ ورود می‌گذارد */
const token = jwt.sign({ sub: me.id, role: 'user', phone: me.phone }, S, { expiresIn: '30m' })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errs = []
page.on('pageerror', e => errs.push(e.message))
/* کوکی عمداً هنوز ست نمی‌شود: اول بخشِ مهمان اجرا می‌شود. */

/* صفحه واقعاً محتوا دارد یا فقط اسکلت است؟ */
const visit = async (path, label, { needs = [], forbid = [] } = {}) => {
  errs.length = 0
  let status = 0
  try {
    const r = await page.goto(B + path, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    status = r?.status() ?? 0
  } catch (e) { t(label + ' باز می‌شود', false, String(e).slice(0, 80)); return '' }
  await new Promise(z => setTimeout(z, 3200))
  const txt = await page.evaluate(() => document.body.innerText)
  t((label + ' باز می‌شود').padEnd(42), status === 200, 'HTTP ' + status)
  t((label + ' بدونِ خطای رندر').padEnd(42), errs.length === 0, errs[0]?.slice(0, 90) ?? '')
  t((label + ' محتوا دارد').padEnd(42), txt.trim().length > 60, 'فقط ' + txt.trim().length + ' نویسه')
  t((label + ' بیرون پرت نمی‌شود').padEnd(42), new URL(page.url()).pathname.startsWith(path.split('?')[0]) || path === '/', page.url())
  for (const s of needs) t((label + ' شاملِ «' + s + '»').padEnd(42), txt.includes(s), '')
  for (const s of forbid) t((label + ' بدونِ «' + s + '»').padEnd(42), !txt.includes(s), '')
  return txt
}

try {
  head('صفحه‌های عمومی — مهمان')
  for (const [p, l] of [['/', 'صفحه‌ی اول'], ['/clubs', 'باشگاه‌ها'], ['/ranking', 'رنکینگ'],
    ['/tournaments', 'مسابقات'], ['/shop', 'فروشگاه'], ['/sellers', 'فروشندگان'],
    ['/coaches', 'مربیان'], ['/referees', 'داوران'], ['/news', 'اخبار'], ['/media', 'مدیا'],
    ['/login', 'ورود'], ['/register', 'ثبت‌نام']]) {
    await visit(p, l)
  }

  head('مسیرهای خصوصی — مهمان نباید ببیند')
  for (const p of ['/dashboard', '/profile/me', '/profile/role', '/admin']) {
    await page.goto(B + p, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await new Promise(z => setTimeout(z, 2500))
    const to = new URL(page.url()).pathname
    t(('مهمان از ' + p + ' هدایت می‌شود').padEnd(42), to !== p, 'همان‌جا ماند')
  }

  head('کاربرِ واردشده — انتخابِ نقش')
  /* ورودِ واقعی سه چیز می‌گذارد: کوکیِ نشست، کوکیِ CSRF (خواندنی، برای
     double-submit)، و کاربر در استورِ zustand که در localStorage
     می‌ماند. هر سه لازم است وگرنه شبیه‌سازی صادق نیست. */
  const CSRF = 'zz-csrf-' + me.id.slice(0, 8)
  await browser.setCookie(
    { name: 'bh_at', value: token, domain: 'localhost', path: '/' },
    { name: 'bh_csrf', value: CSRF, domain: 'localhost', path: '/' })
  await page.evaluateOnNewDocument((u) => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u }, version: 0 }))
  }, { id: me.id, phone: me.phone, primaryRole: ORIG.primaryRole, secondaryRoles: ORIG.secondaryRoles ?? [], firstName: 'آزمایش', lastName: 'کاربر' })
  await visit('/profile/role', 'انتخابِ نقش', { needs: ['مربی', 'داور'] })

  head('کاربرِ واردشده — داشبوردِ هر نقش')
  await visit('/dashboard', 'داشبوردِ اصلی')
  for (const [p, l] of [['/dashboard/player', 'داشبوردِ بازیکن'], ['/dashboard/coach', 'داشبوردِ مربی'],
    ['/dashboard/seller', 'داشبوردِ فروشنده'], ['/dashboard/manufacturer', 'داشبوردِ تولیدکننده'],
    ['/dashboard/technician', 'داشبوردِ متخصص'], ['/dashboard/club', 'داشبوردِ باشگاه'],
    ['/dashboard/shop', 'داشبوردِ فروشگاه']]) {
    await visit(p, l)
  }

  head('کاربرِ واردشده — پروفایل')
  for (const [p, l] of [['/profile', 'پروفایل'], ['/profile/me', 'پروفایلِ من'],
    ['/profile/setup', 'تکمیلِ پروفایل'], ['/profile/verify', 'احرازِ هویت']]) {
    await visit(p, l)
  }

  head('ساختِ پروفایل از راهِ API — همان کاری که داشبورد می‌کند')
  for (const kind of ['coach', 'referee', 'seller', 'manufacturer', 'technician', 'player']) {
    const r = await page.evaluate(async (k, c) => {
      const res = await fetch('/api/profiles/' + k, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': c }, credentials: 'include',
        body: JSON.stringify({ slug: 'zz-' + k + '-journey', data: { title: 'zz ' + k, city: 'تهران' } }),
      })
      return res.status
    }, kind, CSRF)
    t(('پروفایلِ ' + kind + ' ساخته می‌شود').padEnd(42), r === 201, 'HTTP ' + r)
  }
  const made = (await rest('profiles?select=kind,status&slug=like.zz-*')).b ?? []
  t('هر شش در دیتابیس', made.length === 6, made.length + ' ردیف')
  t('همه در انتظارِ بررسی‌اند', made.every(p => p.status === 'pending'), JSON.stringify(made.map(p => p.status)))

  head('درخواستِ نقش از راهِ API')
  /* اول بدونِ هدرِ CSRF — باید رد شود */
  const noCsrf = await page.evaluate(async () => {
    const res = await fetch('/api/roles/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ role: 'referee' }),
    })
    return res.status
  })
  t('POST بدونِ توکنِ CSRF رد می‌شود', noCsrf === 403, 'HTTP ' + noCsrf)

  const rr = await page.evaluate(async (c) => {
    const res = await fetch('/api/roles/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': c }, credentials: 'include',
      body: JSON.stringify({ role: 'coach' }),
    })
    return res.status
  }, CSRF)
  t('درخواستِ نقش ثبت می‌شود', rr === 201, 'HTTP ' + rr)
  const mine = await page.evaluate(async () => {
    const res = await fetch('/api/roles/my', { credentials: 'include' })
    return res.ok ? (await res.json()).requests?.length ?? 0 : -1
  })
  t('کاربر درخواستِ خودش را می‌بیند', mine === 1, String(mine))

} finally {
  head('پاک‌سازی')
  await browser.close()
  await cleanup()
  t('هیچ پروفایلِ آزمایشی نماند', ((await rest('profiles?select=id&slug=like.zz-*')).b ?? []).length === 0, '')
  t('هیچ درخواستِ نقشی نماند', ((await rest('role_requests?select=id&user_id=eq.' + me.id)).b ?? []).length === 0, '')
  t('نقشِ حسابِ آزمایشی برگشت',
    (await rest('users?select="primaryRole"&phone=eq.09001327283')).b[0].primaryRole === ORIG.primaryRole, '')
}

console.log('\n  موفق: ' + pass + '   ناموفق: ' + fail + '\n')
process.exit(fail ? 1 : 0)
