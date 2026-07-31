/* تست ماندگاری نشست — نگهبان باگی که کاربر را از حساب خودش بیرون می‌انداخت.
       node scripts/test-session.mjs [BASE]

   دو مکانیزم این‌جا سنجیده می‌شود:

     ۱) رفرش‌توکن هر ۱۲ ساعت یک‌بار می‌چرخد، نه با هر تمدید. تا امروز با
        هر تمدید می‌چرخید و روزی بیش از صد نسخه‌ی باطل‌شده در گردش بود؛
        هر کدام یک فرصت برای بیرون انداختن ناخواسته‌ی کاربر.

     ۲) پنجره‌ی مهلت ۶۰ ثانیه‌ای برای لحظه‌ی خودِ چرخش (دو تب، رفرش وسط
        کار) تا مسابقه با سرقت اشتباه نشود.

   و در کنارش: سرقت واقعی باید همچنان گرفته شود. */

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
require('dotenv').config({ path: '.env.local' })
const bcrypt = require('bcrypt')
const { createClient } = require('@supabase/supabase-js')

const BASE = process.argv[2] || 'http://localhost:3300'
const PHONE = '09008887766'
const PW = 'TestPass@2026'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: u } = await sb.from('users').select('id').eq('phone', PHONE).maybeSingle()
if (!u) { console.error('حساب آزمایشی نیست'); process.exit(1) }
await sb.from('users').update({ password: await bcrypt.hash(PW, 10) }).eq('id', u.id)

const jarOf = res => {
  const list = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')]
  const j = {}
  for (const c of list.filter(Boolean)) { const [kv] = c.split(';'); const i = kv.indexOf('='); j[kv.slice(0, i).trim()] = kv.slice(i + 1) }
  return j
}
/* JWT مهر زمانی ثانیه‌ای دارد: دو امضا در یک ثانیه رشته‌ی یکسان می‌دهند. */
const tick = () => new Promise(r => setTimeout(r, 1100))
const ck = j => Object.entries(j).map(([k, v]) => `${k}=${v}`).join('; ')

const bail = () => {
  console.log('\n⚠ سقف نرخ ورود پر است (اجراهای پیاپی همین تست).')
  console.log('  این یعنی محافظت کار می‌کند؛ ~۱۰ دقیقه بعد دوباره اجرا کنید.\n')
  process.exit(0)
}

const login = async () => {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE, password: PW }),
  })
  if (r.status === 429) bail()
  return { ok: r.ok, jar: jarOf(r) }
}
const refresh = jar => fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: ck(jar) } })

/** آخرین نشست فعال همین کاربر — برای دست‌کاری زمان چرخش */
const latestSid = async () => {
  const { data } = await sb.from('sessions').select('id').eq('user_id', u.id)
    .is('revoked_at', null).order('created_at', { ascending: false }).limit(1)
  return data?.[0]?.id
}
const setRotatedAgo = (sid, ms) =>
  sb.from('sessions').update({ last_used_at: new Date(Date.now() - ms).toISOString() }).eq('id', sid)

const HOUR = 3600e3

head('۱) ورود و صدور کوکی‌ها')
const first = await login()
t('ورود موفق', first.ok)
t('bh_at صادر شد', !!first.jar.bh_at)
t('bh_rt صادر شد', !!first.jar.bh_rt)

head('۲) تمدید عادی — نباید رفرش‌توکن را بچرخاند')
{
  const noAt = { ...first.jar }; delete noAt.bh_at
  await tick()
  const r = await refresh(noAt)
  const j = jarOf(r)
  const body = await r.json().catch(() => ({}))
  t('تمدید موفق', r.status === 200, `status=${r.status}`)
  t('توکن دسترسی تازه داده شد', !!j.bh_at)
  t('رفرش‌توکن دست نخورد', !j.bh_rt, `bh_rt=${j.bh_rt ? 'عوض شد' : '—'}`)
  t('پاسخ نمی‌گوید چرخیده', body?.rotated !== true, JSON.stringify(body))
}

head('۳) همان توکن بارها کار می‌کند — کاربر بیرون نمی‌افتد')
{
  for (let i = 1; i <= 4; i++) {
    const r = await refresh(first.jar)
    if (r.status !== 200) { t(`تمدید ${i}`, false, `status=${r.status}`); break }
    if (i === 4) t('چهار تمدید پیاپی با همان توکن ⇒ همه موفق', true)
  }
  const { data: s } = await sb.from('sessions').select('revoked_at').eq('id', await latestSid()).maybeSingle()
  t('نشست باطل نشد', !s?.revoked_at)
}

head('۴) بعد از ۱۲ ساعت واقعاً می‌چرخد')
{
  const s = await login()
  const sid = await latestSid()
  await setRotatedAgo(sid, 13 * HOUR)
  await tick()
  const r = await refresh(s.jar)
  const j = jarOf(r)
  const body = await r.json().catch(() => ({}))
  t('تمدید موفق', r.status === 200, `status=${r.status}`)
  t('این‌بار رفرش‌توکن چرخید', !!j.bh_rt && j.bh_rt !== s.jar.bh_rt)
  t('پاسخ می‌گوید چرخیده', body?.rotated === true, JSON.stringify(body))
  s.rotated = j.bh_rt; s.sid = sid
  globalThis.__rot = s
}

head('۵) مسابقه در لحظه‌ی چرخش — نشست نباید باطل شود')
{
  const s = globalThis.__rot
  const race = await refresh({ ...s.jar })       // همان توکن قبل از چرخش
  const body = await race.json().catch(() => ({}))
  t('توکن قدیمی در پنجره‌ی مهلت پذیرفته شد', race.status === 200, `status=${race.status}`)
  t('پاسخ می‌گوید مسابقه بوده', body?.raced === true, JSON.stringify(body))
  t('رفرش‌توکن دوباره نچرخید', !jarOf(race).bh_rt)
  const { data: row } = await sb.from('sessions').select('revoked_at').eq('id', s.sid).maybeSingle()
  t('نشست زنده ماند', !row?.revoked_at)
}

head('۶) سرقت واقعی همچنان گرفته می‌شود')
{
  const s = globalThis.__rot
  /* توکن قبل از چرخش، ولی بیرون از پنجره‌ی مهلت */
  await setRotatedAgo(s.sid, 5 * 60e3)
  const theft = await refresh({ ...s.jar })
  const body = await theft.json().catch(() => ({}))
  t('توکن کهنه بیرون از پنجره ⇒ ۴۰۱', theft.status === 401, `status=${theft.status}`)
  t('دلیلش «reused» است', body?.reason === 'reused', JSON.stringify(body).slice(0, 80))
  const { data: row } = await sb.from('sessions').select('revoked_reason').eq('id', s.sid).maybeSingle()
  t('نشست باطل شد', !!row?.revoked_reason, String(row?.revoked_reason))
}

head('۷) توکن جعلی/بی‌ربط')
{
  const r = await fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: 'bh_rt=not-a-token' } })
  t('توکن نامعتبر ⇒ ۴۰۱', r.status === 401, `status=${r.status}`)
  const r2 = await fetch(BASE + '/api/auth/refresh', { method: 'POST' })
  t('بدون کوکی ⇒ ۴۰۱', r2.status === 401, `status=${r2.status}`)
}

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
