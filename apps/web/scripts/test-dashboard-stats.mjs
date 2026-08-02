/* کارت‌های داشبوردِ ادمین — هر عدد با شمارشِ مستقلِ دیتابیس سنجیده
   می‌شود. همان‌جا که شکایت از آن شروع شد: «۲۱ کاربر نشان می‌دهد ولی
   صفحه‌ی کاربران خالی است».
       node scripts/test-dashboard-stats.mjs */
import fs from 'node:fs'
import jwt from 'jsonwebtoken'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY, S = env.JWT_SECRET
const B = process.env.BH_BASE ?? 'http://localhost:3000'

const rest = async (p, i) => {
  const r = await fetch(U + '/rest/v1/' + p, {
    ...(i ?? {}),
    headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(i?.headers ?? {}) },
  })
  const t = await r.text()
  return { s: r.status, b: t ? JSON.parse(t) : null }
}
/* شمارشِ مستقل — عمداً از همان راهی که API می‌رود نمی‌آید */
const countRows = async (path) => ((await rest(path)).b ?? []).length

const me = (await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
if (!me || me.primaryRole === 'admin') { console.log('  ✗ حسابِ آزمایشی نامناسب'); process.exit(1) }
const ORIG = { primaryRole: me.primaryRole, secondaryRoles: me.secondaryRoles }
const restore = () => rest('users?id=eq.' + me.id, { method: 'PATCH', body: JSON.stringify(ORIG) })
for (const sg of ['SIGINT', 'SIGTERM', 'SIGPIPE']) process.on(sg, () => { restore().finally(() => process.exit(130)) })

let pass = 0, fail = 0
const t = (n, ok, x = '') => { ok ? pass++ : fail++; console.log('  ' + (ok ? '✓' : '✗') + ' ' + n + (ok ? '' : '  ← ' + x)) }
const head = x => console.log('\n■ ' + x)
const tk = r => jwt.sign({ sub: me.id, role: r, phone: me.phone }, S, { expiresIn: '20m' })
const call = async (p, k) => {
  const r = await fetch(B + p, { headers: { ...(k ? { Authorization: 'Bearer ' + k } : {}) } })
  let b = null; try { b = await r.json() } catch { /* خالی */ }
  return { s: r.status, b }
}

try {
  head('دسترسی')
  t('مهمان آمار نمی‌گیرد', (await call('/api/admin/stats', null)).s === 401, '')
  t('کاربرِ عادی آمار نمی‌گیرد', (await call('/api/admin/stats', tk('user'))).s === 403, '')

  await rest('users?id=eq.' + me.id, {
    method: 'PATCH',
    body: JSON.stringify({ primaryRole: 'admin', secondaryRoles: [...new Set([...(ORIG.secondaryRoles ?? []), 'admin'])] }),
  })
  const adm = tk('admin')

  head('هر کارت با شمارشِ مستقلِ دیتابیس')
  const s = (await call('/api/admin/stats', adm)).b ?? {}
  const expect = {
    users:    await countRows('users?select=id'),
    products: await countRows('products?select=id'),
    clubs:    await countRows('clubs?select=id'),
    news:     await countRows('news?select=id'),
    bookings: await countRows('bookings?select=id'),
    pendingClubs:    await countRows('clubs?select=id&verificationStatus=eq.pending'),
    pendingRoles:    await countRows('role_requests?select=id&status=eq.pending'),
    pendingProfiles: await countRows('profiles?select=id&status=eq.pending'),
    openReports:     await countRows('reports?select=id&status=eq.open'),
  }
  for (const [k, v] of Object.entries(expect)) {
    t(('کارت «' + k + '»').padEnd(30), s[k] === v, 'پنل ' + s[k] + ' — دیتابیس ' + v)
  }
  t('مجموعِ کارهای روی میز درست است',
    s.pendingTotal === expect.pendingClubs + expect.pendingRoles + expect.pendingProfiles + expect.openReports,
    String(s.pendingTotal))

  head('عددِ کارتِ کاربران با صفحه‌ی مدیریتِ کاربران یکی است')
  const page = (await call('/api/admin/users', adm)).b?.users ?? []
  t('همان عدد در هر دو جا', page.length === s.users, 'صفحه ' + page.length + ' — کارت ' + s.users)

  head('«در انتظار تأیید» معنیِ درست دارد')
  /* باشگاهِ ردشده نباید در این شمار بیاید — پیش‌تر می‌آمد چون معیار
     `isActive = false` بود. */
  const club = (await rest('clubs?select=id,"verificationStatus","isActive"&limit=1')).b[0]
  const was = { st: club.verificationStatus, active: club.isActive }
  await rest('clubs?id=eq.' + club.id, { method: 'PATCH', body: JSON.stringify({ verificationStatus: 'rejected', isActive: false }) })
  const afterReject = (await call('/api/admin/stats', adm)).b ?? {}
  t('باشگاهِ ردشده «در انتظار» شمرده نمی‌شود', afterReject.pendingClubs === expect.pendingClubs,
    'شد ' + afterReject.pendingClubs + ' — باید می‌ماند ' + expect.pendingClubs)

  await rest('clubs?id=eq.' + club.id, { method: 'PATCH', body: JSON.stringify({ verificationStatus: 'pending', isActive: false }) })
  const afterPending = (await call('/api/admin/stats', adm)).b ?? {}
  t('باشگاهِ در انتظار شمرده می‌شود', afterPending.pendingClubs === expect.pendingClubs + 1,
    'شد ' + afterPending.pendingClubs)

  await rest('clubs?id=eq.' + club.id, { method: 'PATCH', body: JSON.stringify({ verificationStatus: was.st, isActive: was.active }) })
  const back = (await rest('clubs?select="verificationStatus","isActive"&id=eq.' + club.id)).b[0]
  t('وضعیتِ باشگاه به حالتِ اول برگشت',
    back.verificationStatus === was.st && back.isActive === was.active, back.verificationStatus)

  head('هیچ عددی هاردکد نیست')
  /* کدهای وضعیتِ HTTP (`status: 401`) عددِ ثابت‌اند ولی داده نیستند؛
     آنچه اهمیت دارد این است که خودِ شمارنده‌ها ثابت نباشند. */
  const src = fs.readFileSync('app/api/admin/stats/route.ts', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/status:\s*\d+/g, '')
  t('هیچ شمارنده‌ای عددِ ثابت ندارد', !/:\s*[1-9][0-9]{1,}\s*[,}]/.test(src), 'عددِ ثابت پیدا شد')
  const counters = ['users', 'products', 'clubs', 'news', 'bookings']
  t('همه‌ی شمارنده‌ها از countOf می‌آیند',
    counters.every(c => new RegExp(`countOf\\('${c}'`).test(src)), 'شمارنده‌ای بدونِ countOf')

} finally {
  head('بازگردانی')
  await restore()
  t('نقشِ حسابِ آزمایشی برگشت',
    (await rest('users?select="primaryRole"&phone=eq.09001327283')).b[0].primaryRole === ORIG.primaryRole, '')
}

console.log('\n  موفق: ' + pass + '   ناموفق: ' + fail + '\n')
process.exit(fail ? 1 : 0)
