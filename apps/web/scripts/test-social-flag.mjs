/* تستِ پرچمِ «تعاملاتِ اجتماعی» + مشاهده‌ی عمومیِ استوری.
       node scripts/test-social-flag.mjs [BASE]

   نشست‌ها این‌جا با همان JWT_SECRETِ محلی امضا می‌شوند (هیچ مقداری چاپ
   نمی‌شود) تا مسیرهای احرازشده هم واقعاً تست شوند، نه فقط مسیرِ مهمان.
   شناسه‌ی کاربران هم فقط خوانده می‌شود؛ هیچ کاربری ساخته/حذف نمی‌شود. */

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
require('dotenv').config({ path: '.env.local' })
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

const BASE = process.argv[2] || 'http://localhost:3120'
const FLAG = 'social_interactions_enabled'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

/* ── نشست‌های آزمایشی ─────────────────────────────────────────── */
const sign = u => jwt.sign(
  { sub: u.id, role: u.role ?? u.primaryRole, phone: u.phone, sid: 'test-' + u.id.slice(0, 8), typ: 'at' },
  process.env.JWT_SECRET, { expiresIn: 600 },
)
const CSRF = 'test-csrf-token'
const authHeaders = tok => ({
  cookie: `bh_at=${tok}; bh_csrf=${CSRF}`,
  'x-csrf-token': CSRF,
  'Content-Type': 'application/json',
})

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

/* یک ادمینِ واقعی و یک کاربرِ عادیِ واقعی — فقط خوانده می‌شوند */
const { data: admins } = await sb.from('users').select('id,primaryRole,phone').eq('primaryRole', 'admin').limit(1)
const { data: users } = await sb.from('users').select('id,primaryRole,secondaryRoles,phone').neq('primaryRole', 'admin').limit(5)
const ADMIN = admins?.[0]
/* کاربری که در هیچ‌کدام از دو ستون ادمین نیست */
const USER = (users ?? []).find(u => !(u.secondaryRoles ?? []).includes('admin'))
if (!ADMIN || !USER) { console.error('کاربرِ آزمایشی پیدا نشد'); process.exit(1) }
console.log(`  ادمین: ${ADMIN.id.slice(0, 8)}…  ·  کاربرِ عادی: ${USER.id.slice(0, 8)}… (نقش: ${USER.primaryRole})`)

const AT_ADMIN = sign(ADMIN)
const AT_USER = sign(USER)

/* وضعیتِ اولیه را نگه می‌داریم تا در پایان دقیقاً برگردانده شود */
const { data: before } = await sb.from('app_settings').select('value').eq('key', FLAG).maybeSingle()
const ORIGINAL = before ? before.value : null
console.log(`  وضعیتِ اولیه‌ی پرچم در دیتابیس: ${ORIGINAL === null ? '«ردیفی وجود ندارد»' : JSON.stringify(ORIGINAL)}`)

/* ── ابزار ─────────────────────────────────────────────────────── */
const req = async (path, init = {}) => {
  const r = await fetch(BASE + path, init)
  let body = null
  try { body = await r.json() } catch { /* بدنه‌ی غیرJSON */ }
  return { status: r.status, body }
}

const setFlag = async on => {
  const r = await req('/api/admin/settings', {
    method: 'PATCH', headers: authHeaders(AT_ADMIN), body: JSON.stringify({ [FLAG]: on }),
  })
  /* کشِ ۳۰ ثانیه‌ای در همان پروسه است و مسیرِ نوشتن پاکش می‌کند */
  return r
}
const flagState = async () => (await req('/api/features')).body?.socialInteractions

/* ════════════════════════════════════════════════════════════════
   بخش ۸ — امنیتِ تغییرِ پرچم
   ════════════════════════════════════════════════════════════════ */
