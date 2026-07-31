/* تست ورود، بازیابی رمز و سهمیه‌ی استوری روی سرور بیلدشده.
       node scripts/test-auth-quota.mjs [BASE]

   هیچ پیامک واقعی فرستاده نمی‌شود: شماره‌های آزمایشی یا در سیستم نیستند
   (پاسخ عمومی، بدون ارسال) یا پیشوندشان نامعتبر است (پیش از ارسال رد). */

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
require('dotenv').config({ path: '.env.local' })
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

const BASE = process.argv[2] || 'http://localhost:3170'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const req = async (path, init = {}) => {
  const r = await fetch(BASE + path, init)
  let body = null
  try { body = await r.json() } catch { /* غیرJSON */ }
  return { status: r.status, body }
}
const post = (path, data) => req(path, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
})

/* ════════ ۱) اعتبارسنجی شماره در مسیرهای واقعی ════════

   نسخه‌ی قبلی این تست انتظار داشت `0900` رد شود. آن فرض غلط بود —
   ۰۹۰۰ بازه‌ی واقعی ایرانسل است — و همان فرض روی سایت زنده جلوی
   ثبت‌نام دارندگان این شماره‌ها را گرفت. حالا برعکس سنجیده می‌شود. */
head('ثبت‌نام — شماره‌ی ۰۹۰۰ (ایرانسل) نباید رد شود')
{
  /* عمداً از شماره‌ای استفاده می‌شود که *از قبل* در سیستم هست: اگر گیت
     پیشوند باز باشد، پاسخ «قبلاً ثبت شده» است و همین ثابت می‌کند از
     بررسی پیشوند رد شده — بدون اینکه تست حساب تازه‌ای بسازد.

     نسخه‌ی اول این تست شماره‌ی نو می‌فرستاد و یک کاربر آزمایشی در
     دیتابیس واقعی جا می‌گذاشت. تست نباید داده بسازد. */
  const { data } = await sb.from('users').select('phone').ilike('phone', '0900%').limit(1)
  const existing = data?.[0]?.phone
  if (!existing) { console.log('      (هیچ حساب ۰۹۰۰ای نیست — این تست رد شد)') }
  else {
    const r = await post('/api/auth/register', {
      firstName: 'تست', lastName: 'تست', phone: existing, password: 'Test@12345',
    })
    t('۰۹۰۰… به‌خاطر پیشوند رد نمی‌شود',
      !/معتبر نیست/.test(r.body?.message ?? ''), `status=${r.status} msg=${r.body?.message}`)
    t('به مرحله‌ی بعد رسیده (پاسخ «قبلاً ثبت شده»)',
      r.status === 409 || /قبلاً ثبت/.test(r.body?.message ?? ''), `status=${r.status} msg=${r.body?.message}`)
  }
}

head('ثبت‌نام — شکل واقعاً نامعتبر همچنان رد می‌شود')
{
  const r = await post('/api/auth/register', {
    firstName: 'تست', lastName: 'تست', phone: '0812345678', password: 'Test@12345',
  })
  t('شماره‌ی بی‌شکل ⇒ ۴۰۰', r.status === 400, `status=${r.status} msg=${r.body?.message}`)
}

head('بازیابی رمز — ۰۹۰۰ مثل بقیه رفتار می‌کند')
{
  const { data } = await sb.from('users').select('phone').ilike('phone', '0900%').limit(1)
  const withAccount = data?.[0]?.phone
  const b = await post('/api/auth/forgot-password', { step: 'send', phone: '09008887766' })
  t('۰۹۰۰ بدون حساب ⇒ پاسخ عمومی (نه «معتبر نیست»)',
    b.status === 200 && b.body?.ok === true, `status=${b.status} msg=${b.body?.message}`)
  if (!withAccount) console.log('      (حساب ۰۹۰۰… در دیتابیس نیست)')
  else console.log(`      (حساب ۰۹۰۰ موجود است؛ ارسال واقعی در این تست انجام نمی‌شود)`)
}

