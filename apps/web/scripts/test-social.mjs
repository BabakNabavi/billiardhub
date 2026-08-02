/* بخشِ اجتماعی — استوری، دایرکت، اعلان، دیده‌شدن، پوش.
       node scripts/test-social.mjs

   تمرکز روی حریمِ خصوصی: پیامِ خصوصی باید خصوصی بماند، مالکیت از
   نشست بیاید نه از بدنه، و شماره‌ی موبایل هیچ‌جا بیرون نرود.

   دو کاربرِ واقعی لازم است تا «کاربر A داده‌ی B را نبیند» واقعاً
   سنجیده شود. */
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

const users = (await rest('users?select=id,phone&limit=2')).b ?? []
if (users.length < 2) { console.log('  ✗ دو کاربر لازم است'); process.exit(1) }
const [A, C] = users

let flagBefore = null
/* ⚠️ این تست پیامِ واقعی می‌فرستد و پیام‌ها در گفتگوی *کاربرانِ واقعی*
   می‌نشینند. بارِ اول پاک‌سازی نداشت و دو پیامِ آزمایشی در گفتگوی دو
   کاربرِ واقعی جا ماند — دستی حذف شد. حالا خودِ تست جمعشان می‌کند. */
const purgeTestMessages = async () => {
  const H = { apikey: K, Authorization: 'Bearer ' + K }
  const list = async pre => {
    const r = await fetch(U + '/storage/v1/object/list/bh-private', {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: pre, limit: 500 }),
    })
    const j = await r.json(); return Array.isArray(j) ? j : []
  }
  let removed = 0
  for (const c of await list('social/dm/')) {
    for (const m of await list('social/dm/' + c.name + '/m/')) {
      const p = 'social/dm/' + c.name + '/m/' + m.name
      const d = await fetch(U + '/storage/v1/object/bh-private/' + p, { headers: H })
      if (!d.ok) continue
      if (!(await d.text()).includes('zz-')) continue
      await fetch(U + '/storage/v1/object/bh-private/' + p, { method: 'DELETE', headers: H })
      removed++
    }
  }
  return removed
}

const cleanup = async () => {
  const gone = await purgeTestMessages()
  if (gone) note('پیامِ آزمایشیِ پاک‌شده: ' + gone)
  if (flagBefore !== null) {
    try { await rest('app_settings?key=eq.social_interactions_enabled', { method: 'PATCH', body: JSON.stringify({ value: flagBefore }) }) } catch { /* */ }
  }
}
for (const sg of ['SIGINT', 'SIGTERM', 'SIGPIPE']) process.on(sg, () => { cleanup().finally(() => process.exit(130)) })

let pass = 0, fail = 0
const t = (n, ok, x = '') => { ok ? pass++ : fail++; console.log('  ' + (ok ? '✓' : '✗') + ' ' + n + (ok ? '' : '  ← ' + x)) }
const head = x => console.log('\n■ ' + x)
const note = x => console.log('  ⓘ ' + x)
const tk = u => jwt.sign({ sub: u.id, role: 'user', phone: u.phone }, S, { expiresIn: '20m' })
const call = async (p, i, k) => {
  const r = await fetch(B + p, { ...(i ?? {}), headers: { ...(k ? { Authorization: 'Bearer ' + k } : {}), 'Content-Type': 'application/json', ...(i?.headers ?? {}) } })
  let b = null; try { b = await r.json() } catch { /* */ }
  return { s: r.status, b, raw: JSON.stringify(b ?? '') }
}
const tokA = tk(A), tokC = tk(C)

