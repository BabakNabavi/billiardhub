/* موبایل — سرریزِ افقی و حاشیه‌ی لبه.
       node scripts/test-responsive.mjs

   دو چیز سنجیده می‌شود که هر دو را کاربر مستقیم می‌بیند:

   ۱) سرریزِ افقی: اگر `scrollWidth` بدنه از عرضِ صفحه بیشتر باشد،
      کاربر می‌تواند کلِ صفحه را به پهلو بکشد — همان حسِ «شکسته».
   ۲) چسبیدن به لبه: محتوا نباید از لبه‌ی چپ و راست فاصله‌ی صفر داشته
      باشد. این همان چیزی است که در پنلِ ادمین دیده شد.

   عرض‌ها واقعی‌اند: ۳۲۰ کوچک‌ترین گوشیِ رایج، ۳۹۰ آیفون، ۴۱۴ اندرویدِ
   بزرگ، ۷۶۸ تبلت. */
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

const rest = async p => (await fetch(U + '/rest/v1/' + p, { headers: { apikey: K, Authorization: 'Bearer ' + K } })).json()
const me = (await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283'))[0]

let pass = 0, fail = 0
const t = (n, ok, x = '') => { ok ? pass++ : fail++; console.log('  ' + (ok ? '✓' : '✗') + ' ' + n + (ok ? '' : '  ← ' + x)) }
const head = x => console.log('\n■ ' + x)

const WIDTHS = [320, 390, 414, 768]
const PUBLIC = [
  ['/', 'صفحه‌ی اول'], ['/clubs', 'باشگاه‌ها'], ['/ranking', 'رنکینگ'],
  ['/tournaments', 'مسابقات'], ['/shop', 'فروشگاه'], ['/sellers', 'فروشندگان'],
  ['/coaches', 'مربیان'], ['/news', 'اخبار'], ['/media', 'مدیا'],
  ['/login', 'ورود'], ['/register', 'ثبت‌نام'], ['/contact', 'تماس'],
]
const ADMIN = [
  ['/admin', 'داشبوردِ ادمین'], ['/admin/users', 'مدیریت کاربران'],
  ['/admin/tournaments', 'مسابقاتِ ادمین'], ['/admin/clubs', 'تأیید باشگاه‌ها'],
  ['/admin/finance', 'داشبورد مالی'], ['/admin/roles', 'مدیریت نقش‌ها'],
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()

/* اندازه‌گیری در خودِ مرورگر: سرریز و کمترین فاصله‌ی محتوا تا لبه */
const measure = () => page.evaluate(() => {
  const de = document.documentElement
  const vw = de.clientWidth
  const overflow = Math.max(document.body.scrollWidth, de.scrollWidth) - vw

  /* پهن‌ترین عنصری که از صفحه بیرون زده — برای گزارشِ مفید */
  let worst = null, worstOver = 0
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const st = getComputedStyle(el)
    if (st.display === 'none' || st.visibility === 'hidden' || st.position === 'fixed') continue
    const r = el.getBoundingClientRect()
    if (r.width === 0) continue
    const over = Math.max(0, r.right - vw, -r.left)
    if (over > worstOver) {
      worstOver = over
      worst = (el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '')).slice(0, 40)
    }
  }

  /* فاصله‌ی محتوای واقعی تا لبه.

     عناصرِ داخلِ یک نوارِ افقیِ اسکرول‌شونده (کاروسل‌ها) عمداً از صفحه
     بیرون می‌زنند و این طبیعی است — شمردنشان عددهای بی‌معنیِ منفیِ
     هزارتایی می‌داد. پس هر عنصری که جدِ اسکرول‌شونده‌ی افقی دارد کنار
     گذاشته می‌شود. */
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX
      if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth + 1) return true
    }
    return false
  }
  let minPad = Infinity, tight = null
  for (const el of Array.from(document.querySelectorAll('h1,h2,h3,p,label,input,button,td,th'))) {
    const st = getComputedStyle(el)
    if (st.display === 'none' || st.visibility === 'hidden' || st.position === 'fixed') continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0 || r.width > vw) continue
    /* بلوکِ تمام‌عرض (مثل عنوانِ وسط‌چینِ هیرو) جعبه‌اش لبه تا لبه است
       ولی متنش تورفتگی دارد. سنجشِ جعبه این‌جا بی‌معنی است؛ آنچه
       اهمیت دارد عناصری‌اند که واقعاً باید حاشیه داشته باشند. */
    if (r.width >= vw - 2) continue
    if (r.top > 3000 || r.bottom < 0) continue
    if (inScroller(el)) continue
    /* `next-route-announcer` عنصرِ نامرئیِ دسترس‌پذیریِ خودِ Next است و
       دیده نمی‌شود؛ شمردنش روی همه‌ی صفحه‌ها یک قرمزِ دروغین می‌داد. */
    if (el.closest('next-route-announcer, [aria-live], .sr-only')) continue
    /* سربرگ، ناوبری و پاورقی عمداً تمام‌عرض‌اند و لوگو/عنوانشان نزدیکِ
       لبه می‌نشیند؛ این طراحی است نه اشکال. سنجش روی *محتوای صفحه*
       است. */
    if (el.closest('header, nav, footer')) continue
    if (st.clip === 'rect(0px, 0px, 0px, 0px)' || st.clipPath === 'inset(50%)') continue
    const pad = Math.min(r.left, vw - r.right)
    if (pad < minPad) {
      minPad = pad
      tight = (el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '')).slice(0, 36)
    }
  }
  return { overflow, worst, worstOver: Math.round(worstOver), tight,
           minPad: minPad === Infinity ? null : Math.round(minPad) }
})

