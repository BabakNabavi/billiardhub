/* مسیرِ مثبتِ پنلِ ادمین — با یک نشستِ واقعیِ ادمین.
       node scripts/test-admin-positive.mjs

   ── چرا این تست جدا از test-admin-manage است ──
   آن یکی می‌سنجد که غیرادمین *نتواند*؛ این یکی می‌سنجد که ادمین
   *بتواند*. برای دومی نشستِ ادمین لازم است و حسابِ آزمایشیِ ما
   `club_owner` است.

   ── چه می‌کند و چطور جمع می‌کند ──
   ۱) نقشِ فعلیِ حسابِ آزمایشی را برمی‌دارد و نگه می‌دارد.
   ۲) موقتاً ادمینش می‌کند (با اجازه‌ی صریحِ صاحبِ سامانه).
   ۳) تست‌ها را می‌زند.
   ۴) در `finally` نقش را دقیقاً به همان حالتِ اول برمی‌گرداند — حتی
      اگر تست وسطِ کار بترکد. بعد هم بررسی می‌کند که برگشت انجام شده.

   هر مسابقه‌ای که این تست می‌سازد را خودش پاک می‌کند. هیچ رکوردِ
   واقعیِ دیگری دست نمی‌خورد. */

import fs from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import jwt from 'jsonwebtoken'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BH_BASE ?? 'http://localhost:3000'
const TEST_PHONE = process.env.BH_TEST_PHONE ?? '09001327283'

