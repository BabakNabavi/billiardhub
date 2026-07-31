/* تست ماندگاری عکس پروفایل.
       node scripts/test-avatar.mjs [BASE]

   باگی که این تست نگهبانش است: عکس فقط در localStorage می‌نشست و با
   خروج/ورود دوباره ناپدید می‌شد. این‌جا اثبات می‌شود که به دیتابیس
   می‌رسد و از آن‌جا هم خوانده می‌شود.

   مقدار اولیه‌ی `avatar` در پایان دقیقاً برگردانده می‌شود. */

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
require('dotenv').config({ path: '.env.local' })
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

const BASE = process.argv[2] || 'http://localhost:3220'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`    ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: users } = await sb.from('users').select('id,primaryRole,phone,avatar').neq('primaryRole', 'admin').limit(1)
const U = users?.[0]
if (!U) { console.error('کاربر آزمایشی پیدا نشد'); process.exit(1) }

const ORIGINAL = U.avatar ?? null
console.log(`  کاربر: ${U.id.slice(0, 8)}… · avatar اولیه: ${ORIGINAL ? 'دارد' : 'ندارد'}`)

const CSRF = 'test-csrf'
const at = jwt.sign({ sub: U.id, role: U.primaryRole, phone: U.phone, sid: 't', typ: 'at' }, process.env.JWT_SECRET, { expiresIn: 600 })
const cookie = `bh_at=${at}; bh_csrf=${CSRF}`

/* یک PNG یک‌درپیک معتبر — کوچک‌ترین فایل ممکن برای تست آپلود */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

try {
  head('۱) آپلود فایل روی استوریج')
  const form = new FormData()
  form.append('file', new Blob([PNG], { type: 'image/png' }), 'avatar.png')
  form.append('path', `profiles/test-${U.id}.png`)
  const up = await fetch(BASE + '/api/upload', { method: 'POST', headers: { cookie, 'x-csrf-token': CSRF }, body: form })
  const upJson = await up.json().catch(() => ({}))
  t('آپلود موفق و نشانی برگشت', up.ok && !!upJson.url, `status=${up.status} ${JSON.stringify(upJson).slice(0, 90)}`)
  const url = upJson.url
  if (!url) throw new Error('no url')

  head('۲) ذخیره در پروفایل (همان کاری که صفحه می‌کند)')
  const patch = await fetch(BASE + '/api/users/profile', {
    method: 'PATCH',
    headers: { cookie, 'x-csrf-token': CSRF, 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar: url }),
  })
  t('PATCH موفق', patch.ok, `status=${patch.status}`)

  head('۳) واقعاً در دیتابیس نشست؟ (نه فقط در مرورگر)')
  const { data: after } = await sb.from('users').select('avatar').eq('id', U.id).maybeSingle()
  t('ستون users.avatar به‌روز شد', after?.avatar === url, `db=${String(after?.avatar).slice(0, 60)}`)

  head('۴) نشست تازه همان عکس را می‌بیند (سناریوی «رفتم و برگشتم»)')
  const fresh = jwt.sign({ sub: U.id, role: U.primaryRole, phone: U.phone, sid: 't2', typ: 'at' }, process.env.JWT_SECRET, { expiresIn: 600 })
  const me = await fetch(BASE + '/api/users/profile', { headers: { cookie: `bh_at=${fresh}` }, cache: 'no-store' })
  const meJson = await me.json().catch(() => ({}))
  const got = meJson?.profile?.avatar ?? meJson?.avatar
  t('GET پروفایل عکس را برمی‌گرداند', got === url, `got=${String(got).slice(0, 60)}`)

  head('۵) امنیت')
  const guestPatch = await fetch(BASE + '/api/users/profile', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: 'x' }),
  })
  t('مهمان نمی‌تواند آواتار عوض کند', guestPatch.status === 401, `status=${guestPatch.status}`)

  const guestUp = await fetch(BASE + '/api/upload', { method: 'POST', body: new FormData() })
  t('مهمان نمی‌تواند آپلود کند', guestUp.status === 401 || guestUp.status === 403, `status=${guestUp.status}`)

  /* فیلدی که در فهرست سفید نیست نباید نوشته شود */
  const escalate = await fetch(BASE + '/api/users/profile', {
    method: 'PATCH', headers: { cookie, 'x-csrf-token': CSRF, 'Content-Type': 'application/json' },
    body: JSON.stringify({ primaryRole: 'admin', national_id_verified: true }),
  })
  const { data: chk } = await sb.from('users').select('primaryRole,national_id_verified').eq('id', U.id).maybeSingle()
  t('نقش از راه PATCH بالا نمی‌رود', chk?.primaryRole === U.primaryRole,
    `role=${chk?.primaryRole} (بود ${U.primaryRole}) status=${escalate.status}`)

} finally {
  head('بازگردانی وضعیت اولیه')
  await sb.from('users').update({ avatar: ORIGINAL }).eq('id', U.id)
  const { data: back } = await sb.from('users').select('avatar').eq('id', U.id).maybeSingle()
  t('avatar به مقدار اولیه برگشت', (back?.avatar ?? null) === ORIGINAL, `now=${String(back?.avatar).slice(0, 40)}`)
}

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
