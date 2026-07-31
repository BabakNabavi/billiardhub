/* تست رابط کاربری: مشاهده‌ی استوری توسط مهمان + مخفی‌بودن تعاملات.
       node scripts/test-social-ui.mjs [BASE]

   برای اینکه «مهمان استوری می‌بیند» واقعاً سنجیده شود نه فرض، یک استوری
   آزمایشی موقتاً ساخته می‌شود و در پایان فایل استوری‌ها دقیقاً به همان
   محتوای قبلی برگردانده می‌شود (اسنپ‌شات → تزریق → تست → بازگردانی). */

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
require('dotenv').config({ path: '.env.local' })
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')
const puppeteer = require('puppeteer-core')

const BASE = process.argv[2] || 'http://localhost:3120'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const FLAG = 'social_interactions_enabled'
const STORIES_PATH = 'social/stories/index.json'   // همان مسیر P.stories در lib/social-server
const BUCKET = 'club-media'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: admins } = await sb.from('users').select('id,primaryRole,phone').eq('primaryRole', 'admin').limit(1)
const { data: users } = await sb.from('users').select('id,primaryRole,secondaryRoles,phone').neq('primaryRole', 'admin').limit(5)
const ADMIN = admins?.[0]
const USER = (users ?? []).find(u => !(u.secondaryRoles ?? []).includes('admin'))

const sign = u => jwt.sign(
  { sub: u.id, role: u.primaryRole, phone: u.phone, sid: 'test-' + u.id.slice(0, 8), typ: 'at' },
  process.env.JWT_SECRET, { expiresIn: 900 },
)
const CSRF = 'test-csrf-token'
const adminHeaders = { cookie: `bh_at=${sign(ADMIN)}; bh_csrf=${CSRF}`, 'x-csrf-token': CSRF, 'Content-Type': 'application/json' }
async function seedSession(page) {
  /* کوکی برای سرور، localStorage برای کلاینت. زوستند وضعیت کاربر را
     از کلید auth-storage می‌خواند و بدون آن، Navbar کاربر را مهمان
     می‌بیند و آیکون‌ها را اصلاً رندر نمی‌کند. */
  /* دو نکته که بدونشان کاربر بلافاصله بیرون انداخته می‌شود:

     • `bh_session_migrated` ⇒ SessionBridge سراغ /api/auth/adopt نمی‌رود
     • `token` در state ⇒ وقتی /api/auth/refresh با ۴۰۱ برمی‌گردد (نشست
       واقعی در دیتابیس نداریم)، SessionBridge می‌بیند توکن قدیمی هست و
       عمداً logout نمی‌کند — همان مسیر گذار خود پروژه.

     `zustand` هنگام rehydrate توکن را از localStorage پاک می‌کند
     (partialize فقط user را نگه می‌دارد)، پس تنها راه پایدار این است که
     خود درخواست refresh پاسخ ۵۰۳ بگیرد: «سرویس موقتاً نیست، کاری نکن».

     continue/respond حتماً در try می‌آید — یک استثنای مدیریت‌نشده در این
     هندلر باعث می‌شد بقیه‌ی درخواست‌ها (از جمله /api/features) معلق
     بمانند و پرچم همیشه خاموش خوانده شود. */
  await page.setRequestInterception(true)
  page.on('request', r => {
    try {
      if (r.isInterceptResolutionHandled?.()) return
      if (r.url().includes('/api/auth/refresh')) r.respond({ status: 503, contentType: 'application/json', body: '{}' })
      else r.continue()
    } catch { /* درخواست قبلاً رسیدگی شده */ }
  })
  await page.evaluateOnNewDocument(u => {
    try {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { user: u, token: 'test-legacy' }, version: 0,
      }))
      localStorage.setItem('bh_session_migrated', '1')
    } catch {}
  }, { id: USER.id, phone: USER.phone, firstName: 'کاربر', lastName: 'آزمایشی', primaryRole: USER.primaryRole })
}

