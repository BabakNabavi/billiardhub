/* بخشِ ۶–۷ پنلِ ادمین: تبلیغات، بسته‌ها، گزارش‌های تخلف، قابلیت‌ها.
       node scripts/test-ads-admin.mjs
   هر بسته‌ی آزمایشی در پایان پاک می‌شود و پرچمِ قابلیت به حالتِ اول
   برمی‌گردد. */
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

const me = (await rest('users?select=id,phone,"primaryRole","secondaryRoles"&phone=eq.09001327283')).b[0]
if (!me || me.primaryRole === 'admin') { console.log('  ✗ حسابِ آزمایشی نامناسب'); process.exit(1) }
const ORIG = { primaryRole: me.primaryRole, secondaryRoles: me.secondaryRoles }

let flagBefore = null
const cleanup = async () => {
  try { await rest('ad_plans?name=like.zz-*', { method: 'DELETE' }) } catch { /* رفته */ }
  try { await rest('story_plans?name=like.zz-*', { method: 'DELETE' }) } catch { /* رفته */ }
  if (flagBefore !== null) {
    try { await rest('app_settings?key=eq.social_interactions_enabled', { method: 'PATCH', body: JSON.stringify({ value: flagBefore }) }) } catch { /* */ }
  }
  await rest('users?id=eq.' + me.id, { method: 'PATCH', body: JSON.stringify(ORIG) })
}
for (const sg of ['SIGINT', 'SIGTERM', 'SIGPIPE']) process.on(sg, () => { cleanup().finally(() => process.exit(130)) })

let pass = 0, fail = 0
const t = (n, ok, x = '') => { ok ? pass++ : fail++; console.log('  ' + (ok ? '✓' : '✗') + ' ' + n + (ok ? '' : '  ← ' + x)) }
const head = x => console.log('\n■ ' + x)
const note = x => console.log('  ⓘ ' + x)
const tk = r => jwt.sign({ sub: me.id, role: r, phone: me.phone }, S, { expiresIn: '20m' })
const call = async (p, i, k) => {
  const r = await fetch(B + p, { ...(i ?? {}), headers: { ...(k ? { Authorization: 'Bearer ' + k } : {}), 'Content-Type': 'application/json', ...(i?.headers ?? {}) } })
  let b = null; try { b = await r.json() } catch { /* بدنه‌ی خالی */ }
  return { s: r.status, b }
}

