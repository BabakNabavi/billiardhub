/* ممیزیِ پیش‌از‌انتشار — زنجیره‌ی کاملِ Admin → DB → API → Frontend.
       node scripts/audit-e2e.mjs

   یک‌بار حسابِ آزمایشی را موقتاً ادمین می‌کند، همه‌ی زنجیره‌ها را
   می‌سنجد، و در `finally` نقش را برمی‌گرداند. هر fixture که می‌سازد را
   خودش پاک می‌کند و در پایان بررسی می‌کند چیزی نمانده باشد.

   هیچ تراکنشِ مالیِ واقعی ساخته نمی‌شود و هیچ داده‌ی واقعیِ کاربران
   چاپ نمی‌شود. */

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

let pass = 0, fail = 0
const issues = []
const t = (n, ok, extra = '') => {
  ok ? pass++ : (fail++, issues.push(`${n} — ${extra}`))
  console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)
const note = s => console.log(`  ⓘ ${s}`)

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
if (!me) { console.log('  ✗ حسابِ آزمایشی پیدا نشد'); process.exit(1) }

/* ⚠️ اگر حساب همین حالا ادمین است، یعنی اجرای قبلی نیمه‌کاره مرده و
   نقش را برنگردانده. در آن حالت «وضعیتِ فعلی» را به‌عنوان وضعیتِ اصلی
   نگیر — وگرنه ارتقای موقت برای همیشه ماندگار می‌شود. (این دقیقاً یک‌بار
   اتفاق افتاد: خروجی با `head` بریده شد، فرایند SIGPIPE گرفت و بلاکِ
   finally هرگز تمام نشد.) */
if (me.primaryRole === 'admin') {
  console.log(`\n  ✗ حسابِ آزمایشی ${TEST_PHONE} همین حالا ادمین است.`)
  console.log('    یعنی اجرای قبلی نقش را برنگردانده. پیش از اجرای دوباره،')
  console.log('    نقش را دستی به حالتِ درست برگردانید تا این تست وضعیتِ')
  console.log('    ارتقایافته را به‌عنوان «وضعیتِ اصلی» ثبت نکند.')
  process.exit(1)
}
const ORIGINAL = { primaryRole: me.primaryRole, secondaryRoles: me.secondaryRoles }

/* بازگردانیِ اضطراری روی سیگنال — بدونِ این، Ctrl+C یا بسته‌شدنِ لوله
   حساب را ادمین رها می‌کند. */
const emergencyRestore = async () => {
  await rest(`users?id=eq.${me.id}`, { method: 'PATCH',
    body: JSON.stringify({ primaryRole: ORIGINAL.primaryRole, secondaryRoles: ORIGINAL.secondaryRoles }) })
  console.log('\n  ⓘ نقشِ حسابِ آزمایشی اضطراری برگردانده شد')
}
for (const sig of ['SIGINT', 'SIGTERM', 'SIGPIPE', 'SIGHUP']) {
  process.on(sig, () => { void emergencyRestore().finally(() => process.exit(130)) })
}
process.on('uncaughtException', e => { console.error(e); void emergencyRestore().finally(() => process.exit(1)) })

