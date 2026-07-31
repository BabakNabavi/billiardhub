/* تست ماندگاری نشست — نگهبان باگی که کاربر را از حساب خودش بیرون می‌انداخت.
       node scripts/test-session.mjs [BASE]

   رفرش‌توکن با هر استفاده می‌چرخد. اگر دو درخواست هم‌زمان برسند (دو تب،
   رفرش صفحه وسط چرخش)، درخواست دوم توکن قدیمی را می‌فرستد و سرور آن را
   «سرقت» می‌دید و کل نشست را باطل می‌کرد. */

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
require('dotenv').config({ path: '.env.local' })
const bcrypt = require('bcrypt')
const { createClient } = require('@supabase/supabase-js')

const BASE = process.argv[2] || 'http://localhost:3250'
const PHONE = '09008887766'
const PW = 'TestPass@2026'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

/* حساب آزمایشی خودمان با رمز مشخص — هیچ حساب واقعی لمس نمی‌شود */
const { data: u } = await sb.from('users').select('id').eq('phone', PHONE).maybeSingle()
if (!u) { console.error('حساب آزمایشی نیست'); process.exit(1) }
await sb.from('users').update({ password: await bcrypt.hash(PW, 10) }).eq('id', u.id)

const jarOf = res => {
  const list = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')]
  const j = {}
  for (const c of list.filter(Boolean)) { const [kv] = c.split(';'); const i = kv.indexOf('='); j[kv.slice(0, i).trim()] = kv.slice(i + 1) }
  return j
}
/* JWT مهر زمانی ثانیه‌ای دارد: دو امضا در یک ثانیه رشته‌ی یکسان
   می‌دهند و اصلاً چرخشی رخ نمی‌دهد. برای اینکه تست *واقعاً* چرخش را
   بسنجد، بین مراحل یک ثانیه صبر می‌کنیم. */
const tick = () => new Promise(r => setTimeout(r, 1100))
const ck = j => Object.entries(j).map(([k, v]) => `${k}=${v}`).join('; ')

const login = async () => {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE, password: PW }),
  })
  return { ok: r.ok, jar: jarOf(r) }
}

head('۱) ورود و صدور کوکی‌ها')
const first = await login()
t('ورود موفق', first.ok)
t('bh_at صادر شد', !!first.jar.bh_at)
t('bh_rt صادر شد', !!first.jar.bh_rt)

head('۲) بازگشت پس از مدتی — فقط bh_rt در دست است')
{
  const noAt = { ...first.jar }; delete noAt.bh_at
  const r = await fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: ck(noAt) } })
  const j = jarOf(r)
  t('تمدید موفق', r.status === 200, `status=${r.status}`)
  t('bh_at تازه گرفت', !!j.bh_at)
  t('bh_rt چرخید', !!j.bh_rt && j.bh_rt !== first.jar.bh_rt)
  first.jar.bh_at = j.bh_at; first.jar.bh_rt = j.bh_rt
}

head('۳) مسابقه — همان باگی که کاربر را بیرون می‌انداخت')
{
  /* توکن *قدیمی* را دوباره می‌فرستیم؛ دقیقاً کاری که تب دوم می‌کند */
  const s2 = await login()
  const oldRt = s2.jar.bh_rt
  await tick()
  // یک‌بار مصرفش کن تا واقعاً بچرخد
  const rot = await fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: ck(s2.jar) } })
  t('چرخش انجام شد', jarOf(rot).bh_rt !== oldRt, 'توکن عوض نشد')
  // حالا همان توکن قدیمی را دوباره بفرست (مسابقه)
  const race = await fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: ck({ ...s2.jar, bh_rt: oldRt }) } })
  const body = await race.json().catch(() => ({}))
  t('توکن قدیمی در پنجره‌ی مهلت پذیرفته می‌شود', race.status === 200, `status=${race.status} ${JSON.stringify(body).slice(0, 90)}`)
  t('پاسخ می‌گوید مسابقه بوده', body?.raced === true, JSON.stringify(body))
  t('توکن دسترسی تازه داده شد', !!jarOf(race).bh_at)
  t('رفرش‌توکن دوباره نچرخید (وگرنه حلقه‌ی بی‌پایان)', !jarOf(race).bh_rt)

  /* و مهم‌تر: نشست باطل نشده باشد */
  const after = await fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: ck(s2.jar) } })
  t('نشست هنوز زنده است', after.status === 200, `status=${after.status}`)
}

head('۴) سرقت واقعی هنوز گرفته می‌شود')
{
  const s = await login()
  const oldRt = s.jar.bh_rt
  await tick()
  await fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: ck(s.jar) } })
  /* پنجره‌ی مهلت یک دقیقه است؛ با دست‌کاری last_used_at به گذشته،
     همان توکن قدیمی باید «سرقت» تشخیص داده شود. */
  const { data: rows } = await sb.from('sessions').select('id').eq('user_id', u.id)
    .is('revoked_at', null).order('created_at', { ascending: false }).limit(1)
  const sid = rows?.[0]?.id
  await sb.from('sessions').update({ last_used_at: new Date(Date.now() - 5 * 60_000).toISOString() }).eq('id', sid)

  const theft = await fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: ck({ ...s.jar, bh_rt: oldRt }) } })
  const jb = await theft.json().catch(() => ({}))
  t('توکن کهنه بیرون از پنجره ⇒ ۴۰۱', theft.status === 401, `status=${theft.status}`)
  t('دلیلش «reused» است', jb?.reason === 'reused', JSON.stringify(jb).slice(0, 90))

  const { data: rev } = await sb.from('sessions').select('revoked_reason').eq('id', sid).maybeSingle()
  t('نشست باطل شد', !!rev?.revoked_reason, String(rev?.revoked_reason))
}

head('۵) توکن جعلی/بی‌ربط')
{
  const r = await fetch(BASE + '/api/auth/refresh', { method: 'POST', headers: { cookie: 'bh_rt=not-a-token' } })
  t('توکن نامعتبر ⇒ ۴۰۱', r.status === 401, `status=${r.status}`)
  const r2 = await fetch(BASE + '/api/auth/refresh', { method: 'POST' })
  t('بدون کوکی ⇒ ۴۰۱', r2.status === 401, `status=${r2.status}`)
}

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