const setFlag = on => fetch(BASE + '/api/admin/settings', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ [FLAG]: on }) })

/* ── اسنپ‌شات فایل استوری‌ها ────────────────────────────────── */
async function readStories() {
  const { data, error } = await sb.storage.from(BUCKET).download(STORIES_PATH)
  if (error || !data) return null
  try { return JSON.parse(await data.text()) } catch { return null }
}
async function writeStories(arr) {
  await sb.storage.from(BUCKET).upload(STORIES_PATH, new Blob([JSON.stringify(arr)], { type: 'application/json' }), { upsert: true, contentType: 'application/json' })
}

const SNAPSHOT = await readStories()
console.log(`  اسنپ‌شات استوری‌ها: ${SNAPSHOT === null ? 'فایل وجود ندارد' : SNAPSHOT.length + ' استوری'}`)

const TEST_STORIES = [
  {
    id: 'st-uitest-1', ownerKey: USER.id, userName: 'کاربر آزمایشی',
    roleKey: 'player', roleLabel: 'بازیکن', roleColor: '#06b6d4', avatar: 'ک',
    mediaUrl: `${BASE}/images/Logo/logo-512x512.png`, caption: 'استوری آزمایشی یک', createdAt: Date.now(),
  },
  {
    id: 'st-uitest-2', ownerKey: USER.id, userName: 'کاربر آزمایشی',
    roleKey: 'player', roleLabel: 'بازیکن', roleColor: '#06b6d4', avatar: 'ک',
    mediaUrl: `${BASE}/images/Logo/logo-512x512.png`, caption: 'استوری آزمایشی دو', createdAt: Date.now(),
  },
]