head('بازیابی رمز — شماره‌ی ناموجود در سیستم (ضد شمارش کاربر)')
{
  const r = await post('/api/auth/forgot-password', { step: 'send', phone: '09121111111' })
  t('پاسخ عمومی، بدون افشای وجود/نبود حساب', r.status === 200 && r.body?.ok === true,
    `status=${r.status} msg=${r.body?.message}`)
  t('پیام «اگر … ثبت شده باشد» است', /اگر این شماره/.test(r.body?.message ?? ''), r.body?.message)
}

/* قفل IP (آستانه ۳۰) با اجراهای پیاپی همین تست پر می‌شود و آن‌وقت
   *همه‌ی* درخواست‌های ورود ۴۲۹ می‌گیرند — حتی برای شماره‌ی کاملاً نو.
   آن حالت یعنی محیط اشباع است، نه اینکه کد خراب باشد. تشخیصش ساده
   است: یک شماره‌ی تصادفی که هرگز تلاشی نداشته نباید در همان اولین
   درخواست قفل باشد. */
const ipSaturated = await (async () => {
  const probe = '0912' + String(Math.floor(1e7 + Math.random() * 9e7)).slice(0, 7)
  const r = await post('/api/auth/login', { phone: probe, password: 'Whatever@1' })
  return r.status === 429
})()
if (ipSaturated) {
  console.log('\n⚠ قفل IP فعال است (اجراهای پیاپی تست). بخش ورود این بار اجرا نمی‌شود.')
  console.log('  خود این یعنی محافظت IP کار می‌کند؛ برای تست کامل ورود کمی صبر کنید.')
}

if (!ipSaturated) {
head('ورود — پیام‌ها')
{
  /* شماره‌ای تازه برای هر اجرا، تا قفل اجرای قبلی نتیجه را عوض نکند.
     (قفل درست کار می‌کند — دقیقاً همان چیزی که پایین‌تر سنجیده می‌شود —
     ولی این تست درباره‌ی *پیام* ورود است، نه قفل.) */
  const rnd = () => '0912' + String(Math.floor(1e7 + Math.random() * 9e7)).slice(0, 7)

  const r = await post('/api/auth/login', { phone: rnd(), password: 'WrongPass@1' })
  t('حساب ناموجود ⇒ ۴۰۱ با پیام یکسان', r.status === 401 && /اطلاعات ورود صحیح نیست/.test(r.body?.message ?? ''),
    `status=${r.status} msg=${r.body?.message}`)
  t('پیام نمی‌گوید «رمز» یا «شماره» کدام غلط بود', !/رمز عبور اشتباه|شماره یافت نشد/.test(r.body?.message ?? ''), r.body?.message)

  const bad = await post('/api/auth/login', { phone: 'abc', password: 'x' })
  t('شماره‌ی بی‌شکل ⇒ ۴۰۰ (نه «رمز اشتباه»)', bad.status === 400, `status=${bad.status}`)

  const faNum = rnd().replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
  const fa = await post('/api/auth/login', { phone: faNum, password: 'WrongPass@1' })
  t('ارقام فارسی هم پذیرفته می‌شود (نه ۴۰۰)', fa.status === 401, `status=${fa.status}`)
}

head('قفل واقعاً بعد از ۳ تلاش می‌افتد و ۱۵ دقیقه است')
{
  const target = '0912' + String(Math.floor(1e7 + Math.random() * 9e7)).slice(0, 7)
  let lockedAt = 0, retryAfter = 0
  for (let i = 1; i <= 6; i++) {
    const r = await post('/api/auth/login', { phone: target, password: 'WrongPass@1' })
    if (r.status === 429 && !lockedAt) { lockedAt = i; retryAfter = r.body?.retryAfter ?? 0 }
  }
  t('قفل پس از تلاش چهارم (آستانه = ۳)', lockedAt === 4, `اولین قفل در تلاش ${lockedAt}`)
  t('مدت قفل ≈ ۱۵ دقیقه', retryAfter > 840 && retryAfter <= 900, `retryAfter=${retryAfter}s`)
  t('و قطعاً ۴ ساعت نیست', retryAfter < 3600, `retryAfter=${retryAfter}s`)
  console.log(`      قفل: ${Math.round(retryAfter / 60)} دقیقه`)
}
}  /* پایان بخش ورود (رد می‌شود اگر قفل IP فعال باشد) */