const env = Object.fromEntries(
  fs.readFileSync(join(here, '..', '.env.local'), 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY, SECRET = env.JWT_SECRET
if (!U || !K || !SECRET) { console.log('  ✗ .env.local ناقص است'); process.exit(1) }

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`) }
const head = s => console.log(`\n■ ${s}`)

const rest = async (path, init) => {
  const r = await fetch(`${U}/rest/v1/${path}`, {
    ...(init ?? {}),
    headers: { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json',
               Prefer: 'return=representation', ...(init?.headers ?? {}) },
  })
  const txt = await r.text()
  return { status: r.status, body: txt ? JSON.parse(txt) : null }
}

const me = (await rest(`users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.${TEST_PHONE}`)).body[0]
if (!me) { console.log(`  ✗ حسابِ آزمایشی ${TEST_PHONE} پیدا نشد`); process.exit(1) }

const ORIGINAL = { primaryRole: me.primaryRole, secondaryRoles: me.secondaryRoles }
console.log(`\n  حسابِ آزمایشی: ${me.phone}`)
console.log(`  نقشِ اصلی (باید در پایان برگردد): ${ORIGINAL.primaryRole} · ${JSON.stringify(ORIGINAL.secondaryRoles)}`)

const token = jwt.sign({ sub: me.id, role: 'admin', phone: me.phone }, SECRET, { expiresIn: '30m' })
const api = async (path, init) => {
  const r = await fetch(BASE + path, {
    ...(init ?? {}),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  let body = null; try { body = await r.json() } catch { /* بدنه‌ی خالی */ }
  return { status: r.status, body }
}

let createdTournamentId = null

try {
  /* ── ارتقای موقت ── */
  head('ارتقای موقتِ نقش')
  const up = await rest(`users?id=eq.${me.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ primaryRole: 'admin', secondaryRoles: [...new Set([...(ORIGINAL.secondaryRoles ?? []), 'admin'])] }),
  })
  t('حساب موقتاً ادمین شد', up.status === 200 && up.body?.[0]?.primaryRole === 'admin', `HTTP ${up.status}`)

  /* ── مسابقات ── */
  head('مسابقات — مسیرِ مثبت')
  const list = await api('/api/admin/tournaments')
  t('فهرستِ مسابقات باز می‌شود', list.status === 200, `HTTP ${list.status}`)
  const clubs = list.body?.clubs ?? []
  t('فهرستِ باشگاه‌ها برای فرمِ ساخت می‌آید', clubs.length > 0, `${clubs.length}`)

  const beforeCount = (list.body?.tournaments ?? []).length

  const created = await api('/api/admin/tournaments', {
    method: 'POST',
    body: JSON.stringify({
      clubId: clubs[0]?.id, title: 'zz-تستِ-خودکار-حذف-می‌شود',
      entryFee: 150000, maxPlayers: 8,
    }),
  })
  createdTournamentId = created.body?.tournament?.id ?? null
  t('ادمین مسابقه می‌سازد', created.status === 201 && !!createdTournamentId, `HTTP ${created.status} ${JSON.stringify(created.body).slice(0, 120)}`)
  t('مسابقه‌ی تازه پیش‌فرض ثبت‌نام‌باز است',
    created.body?.tournament?.status === 'registration_open', created.body?.tournament?.status)
  t('ورودی و ظرفیت همان است که فرستاده شد',
    created.body?.tournament?.entry_fee === 150000 && created.body?.tournament?.max_players === 8,
    `${created.body?.tournament?.entry_fee} / ${created.body?.tournament?.max_players}`)

  const list2 = await api('/api/admin/tournaments')
  t('مسابقه‌ی تازه در فهرست دیده می‌شود',
    (list2.body?.tournaments ?? []).some(x => x.id === createdTournamentId), '')
  t('شمارِ مسابقات یکی زیاد شد',
    (list2.body?.tournaments ?? []).length === beforeCount + 1,
    `${beforeCount} → ${(list2.body?.tournaments ?? []).length}`)

  const patched = await api('/api/admin/tournaments', {
    method: 'PATCH', body: JSON.stringify({ id: createdTournamentId, status: 'registration_closed' }),
  })
  t('ادمین وضعیتِ مسابقه را عوض می‌کند',
    patched.status === 200 && patched.body?.tournament?.status === 'registration_closed',
    `HTTP ${patched.status}`)

  const badStatus = await api('/api/admin/tournaments', {
    method: 'PATCH', body: JSON.stringify({ id: createdTournamentId, status: 'چرت' }),
  })
  t('وضعیتِ نامعتبر رد می‌شود', badStatus.status === 400, `HTTP ${badStatus.status}`)

  /* حذفِ مسابقه‌ای که پول جابه‌جا کرده باید رد شود */
  const paidReg = (await rest('tournament_registrations?select=tournament_id&payment_status=eq.PAID&limit=1')).body
  if (paidReg?.length) {
    const guarded = await api(`/api/admin/tournaments?id=${paidReg[0].tournament_id}`, { method: 'DELETE' })
    t('مسابقه‌ی دارای ثبت‌نامِ پرداخت‌شده حذف نمی‌شود', guarded.status === 409, `HTTP ${guarded.status}`)
  } else {
    console.log('  ⏭  محافظِ «حذفِ مسابقه‌ی پولی» آزموده نشد — هیچ ثبت‌نامِ PAID در دیتابیس نیست')
  }

  const del = await api(`/api/admin/tournaments?id=${createdTournamentId}`, { method: 'DELETE' })
  t('ادمین مسابقه‌ی بی‌ثبت‌نام را حذف می‌کند', del.status === 200, `HTTP ${del.status}`)
  const gone = (await rest(`tournaments?select=id&id=eq.${createdTournamentId}`)).body
  t('مسابقه واقعاً از دیتابیس رفت', gone.length === 0, `${gone.length} ردیف مانده`)
  if (gone.length === 0) createdTournamentId = null

  /* ── دسترسیِ ادمین ── */
  head('دسترسیِ ادمین — مسیرِ مثبت')
  const admins = await api('/api/admin/grant-admin')
  t('فهرستِ ادمین‌ها باز می‌شود', admins.status === 200, `HTTP ${admins.status}`)
  t('حسابِ آزمایشی حالا در فهرستِ ادمین‌هاست',
    (admins.body?.admins ?? []).some(u => u.id === me.id), '')

  const search = await api(`/api/admin/grant-admin?q=${TEST_PHONE}`)
  t('جست‌وجو با شماره کار می‌کند',
    (search.body?.results ?? []).some(u => u.id === me.id),
    JSON.stringify(search.body?.results ?? []).slice(0, 80))

  const short = await api('/api/admin/grant-admin?q=ab')
  t('جست‌وجوی کمتر از سه نویسه چیزی برنمی‌گرداند',
    (short.body?.results ?? []).length === 0, '')

  const selfRevoke = await api('/api/admin/grant-admin', {
    method: 'POST', body: JSON.stringify({ userId: me.id, grant: false }),
  })
  t('کسی نمی‌تواند دسترسیِ ادمینِ خودش را بردارد', selfRevoke.status === 409, `HTTP ${selfRevoke.status}`)

  const noop = await api('/api/admin/grant-admin', {
    method: 'POST', body: JSON.stringify({ userId: me.id, grant: true }),
  })
  t('اعطای دوباره به ادمینِ فعلی بی‌اثر است', noop.status === 200 && noop.body?.unchanged === true,
    `HTTP ${noop.status}`)

  const ghost = await api('/api/admin/grant-admin', {
    method: 'POST', body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000', grant: true }),
  })
  t('کاربرِ ناموجود ۴۰۴ می‌گیرد', ghost.status === 404, `HTTP ${ghost.status}`)

  console.log('  ⏭  چرخه‌ی کاملِ «اعطا به کاربرِ دیگر سپس لغو» آزموده نشد —')
  console.log('     هدفش باید یک کاربرِ واقعیِ دیگر باشد و این تست حق ندارد')
  console.log('     نقشِ کاربرِ ثالث را عوض کند.')

  /* ── تأییدِ باشگاه بدونِ تیکِ آبی ── */
  head('تأیید باشگاه بدونِ تیکِ آبی')
  const club = (await rest('clubs?select=id,name,"verificationStatus","isActive"&limit=1')).body[0]
  const before = { st: club.verificationStatus, active: club.isActive }
  const appr = await api(`/api/clubs/${club.id}`, {
    method: 'PUT', body: JSON.stringify({ verificationStatus: 'approved' }),
  })
  if (appr.status === 200) {
    const after = (await rest(`clubs?select="verificationStatus","isActive"&id=eq.${club.id}`)).body[0]
    t('وضعیت روی approved نشست', after.verificationStatus === 'approved', after.verificationStatus)
    t('باشگاه منتشر ماند (isActive)', after.isActive === true, String(after.isActive))

    const pub = await (await fetch(`${BASE}/api/clubs`)).json()
    const row = pub.find(c => c.id === club.id)
    t('کارتِ باشگاه در فهرستِ عمومی دیده می‌شود', !!row, 'در فهرست نبود')
    t('ولی تیکِ آبی نمی‌گیرد', row?.isVerified === false, `isVerified=${row?.isVerified}`)

    /* برگرداندن به حالتِ اول */
    await rest(`clubs?id=eq.${club.id}`, {
      method: 'PATCH', body: JSON.stringify({ verificationStatus: before.st, isActive: before.active }),
    })
    const restored = (await rest(`clubs?select="verificationStatus"&id=eq.${club.id}`)).body[0]
    t('وضعیتِ باشگاه به حالتِ اول برگشت', restored.verificationStatus === before.st, restored.verificationStatus)
  } else {
    console.log(`  ⏭  رد شد — HTTP ${appr.status}: ${JSON.stringify(appr.body).slice(0, 140)}`)
    console.log('     اگر خطای قید است، مهاجرتِ 042 هنوز در Supabase اجرا نشده.')
  }

} finally {
  /* ── برگرداندنِ نقش — حتی اگر بالا خطا داده باشد ── */
  head('برگرداندنِ نقشِ حسابِ آزمایشی')
  if (createdTournamentId) {
    await rest(`tournaments?id=eq.${createdTournamentId}`, { method: 'DELETE' })
    console.log('  ⓘ مسابقه‌ی تستیِ باقی‌مانده پاک شد')
  }
  const back = await rest(`users?id=eq.${me.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ primaryRole: ORIGINAL.primaryRole, secondaryRoles: ORIGINAL.secondaryRoles }),
  })
  const now = (await rest(`users?select="primaryRole","secondaryRoles"&phone=eq.${TEST_PHONE}`)).body[0]
  t('نقش دقیقاً به حالتِ اول برگشت',
    now.primaryRole === ORIGINAL.primaryRole &&
    JSON.stringify(now.secondaryRoles) === JSON.stringify(ORIGINAL.secondaryRoles),
    `${now.primaryRole} · ${JSON.stringify(now.secondaryRoles)} (HTTP ${back.status})`)
  t('حسابِ آزمایشی دیگر ادمین نیست', now.primaryRole !== 'admin', now.primaryRole)

  const adminsNow = (await rest('users?select=id&primaryRole=eq.admin')).body
  t('سامانه همان یک ادمینِ واقعی را دارد', adminsNow.length === 1, `${adminsNow.length} ادمین`)
}

console.log(`\n${'─'.repeat(46)}\n  موفق: ${pass}   ناموفق: ${fail}\n`)
process.exit(fail ? 1 : 0)