const sweep = async (list, label) => {
  for (const w of WIDTHS) {
    head(label + ' — عرض ' + w + 'px')
    await page.setViewport({ width: w, height: 850, isMobile: w < 768, deviceScaleFactor: 2 })
    for (const [path, name] of list) {
      try {
        await page.goto(B + path, { waitUntil: 'domcontentloaded', timeout: 90_000 })
      } catch { t(name.padEnd(20) + ' باز می‌شود', false, 'timeout'); continue }
      await new Promise(z => setTimeout(z, 2600))
      const m = await measure()
      /* یک پیکسل رواداری برای گردکردنِ زیرپیکسلی */
      t((name + ' بدونِ سرریزِ افقی').padEnd(34), m.overflow <= 1,
        m.overflow + 'px بیرون‌زدگی · ' + (m.worst ?? '?') + ' (+' + m.worstOver + ')')
      if (m.minPad !== null) {
        t((name + ' به لبه نچسبیده').padEnd(34), m.minPad >= 8, 'فاصله ' + m.minPad + 'px — ' + (m.tight ?? '?'))
      }
    }
  }
}

try {
  await sweep(PUBLIC, 'صفحه‌های عمومی')

  /* پنلِ ادمین با نشستِ واقعی */
  const token = jwt.sign({ sub: me.id, role: 'admin', phone: me.phone }, S, { expiresIn: '30m' })
  await browser.setCookie({ name: 'bh_at', value: token, domain: 'localhost', path: '/' })
  await page.evaluateOnNewDocument((u) => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u }, version: 0 }))
  }, { id: me.id, phone: me.phone, primaryRole: 'admin', secondaryRoles: ['admin'], firstName: 'آزمایش', lastName: 'ادمین' })
  await rest('users?id=eq.' + me.id)   // بی‌اثر؛ فقط برای ترتیب
  await fetch(U + '/rest/v1/users?id=eq.' + me.id, {
    method: 'PATCH',
    headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' },
    body: JSON.stringify({ primaryRole: 'admin', secondaryRoles: [...new Set([...(me.secondaryRoles ?? []), 'admin'])] }),
  })
  await sweep(ADMIN, 'پنلِ ادمین')
} finally {
  await browser.close()
  await fetch(U + '/rest/v1/users?id=eq.' + me.id, {
    method: 'PATCH',
    headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' },
    body: JSON.stringify({ primaryRole: me.primaryRole, secondaryRoles: me.secondaryRoles }),
  })
  console.log('\n  ⓘ نقشِ حسابِ آزمایشی برگردانده شد')
}

console.log('\n  موفق: ' + pass + '   ناموفق: ' + fail + '\n')
process.exit(fail ? 1 : 0)