/* این یکی همیشه اجرا می‌شود: پیکربندی را از خود فایل می‌خواند، پس به
   وضعیت سرور وابسته نیست. */
head('قفل ورود — ۱۵ دقیقه‌ی ثابت، نه ۴ ساعت')
{
  const { LOGIN_WINDOWS, LOGIN_THRESHOLD } = await import('../lib/auth/login-guard.ts')
    .catch(() => ({ LOGIN_WINDOWS: null, LOGIN_THRESHOLD: null }))
  /* ماژول TS مستقیم import نمی‌شود؛ از خود فایل می‌خوانیم */
  const src = require('node:fs').readFileSync(new URL('../lib/auth/login-guard.ts', import.meta.url), 'utf8')
  const m = src.match(/LOGIN_LOCK_WINDOWS \?\? '([^']+)'/)
  const wins = (m?.[1] ?? '').split(',').map(Number)
  t('آستانه = ۳ تلاش', /LOGIN_FAIL_THRESHOLD, 3\)/.test(src), src.match(/LOGIN_FAIL_THRESHOLD[^)]*\)/)?.[0])
  t('همه‌ی پله‌ها ۹۰۰ ثانیه (۱۵ دقیقه)', wins.length > 0 && wins.every(w => w === 900), JSON.stringify(wins))
  t('هیچ پله‌ی ۴ ساعته‌ای نیست', !wins.includes(14400), JSON.stringify(wins))
}

/* ════════ ۲) سهمیه‌ی استوری ════════ */
head('سهمیه‌ی استوری — کلید اصلی روشن است')
{
  const { data } = await sb.from('app_settings').select('value').eq('key', 'stories_quota_enabled').maybeSingle()
  t('stories_quota_enabled = true', data?.value === true, JSON.stringify(data?.value))
}

head('سهمیه‌ی استوری — اعمال واقعی روی API')
{
  const { data: users } = await sb.from('users').select('id,primaryRole,secondaryRoles,phone').neq('primaryRole', 'admin').limit(5)
  const U = (users ?? []).find(u => !(u.secondaryRoles ?? []).includes('admin'))
  const at = jwt.sign({ sub: U.id, role: U.primaryRole, phone: U.phone, sid: 't', typ: 'at' }, process.env.JWT_SECRET, { expiresIn: 600 })
  const headers = { cookie: `bh_at=${at}; bh_csrf=c`, 'x-csrf-token': 'c', 'Content-Type': 'application/json' }

  const q = await req('/api/stories/quota', { headers })
  t('وضعیت سهمیه خوانده می‌شود', q.status === 200 && !!q.body?.quota, `status=${q.status}`)
  const quota = q.body?.quota
  t('enabled در پاسخ true است', quota?.enabled === true, JSON.stringify(quota))
  console.log(`      نقش: ${quota?.role ?? '—'} · مصرف: ${quota?.used} از ${quota?.limit} در هر ${quota?.period}`)

  /* نقش «user» سهمیه‌ی صفر دارد ⇒ انتشار باید رد شود */
  if (quota?.limit === 0) {
    const p = await req('/api/social/stories', {
      method: 'POST', headers,
      body: JSON.stringify({ mediaUrl: 'https://example.invalid/x.jpg', caption: 'تست سهمیه' }),
    })
    t('نقش بدون سهمیه ⇒ انتشار رد می‌شود', p.status === 403 || p.status === 429, `status=${p.status} msg=${p.body?.message}`)
    t('پیام روشن درباره‌ی سهمیه', /سهمیه|بسته|سقف/.test(p.body?.message ?? ''), p.body?.message)
  } else {
    console.log('      (این نقش سهمیه دارد؛ تست رد کردن اجرا نشد)')
  }

  const guest = await req('/api/stories/quota')
  t('مهمان ⇒ ۴۰۱', guest.status === 401, `status=${guest.status}`)

  /* ownerKey از کوئری دیگر پذیرفته نمی‌شود (نشت شمارش دیگران) */
  const other = await req('/api/stories/quota?ownerKey=09121000000', { headers })
  t('ownerKey از کوئری اثری ندارد',
    other.status === 200 && other.body?.quota?.used === quota?.used,
    `used=${other.body?.quota?.used} vs ${quota?.used}`)
}

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