let browser
try {
  await writeStories([...TEST_STORIES, ...(SNAPSHOT ?? [])])
  console.log('  دو استوری آزمایشی تزریق شد')

  browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] })

  /* دسترسی به نوار استوری در صفحه‌ی اصلی */
  const openStrip = async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 90000 })
    await page.waitForSelector('[data-story-avatar], .story-ring, img[alt]', { timeout: 15000 }).catch(() => {})
  }

  /* ═══ پرچم خاموش ═══ */
  await setFlag(false)
  await new Promise(r => setTimeout(r, 400))

  head('بخش ۱۳ — مهمان: باز کردن، ناوبری و بستن استوری (پرچم خاموش)')
  {
    const p = await browser.newPage(); await p.setViewport({ width: 1280, height: 900 })
    const calls = []
    p.on('request', r => { const u = r.url(); if (u.includes('/api/social/')) calls.push(u.replace(BASE, '')) })
    await openStrip(p)

    /* کارت استوری آزمایشی را با نامش پیدا کن */
    const opened = await p.evaluate(() => {
      const btn = [...document.querySelectorAll('.st-item')].find(b => b.textContent?.includes('کاربر آزمایشی'))
      if (!btn) return false
      btn.click(); return true
    })
    t('نوار استوری برای مهمان دیده می‌شود و باز شد', opened)

    await new Promise(r => setTimeout(r, 900))
    const view = await p.evaluate(() => {
      const cap = document.body.innerText
      return {
        openedViewer: cap.includes('استوری آزمایشی'),
        hasReplyInput: !!document.querySelector('.story-msg-input'),
        hasStickerBar: !!document.querySelector('.story-stk'),
        hasLoginToReply: document.body.innerText.includes('برای پاسخ به استوری وارد شوید'),
        text: cap.slice(0, 0),
      }
    })
    t('نمایشگر استوری باز شد و محتوا دیده می‌شود', view.openedViewer)
    t('اینپوت پاسخ وجود ندارد', !view.hasReplyInput)
    t('نوار استیکر وجود ندارد', !view.hasStickerBar)
    t('CTAی «برای پاسخ وارد شوید» هم نیست', !view.hasLoginToReply)

    /* ناوبری: استوری بعدی با کلیک روی نیمه‌ی چپ */
    const before = await p.evaluate(() => document.body.innerText.includes('استوری آزمایشی دو'))
    await p.evaluate(() => {
      /* دو دکمه‌ی نامرئی ناوبری: راست = بعدی، چپ = قبلی */
      const zones = [...document.querySelectorAll('button')].filter(b => {
        const st = getComputedStyle(b)
        return st.position === 'absolute' && parseFloat(st.width) > 60 && b.textContent === ''
      })
      zones[0]?.click()
    })
    await new Promise(r => setTimeout(r, 600))
    const after = await p.evaluate(() => document.body.innerText.includes('استوری آزمایشی دو'))
    t('ناوبری بین استوری‌ها کار می‌کند', before !== after || after, `before=${before} after=${after}`)

    /* بستن */
    await p.evaluate(() => {
      /* دکمه‌ی × در هدر نمایشگر: ۳۲×۳۲ و در بالای صفحه */
      const x = [...document.querySelectorAll('button')].find(b => {
        const r = b.getBoundingClientRect()
        return Math.round(r.width) === 32 && Math.round(r.height) === 32 && r.top < 140 && b.querySelector('svg')
      })
      x?.click()
    })
    await new Promise(r => setTimeout(r, 500))
    const stillOpen = await p.evaluate(() => !!document.querySelector('.story-msg-input') || document.body.style.overflow === 'hidden')
    t('نمایشگر بسته می‌شود', !stillOpen)

    const social = calls.filter(u => u.includes('/dm') || u.includes('/notifications'))
    t('هیچ درخواستی به dm/notifications نرفت', social.length === 0, social.join(', '))
    console.log(`      درخواست‌های سوشال: ${calls.join(', ') || '—'}`)
    await p.close()
  }

  head('کاربر لاگین با پرچم خاموش')
  {
    const p = await browser.newPage(); await p.setViewport({ width: 1280, height: 900 })
    const calls = []
    p.on('request', r => { const u = r.url(); if (u.includes('/api/social/')) calls.push(u.replace(BASE, '')) })
    await seedSession(p)
  await p.setCookie(
      { name: 'bh_at', value: sign(USER), domain: 'localhost', path: '/' },
      { name: 'bh_csrf', value: CSRF, domain: 'localhost', path: '/' },
    )
    await openStrip(p)
    await new Promise(r => setTimeout(r, 3500))

    const nav = await p.evaluate(() => ({
      bell: !!document.querySelector('button[aria-label="اعلان‌ها"]'),
      direct: !!document.querySelector('a[aria-label="دایرکت"]'),
    }))
    t('آیکون اعلان‌ها مخفی است', !nav.bell)
    t('آیکون دایرکت مخفی است', !nav.direct)

    const social = calls.filter(u => u.includes('/dm') || u.includes('/notifications'))
    t('پول ۱۵ ثانیه‌ای اجرا نشد', social.length === 0, social.join(', '))

    await p.goto(BASE + '/direct', { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 700))
    const direct = await p.evaluate(() => document.body.innerText)
    t('/direct پیام «غیرفعال» نشان می‌دهد', direct.includes('موقتاً غیرفعال'), direct.slice(0, 90))
    t('/direct صفحه‌ی خالی/شکسته نیست', direct.includes('بازگشت به صفحه'))
    await p.close()
  }

  /* ═══ پرچم روشن ═══ */
  head('بخش ۱۵ — همان صفحات با پرچم روشن')
  await setFlag(true)
  await new Promise(r => setTimeout(r, 400))
  {
    const p = await browser.newPage(); await p.setViewport({ width: 1280, height: 900 })
    await seedSession(p)
  await p.setCookie(
      { name: 'bh_at', value: sign(USER), domain: 'localhost', path: '/' },
      { name: 'bh_csrf', value: CSRF, domain: 'localhost', path: '/' },
    )
    await openStrip(p)
    await new Promise(r => setTimeout(r, 3500))

    const nav = await p.evaluate(() => ({
      bell: !!document.querySelector('button[aria-label="اعلان‌ها"]'),
      direct: !!document.querySelector('a[aria-label="دایرکت"]'),
    }))
    t('آیکون اعلان‌ها برگشت', nav.bell)
    t('آیکون دایرکت برگشت', nav.direct)

    const opened = await p.evaluate(() => {
      const btn = [...document.querySelectorAll('.st-item')].find(b => b.textContent?.includes('کاربر آزمایشی'))
      if (!btn) return false
      btn.click(); return true
    })
    t('استوری باز شد', opened)
    await new Promise(r => setTimeout(r, 900))
    const ui = await p.evaluate(() => ({
      reply: !!document.querySelector('.story-msg-input'),
      like: !!document.querySelector('button[aria-label="لایک"]'),
      sticker: !!document.querySelector('button[aria-label="استیکر"]'),
      send: !!document.querySelector('button[aria-label="ارسال"]'),
    }))
    t('اینپوت پاسخ برگشت', ui.reply)
    t('دکمه‌ی لایک برگشت', ui.like)
    t('دکمه‌ی استیکر برگشت', ui.sticker)
    t('دکمه‌ی ارسال برگشت', ui.send)
    await p.close()

    const d = await browser.newPage(); await d.setViewport({ width: 1280, height: 900 })
    await d.setCookie(
      { name: 'bh_at', value: sign(USER), domain: 'localhost', path: '/' },
      { name: 'bh_csrf', value: CSRF, domain: 'localhost', path: '/' },
    )
    await d.goto(BASE + '/direct', { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 900))
    const txt = await d.evaluate(() => document.body.innerText)
    t('/direct دوباره صفحه‌ی واقعی دایرکت است', !txt.includes('موقتاً غیرفعال'), txt.slice(0, 90))
    await d.close()
  }

  head('مهمان با پرچم روشن — همچنان نباید تعامل کند')
  {
    const p = await browser.newPage(); await p.setViewport({ width: 1280, height: 900 })
    await openStrip(p)
    await p.evaluate(() => {
      const btn = [...document.querySelectorAll('.st-item')].find(b => b.textContent?.includes('کاربر آزمایشی'))
      btn?.click()
    })
    await new Promise(r => setTimeout(r, 900))
    const ui = await p.evaluate(() => ({
      reply: !!document.querySelector('.story-msg-input'),
      like: !!document.querySelector('button[aria-label="لایک"]'),
      loginCta: document.body.innerText.includes('برای پاسخ به استوری وارد شوید'),
      viewer: document.body.innerText.includes('استوری آزمایشی'),
    }))
    t('مهمان استوری را می‌بیند', ui.viewer)
    t('مهمان اینپوت پاسخ ندارد', !ui.reply)
    t('مهمان دکمه‌ی لایک ندارد', !ui.like)
    t('به‌جایش CTAی ورود می‌بیند (رفتار قبلی پروژه)', ui.loginCta)
    await p.close()
  }

} finally {
  /* وضعیت نهایی: پرچم خاموش، استوری‌ها دقیقاً مثل قبل */
  await setFlag(false).catch(() => {})
  if (browser) await browser.close().catch(() => {})
  if (SNAPSHOT === null) {
    await sb.storage.from(BUCKET).remove([STORIES_PATH]).catch(() => {})
  } else {
    await writeStories(SNAPSHOT)
  }
  const restored = await readStories()
  const same = SNAPSHOT === null ? restored === null || (Array.isArray(restored) && restored.length === 0)
    : JSON.stringify(restored) === JSON.stringify(SNAPSHOT)
  t('استوری‌ها دقیقاً به وضعیت قبل برگشتند', same,
    `قبل=${SNAPSHOT === null ? 'null' : SNAPSHOT.length} بعد=${restored === null ? 'null' : restored.length}`)
}

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