head('بخش ۸ — چه کسی می‌تواند پرچم را عوض کند')
{
  const guest = await req('/api/admin/settings', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [FLAG]: true }),
  })
  t('مهمان ⇒ ۴۰۱', guest.status === 401, `status=${guest.status}`)

  const normal = await req('/api/admin/settings', {
    method: 'PATCH', headers: authHeaders(AT_USER), body: JSON.stringify({ [FLAG]: true }),
  })
  t(`کاربرِ عادی (${USER.primaryRole}) ⇒ ۴۰۳`, normal.status === 403, `status=${normal.status}`)

  const guestRead = await req('/api/admin/settings')
  t('خواندنِ تنظیمات توسط مهمان ⇒ ۴۰۱', guestRead.status === 401, `status=${guestRead.status}`)

  const userRead = await req('/api/admin/settings', { headers: authHeaders(AT_USER) })
  t('خواندنِ تنظیمات توسط کاربرِ عادی ⇒ ۴۰۳', userRead.status === 403, `status=${userRead.status}`)

  /* نقش از توکن می‌آید ولی مرجعِ نهایی دیتابیس است — نقشِ جعلی در JWT
     نباید کافی باشد (isAdmin مستقیم از جدولِ users می‌خواند) */
  const spoof = sign({ ...USER, role: 'admin' })
  const spoofed = await req('/api/admin/settings', {
    method: 'PATCH', headers: authHeaders(spoof), body: JSON.stringify({ [FLAG]: true }),
  })
  t('نقشِ admin جعل‌شده در توکن ⇒ باز هم ۴۰۳', spoofed.status === 403, `status=${spoofed.status}`)

  const ok = await setFlag(false)
  t('ادمینِ واقعی ⇒ موفق', ok.status === 200, `status=${ok.status}`)
}

/* ════════════════════════════════════════════════════════════════
   وضعیتِ خاموش
   ════════════════════════════════════════════════════════════════ */
head('پرچم = خاموش — وضعیتِ عمومی')
await setFlag(false)
t('/api/features می‌گوید خاموش', (await flagState()) === false)

head('بخش ۲ و ۱۳ — مهمان باید استوری ببیند')
{
  const s = await req('/api/social/stories')
  t('GET استوری‌های عمومی ⇒ ۲۰۰', s.status === 200, `status=${s.status}`)
  t('پاسخ آرایه است', Array.isArray(s.body), typeof s.body)

  /* هیچ کلیدِ خامِ مالک (شماره‌ی موبایل) نباید به مهمان برسد */
  const raw = JSON.stringify(s.body ?? [])
  const phoneLeak = /"ownerKey"\s*:\s*"09\d{9}"/.test(raw)
  t('کلیدِ خامِ مالک (شماره‌ی موبایل) لو نمی‌رود', !phoneLeak)
  const privateLeak = /"(password|passwordHash|nationalId|email|refreshToken|token)"/i.test(raw)
  t('هیچ فیلدِ خصوصیِ دیگری در پاسخ نیست', !privateLeak)
  console.log(`      (${Array.isArray(s.body) ? s.body.length : 0} استوریِ زنده)`)
}

head('بخش ۲.F — مهمان نباید بتواند چیزی بسازد')
{
  const create = await req('/api/social/stories', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaUrl: 'https://example.invalid/x.jpg', caption: 'تست' }),
  })
  t('ساختِ استوری توسط مهمان ⇒ ۴۰۱', create.status === 401, `status=${create.status}`)

  const dm = await req('/api/social/dm', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: { key: '09120000000' }, text: 'سلام', kind: 'text' }),
  })
  t('DM توسط مهمان ⇒ بسته', dm.status === 401 || dm.status === 403, `status=${dm.status}`)

  const like = await req('/api/social/dm', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: { key: '09120000000' }, text: '❤️', kind: 'like' }),
  })
  t('لایک توسط مهمان ⇒ بسته', like.status === 401 || like.status === 403, `status=${like.status}`)

  const notif = await req('/api/social/notifications')
  t('اعلان‌ها توسط مهمان ⇒ بسته', notif.status === 401 || notif.status === 403, `status=${notif.status}`)
}

head('بخش ۱۴ — کاربرِ لاگین با پرچمِ خاموش')
{
  const view = await req('/api/social/stories')
  t('دیدنِ استوری همچنان کار می‌کند', view.status === 200, `status=${view.status}`)

  for (const [label, kind] of [['پیام', 'text'], ['پاسخ به استوری', 'reply'], ['لایک', 'like'], ['ری‌اکشن', 'reaction']]) {
    const r = await req('/api/social/dm', {
      method: 'POST', headers: authHeaders(AT_USER),
      body: JSON.stringify({ to: { key: ADMIN.phone || ADMIN.id }, text: '❤️', kind, storyRef: 'st-test' }),
    })
    t(`${label} ⇒ ۴۰۳ با featureDisabled`, r.status === 403 && r.body?.featureDisabled === true,
      `status=${r.status} body=${JSON.stringify(r.body)}`)
  }

  const list = await req('/api/social/dm', { headers: authHeaders(AT_USER) })
  t('خواندنِ لیستِ گفتگوها ⇒ ۴۰۳', list.status === 403, `status=${list.status}`)

  const del = await req('/api/social/dm?conv=a__b', { method: 'DELETE', headers: authHeaders(AT_USER) })
  t('حذفِ گفتگو ⇒ ۴۰۳', del.status === 403, `status=${del.status}`)

  const n = await req('/api/social/notifications', { headers: authHeaders(AT_USER) })
  t('اعلان‌های سوشال ⇒ ۴۰۳', n.status === 403, `status=${n.status}`)

  const nr = await req('/api/social/notifications', {
    method: 'POST', headers: authHeaders(AT_USER), body: JSON.stringify({ action: 'read' }),
  })
  t('خوانده‌شده‌کردنِ اعلان ⇒ ۴۰۳', nr.status === 403, `status=${nr.status}`)

  /* پاسخ نباید جزئیاتِ داخلی لو بدهد */
  const leak = JSON.stringify((await req('/api/social/dm', { headers: authHeaders(AT_USER) })).body)
  t('پیامِ خطا نامِ پرچم/جدول را لو نمی‌دهد',
    !/app_settings|social_interactions_enabled|supabase/i.test(leak), leak)
}