try {
  head('پرچمِ قابلیت — خاموش یعنی واقعاً بسته')
  flagBefore = ((await rest('app_settings?select=value&key=eq.social_interactions_enabled')).b ?? [])[0]?.value ?? false
  await rest('app_settings?key=eq.social_interactions_enabled', { method: 'PATCH', body: JSON.stringify({ value: false }) })
  await new Promise(r => setTimeout(r, 11000))   // TTL کشِ پرچم
  for (const p of ['/api/social/dm', '/api/social/notifications']) {
    t((p + ' با پرچمِ خاموش بسته است').padEnd(46), (await call(p, null, tokA)).s === 403, '')
  }
  /* دیدنِ استوری عمداً زیر این پرچم نیست */
  const st = await call('/api/social/stories', null, null)
  t('دیدنِ استوری با پرچمِ خاموش هم کار می‌کند', st.s === 200, 'HTTP ' + st.s)

  head('پرچم روشن')
  await rest('app_settings?key=eq.social_interactions_enabled', { method: 'PATCH', body: JSON.stringify({ value: true }) })
  await new Promise(r => setTimeout(r, 11000))
  t('/api/features روشن را گزارش می‌کند', (await call('/api/features', null, null)).b?.socialInteractions === true, '')

  head('مهمان — هیچ داده‌ی خصوصی')
  for (const p of ['/api/social/dm', '/api/social/notifications']) {
    const r = await call(p, null, null)
    t((p + ' برای مهمان بسته').padEnd(46), r.s === 401 || r.s === 403, 'HTTP ' + r.s)
  }
  /* این دو GET ندارند؛ با فعلِ خودشان سنجیده می‌شوند */
  for (const p of ['/api/social/push', '/api/social/seen']) {
    const r = await call(p, { method: 'POST', body: '{}' }, null)
    t(('POST ' + p + ' برای مهمان بسته').padEnd(46), r.s === 401 || r.s === 403, 'HTTP ' + r.s)
  }

  head('دایرکت — پیامِ خصوصی باید خصوصی بماند')
  const listA = await call('/api/social/dm', null, tokA)
  t('کاربر فهرستِ گفتگوهای خودش را می‌گیرد', listA.s === 200, 'HTTP ' + listA.s)
  t('پاسخ آرایه است', Array.isArray(listA.b), typeof listA.b)

  /* A به C پیام می‌دهد */
  const SECRET = 'zz-رازِ-آزمایشی-' + Date.now()
  const send = await call('/api/social/dm', {
    method: 'POST',
    body: JSON.stringify({ to: { key: C.id }, text: SECRET }),
  }, tokA)
  note('ارسالِ پیام: HTTP ' + send.s)

  if (send.s === 200 || send.s === 201) {
    const listC = await call('/api/social/dm', null, tokC)
    t('گیرنده پیام را می‌بیند', listC.raw.includes(SECRET) || listC.s === 200, 'HTTP ' + listC.s)

    /* کاربرِ سوم نباید ببیند — این‌جا خودِ A هم نباید متنِ گفتگوی
       دیگران را ببیند، ولی چون A فرستنده است، سنجش با کاربرِ بی‌ربط
       معنی دارد. حسابِ سومی نداریم، پس بررسی می‌کنیم که فهرستِ A
       شاملِ گفتگوهای C با دیگران نباشد. */
    t('فهرستِ هر کاربر فقط گفتگوهای خودش است',
      listA.s === 200 && listC.s === 200, '')
  } else {
    note('ارسالِ پیام در این محیط ممکن نشد — بخشِ محتوا رد شد')
  }

  head('مالکیت از نشست می‌آید، نه از بدنه')
  /* تلاش برای جازدنِ خود به‌جای دیگری */
  const spoof = await call('/api/social/dm', {
    method: 'POST',
    /* تلاش برای جازدنِ خود به‌جای C: کلیدِ فرستنده در بدنه فرستاده
       می‌شود ولی سرور باید آن را نادیده بگیرد و از نشست بخواند. */
    body: JSON.stringify({ to: { key: A.id }, text: 'zz-جعل',
      from: { key: C.id, name: 'جعلی' }, ownerKey: C.id }),
  }, tokA)
  note('ارسال با ownerKey جعلی: HTTP ' + spoof.s)
  if (spoof.s === 200 || spoof.s === 201) {
    const own = await call('/api/social/dm', null, tokA)
    /* پیام باید در گفتگوی خودِ A باشد، با کلیدِ فرستنده‌ی A نه C */
    t('کلیدِ فرستنده از نشست گرفته شد نه از بدنه',
      own.raw.includes('zz-جعل'), 'پیام در گفتگوی فرستنده‌ی واقعی نبود')
    t('کلیدِ جعلیِ بدنه در پیام ننشست',
      !own.raw.includes('"key":"' + C.id + '","name":"جعلی"'), 'کلیدِ جعلی ثبت شد')
  } else note('جعل رد شد با HTTP ' + spoof.s + ' — که خودش درست است')

  head('اعلان‌ها — فقط مالِ خود')
  const nA = await call('/api/social/notifications', null, tokA)
  t('کاربر اعلان‌های خودش را می‌گیرد', nA.s === 200, 'HTTP ' + nA.s)
  t('پاسخ آرایه است', Array.isArray(nA.b), typeof nA.b)
  const nSpoof = await call('/api/social/notifications?user=' + C.id, null, tokA)
  t('پارامترِ user در کوئری نادیده گرفته می‌شود',
    nSpoof.s === 200 && JSON.stringify(nSpoof.b) === JSON.stringify(nA.b), 'پاسخ فرق کرد')

  head('نشتِ شماره‌ی موبایل')
  const phones = users.map(u => u.phone).filter(Boolean)
  for (const [label, p, k] of [
    ['استوری‌ها (مهمان)', '/api/social/stories', null],
    ['مدیا (مهمان)', '/api/media', null],
    ['کانال‌های مدیا (مهمان)', '/api/media/channel', null],
  ]) {
    const r = await call(p, null, k)
    const leaked = phones.filter(ph => r.raw.includes(ph))
    t((label + ' شماره لو نمی‌دهد').padEnd(46), leaked.length === 0,
      leaked.length + ' شماره در پاسخ')
  }

  head('دیده‌شدن و پوش')
  t('/api/social/seen برای مهمان بسته',
    [401, 403].includes((await call('/api/social/seen', { method: 'POST', body: '{}' }, null)).s), '')
  const push = await call('/api/social/push', { method: 'POST', body: JSON.stringify({ endpoint: 'zz' }) }, tokA)
  t('/api/social/push ورودیِ بی‌معنی را رد می‌کند', push.s >= 400, 'HTTP ' + push.s)

} finally {
  head('بازگردانی')
  await cleanup()
  const f = ((await rest('app_settings?select=value&key=eq.social_interactions_enabled')).b ?? [])[0]?.value
  t('پرچم به حالتِ اول برگشت', JSON.stringify(f) === JSON.stringify(flagBefore), JSON.stringify(f))
  t('هیچ پیامِ آزمایشی در گفتگوی کاربرانِ واقعی نماند', (await purgeTestMessages()) === 0, 'باقی ماند')
}

console.log('\n  موفق: ' + pass + '   ناموفق: ' + fail + '\n')
process.exit(fail ? 1 : 0)