try {
  const uTok = tk('user')

  head('دسترسی')
  for (const [p, m] of [['/api/admin/ad-plans', 'POST'], ['/api/admin/story-plans', 'POST'],
    ['/api/admin/advertising', 'GET'], ['/api/admin/reports', 'GET'], ['/api/admin/settings', 'PATCH']]) {
    const body = m === 'GET' ? {} : { body: '{}' }
    const g = (await call(p, { method: m, ...body }, null)).s
    t(m + ' ' + p + ' — مهمان بسته', g === 401 || g === 403, 'HTTP ' + g)
    t(m + ' ' + p + ' — کاربرِ عادی بسته', (await call(p, { method: m, ...body }, uTok)).s === 403, '')
  }

  await rest('users?id=eq.' + me.id, {
    method: 'PATCH',
    body: JSON.stringify({ primaryRole: 'admin', secondaryRoles: [...new Set([...(ORIG.secondaryRoles ?? []), 'admin'])] }),
  })
  const adm = tk('admin')

  head('بسته‌های آگهی — ادمین می‌سازد، سایت نشان می‌دهد')
  const before = ((await call('/api/ads/plans', null, null)).b?.plans ?? []).length
  const NAME = 'zz-بسته آزمایشی'
  const mk = await call('/api/admin/ad-plans', {
    method: 'POST',
    body: JSON.stringify({ name: NAME, description: 'توضیح', quota: 5, period: 'month', durationDays: 30, price: 250000, isActive: true }),
  }, adm)
  t('بسته ساخته می‌شود', mk.s === 201 || mk.s === 200, 'HTTP ' + mk.s + ' ' + JSON.stringify(mk.b).slice(0, 110))
  const pubPlans = (await call('/api/ads/plans', null, null)).b?.plans ?? []
  t('در فهرستِ عمومیِ /plans دیده می‌شود', pubPlans.some(p => p.name === NAME), before + ' → ' + pubPlans.length)
  t('قیمت درست منتقل شد', pubPlans.find(p => p.name === NAME)?.price === 250000, '')
  t('نامِ خالی رد می‌شود',
    (await call('/api/admin/ad-plans', { method: 'POST', body: JSON.stringify({ name: '', quota: 1, period: 'month', durationDays: 1, price: 0 }) }, adm)).s === 400, '')
  t('بازه‌ی نامعتبر رد می‌شود',
    (await call('/api/admin/ad-plans', { method: 'POST', body: JSON.stringify({ name: 'zz-a', quota: 1, period: 'قرن', durationDays: 1, price: 0 }) }, adm)).s === 400, '')
  t('قیمتِ منفی رد می‌شود',
    (await call('/api/admin/ad-plans', { method: 'POST', body: JSON.stringify({ name: 'zz-b', quota: 1, period: 'month', durationDays: 1, price: -5 }) }, adm)).s === 400, '')

  const negPlan = await call('/api/admin/ad-plans', { method: 'POST', body: JSON.stringify({ name: 'zz-c', quota: 1, period: 'month', durationDays: 1, price: -7000 }) }, adm)
  t('قیمتِ منفی بی‌صدا مثبت نمی‌شود', negPlan.s === 400, 'HTTP ' + negPlan.s + ' — ساخته شد با قیمتِ ' + JSON.stringify(negPlan.b?.plan?.price))

  head('بسته‌های استوری')
  t('/api/admin/story-plans باز می‌شود', (await call('/api/admin/story-plans', null, adm)).s === 200, '')
  t('/api/stories/plans برای مهمان باز است', (await call('/api/stories/plans', null, null)).s === 200, '')

  head('سیستم تبلیغات — جایگاه‌ها')
  const adv = await call('/api/admin/advertising', null, adm)
  t('/api/admin/advertising باز می‌شود', adv.s === 200, 'HTTP ' + adv.s)
  const dbPl = ((await rest('placements?select=key')).b ?? []).length
  t('جایگاه‌ها از دیتابیس می‌آیند', (adv.b?.placements ?? []).length === dbPl, (adv.b?.placements ?? []).length + ' در برابر ' + dbPl)
  const dbPr = ((await rest('ad_pricing_plans?select=id')).b ?? []).length
  const apiPr = (adv.b?.plans ?? []).length
  t('نرخ‌نامه از دیتابیس می‌آید', apiPr === dbPr, apiPr + ' در برابر ' + dbPr)
  t('جایگاه‌های زنده برای مهمان باز است', (await call('/api/ads/placements', null, null)).s === 200, '')

  head('گزارش‌های تخلف')
  const rep = await call('/api/admin/reports', null, adm)
  t('/api/admin/reports باز می‌شود', rep.s === 200, 'HTTP ' + rep.s)
  const dbRep = ((await rest('reports?select=id')).b ?? []).length
  const apiRep = (rep.b?.reports ?? (Array.isArray(rep.b) ? rep.b : [])).length
  t('تعداد با دیتابیس یکی است', apiRep === dbRep, apiRep + ' در برابر ' + dbRep)
  if (dbRep === 0) note('هیچ گزارشی ثبت نشده — چرخه‌ی رسیدگی آزموده نشد')

  head('قابلیت‌های پلتفرم — پرچم واقعاً اثر می‌کند')
  flagBefore = ((await rest('app_settings?select=value&key=eq.social_interactions_enabled')).b ?? [])[0]?.value ?? false
  note('پرچمِ فعلی: ' + JSON.stringify(flagBefore))
  t('ادمین پرچم را روشن می‌کند',
    (await call('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ social_interactions_enabled: true }) }, adm)).s === 200, '')
  t('در دیتابیس نشست', ((await rest('app_settings?select=value&key=eq.social_interactions_enabled')).b ?? [])[0]?.value === true, '')
  /* کشِ پرچم ۱۰ ثانیه TTL دارد و در هر نمونه‌ی سرورلس جداست */
  await new Promise(r => setTimeout(r, 11000))
  t('/api/features روشن‌بودن را گزارش می‌کند', (await call('/api/features', null, null)).b?.socialInteractions === true, '')
  t('خاموش‌کردن هم کار می‌کند',
    (await call('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ social_interactions_enabled: false }) }, adm)).s === 200, '')
  await new Promise(r => setTimeout(r, 11000))
  t('/api/features خاموش‌بودن را گزارش می‌کند', (await call('/api/features', null, null)).b?.socialInteractions === false, '')
  t('کلیدِ ناشناخته ذخیره نمی‌شود',
    (await call('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ zz_unknown_key: true }) }, adm)).s === 400, '')
  t('کلیدِ ناشناخته در دیتابیس نیست', ((await rest('app_settings?select=key&key=eq.zz_unknown_key')).b ?? []).length === 0, '')

} finally {
  head('پاک‌سازی')
  await cleanup()
  t('بسته‌ی آزمایشی نماند', ((await rest('ad_plans?select=id&name=like.zz-*')).b ?? []).length === 0, '')
  const f = ((await rest('app_settings?select=value&key=eq.social_interactions_enabled')).b ?? [])[0]?.value
  t('پرچم به حالتِ اول برگشت', JSON.stringify(f) === JSON.stringify(flagBefore), JSON.stringify(f))
  t('نقشِ حسابِ آزمایشی برگشت',
    (await rest('users?select="primaryRole"&phone=eq.09001327283')).b[0].primaryRole === ORIG.primaryRole, '')
}

console.log('\n  موفق: ' + pass + '   ناموفق: ' + fail + '\n')
process.exit(fail ? 1 : 0)