head('بخش ۱۸ — بدونِ درخواستِ اضافه وقتی خاموش است')
{
  /* پرچم عمداً کش نمی‌شود: هر درجه‌ای از کهنگی یعنی کاربر قابلیتی را
     که ادمین تازه روشن کرده نمی‌بیند. (نسخه‌ی اولِ این هدر
     `stale-while-revalidate` داشت و دقیقاً همین را می‌ساخت.) */
  const r = await fetch(BASE + '/api/features')
  const cc = r.headers.get('cache-control') || ''
  t('/api/features نسخه‌ی کهنه سرو نمی‌کند', /no-store/.test(cc) && !/stale-while-revalidate/.test(cc), cc)
}

/* ════════════════════════════════════════════════════════════════
   بخش ۱۵ — روشن‌کردنِ دوباره: معماری باید سالم باشد
   ════════════════════════════════════════════════════════════════ */
head('بخش ۱۵ — پرچم = روشن')
await setFlag(true)
t('/api/features می‌گوید روشن', (await flagState()) === true)
{
  const list = await req('/api/social/dm', { headers: authHeaders(AT_USER) })
  t('لیستِ گفتگوها دوباره باز شد (۲۰۰)', list.status === 200, `status=${list.status}`)
  t('پاسخ همان شکلِ قبلی است (آرایه)', Array.isArray(list.body), typeof list.body)

  const n = await req('/api/social/notifications', { headers: authHeaders(AT_USER) })
  t('اعلان‌ها دوباره باز شد (۲۰۰)', n.status === 200, `status=${n.status}`)

  const guest = await req('/api/social/dm')
  t('ولی مهمان همچنان ۴۰۱ می‌گیرد (authz سالم)', guest.status === 401, `status=${guest.status}`)

  const other = await req('/api/social/dm?conv=someoneelse__anotherguy', { headers: authHeaders(AT_USER) })
  t('گفتگوی دیگران ⇒ ۴۰۳ (IDOR بسته)', other.status === 403, `status=${other.status}`)

  const stories = await req('/api/social/stories')
  t('استوری‌ها هنوز عمومی‌اند', stories.status === 200, `status=${stories.status}`)
}

/* ════════════════════════════════════════════════════════════════
   بازگرداندنِ وضعیتِ نهایی: خاموش
   ════════════════════════════════════════════════════════════════ */
head('وضعیتِ نهایی')
await setFlag(false)
t('پرچم روی خاموش تنظیم شد', (await flagState()) === false)
{
  const r = await req('/api/social/dm', {
    method: 'POST', headers: authHeaders(AT_USER),
    body: JSON.stringify({ to: { key: ADMIN.phone || ADMIN.id }, text: 'x', kind: 'text' }),
  })
  t('تعاملات دوباره بسته است', r.status === 403)
  const s = await req('/api/social/stories')
  t('و استوری همچنان برای مهمان باز است', s.status === 200)
}

/* داده‌ها دست‌نخورده مانده‌اند؟ */
head('بخش ۱۲ — هیچ داده‌ای حذف نشد')
{
  const { count, error } = await sb.from('app_settings').select('key', { count: 'exact', head: true })
  t('جدولِ app_settings سرِ جایش است', !error && typeof count === 'number', String(error?.message))
  console.log(`      ${count} کلیدِ تنظیمات در دیتابیس`)
}

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق`)
console.log(`  وضعیتِ نهاییِ پرچم: خاموش (کلیدِ اولیه: ${ORIGINAL === null ? 'نبود' : JSON.stringify(ORIGINAL)})\n`)
process.exit(fail ? 1 : 0)