const adminTok = jwt.sign({ sub: me.id, role: 'admin', phone: me.phone }, SECRET, { expiresIn: '30m' })
const api = async (path, init, tok = adminTok) => {
  const r = await fetch(BASE + path, {
    ...(init ?? {}),
    headers: { ...(tok ? { Authorization: `Bearer ${tok}` } : {}), 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  let body = null; try { body = await r.json() } catch { /* بدنه‌ی خالی */ }
  return { status: r.status, body }
}
const anon = (path, init) => api(path, init, null)

/* پاک‌سازی: هرچه می‌سازیم این‌جا ثبت می‌شود */
const cleanup = []

try {
  await rest(`users?id=eq.${me.id}`, { method: 'PATCH',
    body: JSON.stringify({ primaryRole: 'admin', secondaryRoles: [...new Set([...(ORIGINAL.secondaryRoles ?? []), 'admin'])] }) })

  /* ══ ۱) RANKING — زنجیره‌ی کامل ══ */
  head('RANKING — Admin → app_settings → /api/rankings → صفحه‌ی عمومی')
  const before = (await rest('app_settings?select=value&key=eq.rankings_board')).body[0]?.value ?? null
  note(`وضعیتِ فعلی در دیتابیس: ${before ? 'موجود' : 'اصلاً ذخیره نشده'}`)

  const probe = { snooker: { 'آقایان': { 'دسته برتر': [
    { rank: 1, name: 'zz-آزمایشِ-ممیزی', city: 'تهران', points: 1234 },
  ] } } }
  const saved = await api('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ rankings_board: probe }) })
  t('ادمین می‌تواند جدولِ رنکینگ را ذخیره کند', saved.status === 200, `HTTP ${saved.status}`)

  const inDb = (await rest('app_settings?select=value&key=eq.rankings_board')).body[0]?.value
  t('در دیتابیس نوشته شد', !!inDb?.snooker, JSON.stringify(inDb).slice(0, 80))

  const pubApi = await anon('/api/rankings')
  t('API عمومیِ رنکینگ بدونِ ورود باز است', pubApi.status === 200, `HTTP ${pubApi.status}`)
  const row = pubApi.body?.board?.snooker?.['آقایان']?.['دسته برتر']?.[0]
  t('همان داده از API عمومی برمی‌گردد', row?.name === 'zz-آزمایشِ-ممیزی', JSON.stringify(row ?? null))

  /* برگرداندن به حالتِ اول */
  if (before) await rest('app_settings?key=eq.rankings_board', { method: 'PATCH', body: JSON.stringify({ value: before }) })
  else await rest('app_settings?key=eq.rankings_board', { method: 'DELETE' })
  const after = (await rest('app_settings?select=value&key=eq.rankings_board')).body[0]?.value ?? null
  t('وضعیتِ رنکینگ به حالتِ اول برگشت', JSON.stringify(after) === JSON.stringify(before), 'برنگشت')

  /* ══ ۲) هر صفحه‌ی پنلِ ادمین واقعاً داده می‌دهد؟ ══ */
  head('ADMIN APIs — پاسخ می‌دهند و ۵۰۰ نمی‌دهند')
  for (const p of [
    '/api/admin/stats', '/api/admin/settings', '/api/admin/finance',
    '/api/admin/finance/transactions', '/api/admin/bookings',
    '/api/admin/tournaments', '/api/admin/grant-admin', '/api/admin/commission',
    '/api/admin/advertising', '/api/admin/ad-plans', '/api/admin/story-plans',
    '/api/admin/support', '/api/admin/reports', '/api/admin/profiles?kind=seller',
  ]) {
    const r = await api(p)
    t(`GET ${p}`, r.status === 200, `HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 90)}`)
  }

  /* ══ ۳) APIهای عمومی — مهمان ══ */
  head('PUBLIC APIs — مهمان')
  for (const p of [
    '/api/clubs', '/api/rankings', '/api/tournaments', '/api/products',
    '/api/ads/plans', '/api/ads/placements', '/api/media', '/api/features',
    '/api/sellers', '/api/profiles/seller', '/api/version',
  ]) {
    const r = await anon(p)
    t(`GET ${p} (مهمان)`, r.status === 200, `HTTP ${r.status}`)
  }

  /* ══ ۴) داده‌ی خصوصی نباید برای مهمان باز باشد ══ */
  head('AUTHORIZATION — مسیرهای خصوصی برای مهمان بسته‌اند')
  for (const p of [
    '/api/admin/stats', '/api/admin/finance', '/api/admin/settings',
    '/api/bookings/my', '/api/clubs/my-clubs',
    '/api/social/notifications', '/api/social/dm', '/api/tournaments/my',
    '/api/admin/reports',
  ]) {
    const r = await anon(p)
    t(`${p} برای مهمان بسته است`, r.status === 401 || r.status === 403, `HTTP ${r.status}`)
  }
  /* این دو مسیر GET ندارند؛ با فعلِ درستِ خودشان سنجیده می‌شوند وگرنه
     ۴۰۵ می‌گیریم و «بسته بودن» را نسنجیده‌ایم. */
  for (const [p, method, body] of [
    ['/api/users/me', 'PATCH', '{}'],
    ['/api/admin/settlements', 'POST', '{}'],
    ['/api/admin/settings', 'PATCH', '{}'],
    ['/api/admin/grant-admin', 'POST', '{}'],
    ['/api/admin/tournaments', 'POST', '{}'],
  ]) {
    const r = await anon(p, { method, body })
    t(`${method} ${p} برای مهمان بسته است`, r.status === 401 || r.status === 403, `HTTP ${r.status}`)
  }

  /* ══ ۵) IDOR — کاربرِ عادی به داده‌ی ادمین/دیگری نمی‌رسد ══ */
  head('IDOR — نشستِ کاربرِ عادی')
  const plain = jwt.sign({ sub: me.id, role: 'user', phone: me.phone }, SECRET, { expiresIn: '10m' })
  /* نقش داخلِ توکن نباید مبنا باشد؛ سرور باید از دیتابیس بخواند.
     چون حساب همین حالا در دیتابیس ادمین است، این‌جا انتظارِ ۲۰۰ داریم —
     و همین ثابت می‌کند نقش از توکن خوانده نمی‌شود. */
  const roleFromDb = await api('/api/admin/stats', null, plain)
  t('نقش از دیتابیس خوانده می‌شود نه از ادعای توکن',
    roleFromDb.status === 200, `HTTP ${roleFromDb.status}`)

  /* حالا برعکس: توکنی که ادعای admin دارد ولی کاربرش ادمین نیست */
  const other = (await rest(`users?select=id,phone&primaryRole=neq.admin&id=neq.${me.id}&limit=1`)).body[0]
  if (other) {
    const forged = jwt.sign({ sub: other.id, role: 'admin', phone: other.phone }, SECRET, { expiresIn: '10m' })
    const r = await api('/api/admin/stats', null, forged)
    t('ادعای admin در توکن، دسترسی نمی‌دهد', r.status === 403, `HTTP ${r.status}`)
    const r2 = await api('/api/admin/finance', null, forged)
    t('ادعای admin به داده‌ی مالی هم نمی‌رسد', r2.status === 403, `HTTP ${r2.status}`)
    const r3 = await api('/api/admin/grant-admin', { method: 'POST', body: JSON.stringify({ userId: other.id, grant: true }) }, forged)
    t('ادعای admin نمی‌تواند خودش را ادمین کند', r3.status === 403, `HTTP ${r3.status}`)
    const still = (await rest(`users?select="primaryRole"&id=eq.${other.id}`)).body[0]
    t('نقشِ آن کاربر دست‌نخورده ماند', still.primaryRole !== 'admin', still.primaryRole)
  } else note('کاربرِ غیرادمینِ دومی نبود — بخشِ توکنِ جعلی رد شد')

  /* توکنِ امضاشده با کلیدِ اشتباه */
  const badSig = jwt.sign({ sub: me.id, role: 'admin' }, 'wrong-secret-not-real', { expiresIn: '10m' })
  const bad = await api('/api/admin/stats', null, badSig)
  t('توکنِ با امضای نامعتبر رد می‌شود', bad.status === 401 || bad.status === 403, `HTTP ${bad.status}`)

  const expired = jwt.sign({ sub: me.id, role: 'admin' }, SECRET, { expiresIn: '-1h' })
  const exp = await api('/api/admin/stats', null, expired)
  t('توکنِ منقضی رد می‌شود', exp.status === 401 || exp.status === 403, `HTTP ${exp.status}`)

  /* ══ ۶) CLUBS — تأیید → انتشار → فهرستِ عمومی ══ */
  head('CLUBS — تصمیمِ ادمین در فهرستِ عمومی دیده می‌شود')
  const club = (await rest('clubs?select=id,name,"verificationStatus","isActive"&limit=1')).body[0]
  const clubBefore = { st: club.verificationStatus, active: club.isActive }

  const rej = await api(`/api/clubs/${club.id}`, { method: 'PUT',
    body: JSON.stringify({ verificationStatus: 'rejected', rejectionReason: 'zz-آزمایشِ-ممیزی' }) })
  t('ادمین می‌تواند باشگاه را رد کند', rej.status === 200, `HTTP ${rej.status}`)
  const afterRej = (await rest(`clubs?select="isActive","verificationStatus"&id=eq.${club.id}`)).body[0]
  t('ردکردن، باشگاه را از انتشار خارج می‌کند', afterRej.isActive === false, String(afterRej.isActive))
  const pubList = await anon('/api/clubs')
  t('باشگاهِ ردشده در فهرستِ عمومی نیست',
    !(pubList.body ?? []).some(c => c.id === club.id), 'هنوز دیده می‌شود')

  const rejNoReason = await api(`/api/clubs/${club.id}`, { method: 'PUT',
    body: JSON.stringify({ verificationStatus: 'rejected' }) })
  t('ردکردن بدونِ علت پذیرفته نمی‌شود', rejNoReason.status === 400, `HTTP ${rejNoReason.status}`)

  const ver = await api(`/api/clubs/${club.id}`, { method: 'PUT', body: JSON.stringify({ verificationStatus: 'verified' }) })
  t('ادمین می‌تواند باشگاه را تأیید کند', ver.status === 200, `HTTP ${ver.status}`)
  const pubList2 = await anon('/api/clubs')
  const backRow = (pubList2.body ?? []).find(c => c.id === club.id)
  t('باشگاهِ تأییدشده به فهرستِ عمومی برمی‌گردد', !!backRow, 'برنگشت')
  t('و تیکِ آبی می‌گیرد', backRow?.isVerified === true, `isVerified=${backRow?.isVerified}`)

  const appr = await api(`/api/clubs/${club.id}`, { method: 'PUT', body: JSON.stringify({ verificationStatus: 'approved' }) })
  if (appr.status === 200) {
    const pubList3 = await anon('/api/clubs')
    const r3 = (pubList3.body ?? []).find(c => c.id === club.id)
    t('«تأیید بدونِ تیک» باشگاه را در فهرست نگه می‌دارد', !!r3, 'دیده نشد')
    t('ولی تیکِ آبی نمی‌دهد', r3?.isVerified === false, `isVerified=${r3?.isVerified}`)
  } else {
    note(`وضعیتِ approved هنوز کار نمی‌کند (HTTP ${appr.status}) — مهاجرتِ ۰۴۲ اجرا نشده`)
  }

  await rest(`clubs?id=eq.${club.id}`, { method: 'PATCH',
    body: JSON.stringify({ verificationStatus: clubBefore.st, isActive: clubBefore.active, rejectionReason: null }) })
  const clubBack = (await rest(`clubs?select="verificationStatus","isActive"&id=eq.${club.id}`)).body[0]
  t('وضعیتِ باشگاه به حالتِ اول برگشت',
    clubBack.verificationStatus === clubBefore.st && clubBack.isActive === clubBefore.active,
    `${clubBack.verificationStatus}/${clubBack.isActive}`)

  /* ══ ۷) TOURNAMENTS — پنلِ باشگاه تا صفحه‌ی عمومی ══ */
  head('TOURNAMENTS — ساخت → انتشار → دیده‌شدنِ عمومی')
  const anyClub = (await rest('clubs?select=id,name&limit=1')).body[0]
  const mk = await api('/api/admin/tournaments', { method: 'POST',
    body: JSON.stringify({ clubId: anyClub.id, title: 'zz-ممیزی-مسابقه', entryFee: 100000, maxPlayers: 8 }) })
  const tid = mk.body?.tournament?.id
  if (tid) cleanup.push(() => rest(`tournaments?id=eq.${tid}`, { method: 'DELETE' }))
  t('مسابقه ساخته می‌شود', mk.status === 201 && !!tid, `HTTP ${mk.status}`)

  const pubT = await anon('/api/tournaments')
  const list = Array.isArray(pubT.body) ? pubT.body : (pubT.body?.tournaments ?? [])
  t('مسابقه‌ی منتشرشده در فهرستِ عمومی دیده می‌شود',
    list.some(x => x.id === tid), `${list.length} مسابقه در فهرست`)

  await api('/api/admin/tournaments', { method: 'PATCH', body: JSON.stringify({ id: tid, status: 'draft' }) })
  const pubT2 = await anon('/api/tournaments')
  const list2 = Array.isArray(pubT2.body) ? pubT2.body : (pubT2.body?.tournaments ?? [])
  t('مسابقه‌ی پیش‌نویس از فهرستِ عمومی پنهان می‌شود',
    !list2.some(x => x.id === tid), 'هنوز دیده می‌شود')

  const detail = await anon(`/api/tournaments/${tid}`)
  t('جزئیاتِ مسابقه‌ی پیش‌نویس هم عمومی نیست',
    detail.status === 404 || detail.status === 403, `HTTP ${detail.status}`)

  const delT = await api(`/api/admin/tournaments?id=${tid}`, { method: 'DELETE' })
  t('مسابقه‌ی تستی حذف شد', delT.status === 200, `HTTP ${delT.status}`)

  /* ══ ۸) داده‌ی ساختگی در پاسخِ عمومی ══ */
  head('داده‌ی واقعی — نه نمونه')
  const clubsPub = (await anon('/api/clubs')).body ?? []
  const dbClubs = (await rest('clubs?select=id')).body ?? []
  t('فهرستِ عمومیِ باشگاه‌ها فقط از دیتابیس می‌آید',
    clubsPub.every(c => dbClubs.some(d => d.id === c.id)), 'ردیفی خارج از دیتابیس بود')

  const prodPub = (await anon('/api/products')).body
  const prodArr = Array.isArray(prodPub) ? prodPub : (prodPub?.products ?? [])
  const dbProd = (await rest('products?select=id')).body ?? []
  t('محصولاتِ عمومی از دیتابیس می‌آیند',
    prodArr.length === 0 || prodArr.every(p => dbProd.some(d => String(d.id) === String(p.id))),
    `API ${prodArr.length} / DB ${dbProd.length}`)

  const sellersPub = (await anon('/api/sellers')).body
  const sArr = Array.isArray(sellersPub) ? sellersPub : (sellersPub?.sellers ?? sellersPub?.profiles ?? [])
  const dbProfiles = (await rest('profiles?select=id&kind=eq.seller')).body ?? []
  t('فروشندگانِ عمومی از دیتابیس می‌آیند (نه MOCK_SELLERS)',
    sArr.length === dbProfiles.length, `API ${sArr.length} / DB ${dbProfiles.length}`)

} finally {
  head('پاک‌سازی و بازگردانی')
  for (const fn of cleanup) { try { await fn() } catch { /* قبلاً رفته */ } }

  await rest(`users?id=eq.${me.id}`, { method: 'PATCH',
    body: JSON.stringify({ primaryRole: ORIGINAL.primaryRole, secondaryRoles: ORIGINAL.secondaryRoles }) })
  const now = (await rest(`users?select="primaryRole","secondaryRoles"&phone=eq.${TEST_PHONE}`)).body[0]
  t('نقشِ حسابِ آزمایشی برگشت',
    now.primaryRole === ORIGINAL.primaryRole &&
    JSON.stringify(now.secondaryRoles) === JSON.stringify(ORIGINAL.secondaryRoles),
    `${now.primaryRole}`)

  const leftovers = (await rest('tournaments?select=id,title&title=like.zz-*')).body ?? []
  t('هیچ fixtureی باقی نمانده', leftovers.length === 0, `${leftovers.length} ردیف`)
  const admins = (await rest('users?select=id&primaryRole=eq.admin')).body ?? []
  t('تعدادِ ادمین‌ها همان یکی است', admins.length === 1, `${admins.length}`)
}

console.log(`\n${'═'.repeat(52)}\n  موفق: ${pass}   ناموفق: ${fail}\n`)
if (issues.length) { console.log('  یافته‌ها:'); issues.forEach(i => console.log('   • ' + i)) }
process.exit(fail ? 1 : 0)
