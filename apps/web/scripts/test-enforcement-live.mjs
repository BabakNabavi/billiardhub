/* آزمونِ نفوذِ زنده‌ی اعمالِ وضعیتِ حساب — روی سایتِ اصلی، با حساب‌های آزمایشی.

   ⚠️ به دیتابیسِ زنده می‌نویسد. فقط با این‌ها اجرا می‌شود:
       ENFORCEMENT_LIVE=1 OWNER_PASSWORD=… TEST_PASSWORD=… \
         node scripts/test-enforcement-live.mjs  [BASE=https://billiardhub.net]

   پیش‌نیاز: مهاجرتِ ۱۱۳ و سه حسابِ آزمایشی در بازه‌ی ۰۹۰۰ (به هیچ مشترکی
   داده نشده و ثبت‌نام هم آن را نمی‌پذیرد):
       A = 09000000101  کاربرِ عادی
       B = 09000000102  کاربرِ عادی
       C = 09000000103  ادمین با فقط مجوزِ «users»
   رمزِ مالک فقط از متغیرِ محیطی خوانده می‌شود و هیچ‌جا ذخیره یا چاپ نمی‌شود.
   در پایان همه‌ی حساب‌های آزمایشی «حذفِ نرم» می‌شوند.

   ⚠️ پس از اجرا این سه ردیف در users می‌مانند (وضعیتِ deleted): تاریخچه‌ی
   اقدام‌ها پاک‌نشدنی است و با ON DELETE RESTRICT به کاربر گره خورده، پس حذفِ
   سختِ این حساب‌ها (مثلاً در پاک‌سازیِ مهاجرتِ ۱۰۸) خطا می‌دهد. عمدی است:
   سابقه‌ی اقدام‌ها نباید با پاک‌کردنِ کاربر گم شود. */

const BASE = process.env.BASE || 'https://billiardhub.net'
const OWNER = { phone: '09121327283', password: process.env.OWNER_PASSWORD }
const TP = process.env.TEST_PASSWORD
const A = { phone: '09000000101', password: TP }, B = { phone: '09000000102', password: TP }, C = { phone: '09000000103', password: TP }

if (process.env.ENFORCEMENT_LIVE !== '1' || !OWNER.password || !TP) {
  console.error('اجرا نشد: ENFORCEMENT_LIVE=1 و OWNER_PASSWORD و TEST_PASSWORD لازم است.')
  process.exit(2)
}
for (const u of [A, B, C]) if (!/^0900000010[1-3]$/.test(u.phone)) { console.error('شماره‌ی آزمایشی بیرون از بازه'); process.exit(2) }

let pass = 0, fail = 0
const t = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `   ${extra}`}`) }
const head = s => console.log(`\n■ ${s}`)

/* ── یک مرورگرِ کوچک: کوکی، CSRF، Origin ── */
function client() {
  const jar = new Map()
  const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
  async function req(method, path, body, extraHeaders = {}) {
    const h = { Origin: BASE, ...extraHeaders }
    if (jar.size) h.Cookie = cookieHeader()
    if (!['GET', 'HEAD'].includes(method) && jar.get('bh_csrf')) h['x-csrf-token'] = decodeURIComponent(jar.get('bh_csrf'))
    if (body !== undefined) h['Content-Type'] = 'application/json'
    const r = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' })
    for (const c of r.headers.getSetCookie?.() ?? []) {
      const [kv] = c.split(';'); const i = kv.indexOf('=')
      const k = kv.slice(0, i).trim(), v = kv.slice(i + 1).trim()
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(c) || v === '') jar.delete(k); else jar.set(k, v)
    }
    let json = null; try { json = await r.clone().json() } catch { /* بدنه‌ی غیرِ JSON */ }
    return { status: r.status, json, location: r.headers.get('location') }
  }
  return { req, jar }
}
async function login(u) {
  const c = client()
  const r = await c.req('POST', '/api/auth/login', { phone: u.phone, password: u.password })
  return { c, r, legacy: r.json?.token ?? null, id: r.json?.user?.id ?? null }
}
const act = (owner, userId, action, extra = {}) =>
  owner.c.req('POST', '/api/owner/enforcement', { userId, action, reason: 'other', note: 'آزمونِ نفوذِ خودکار', ...extra })
const gate = r => r.status === 403 && ['ACCOUNT_BLOCKED', 'ACCOUNT_RESTRICTED', 'FEATURE_RESTRICTED'].includes(r.json?.code)

head('ورود')
const O = await login(OWNER); t('مالک وارد شد', O.r.status === 200, `status ${O.r.status}`)
let a = await login(A); t('A وارد شد', a.r.status === 200, `status ${a.r.status}`)
const b = await login(B); t('B وارد شد', b.r.status === 200, `status ${b.r.status}`)
const c = await login(C); t('C (ادمینِ محدود) وارد شد', c.r.status === 200, `status ${c.r.status}`)
if (fail) { console.log('\nپیش‌نیازها برقرار نیست؛ توقف.'); process.exit(1) }
const ownerId = O.id

head('ارتقای دسترسی — غیرِمالک به پنلِ مالک نمی‌رسد')
t('A: GET پنل ⟵ ۴۰۳', (await a.c.req('GET', '/api/owner/enforcement')).status === 403)
t('A: اقدام روی B ⟵ ۴۰۳', (await act(a, b.id, 'ban', { reason: 'spam' })).status === 403)
t('A: با هدرها/کوکی‌های جعلی (x-user-id، role=admin) ⟵ ۴۰۳',
  (await a.c.req('GET', '/api/owner/enforcement', undefined, { 'x-user-id': ownerId, 'x-role': 'owner', Cookie: `${[...a.jar].map(([k, v]) => `${k}=${v}`).join('; ')}; role=admin; is_owner=1` })).status === 403)
t('A: توکنِ جعل‌شده با نقشِ admin (امضای نادرست) ⟵ بی‌هویت',
  [401, 403].includes((await client().req('GET', '/api/owner/enforcement', undefined, { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIn0.x' })).status))
t('C (ادمین): GET پنلِ مالک ⟵ ۴۰۳', (await c.c.req('GET', '/api/owner/enforcement')).status === 403)
t('C (ادمین): ویرایشِ مشخصاتِ مالک ⟵ ۴۰۳',
  (await c.c.req('PATCH', '/api/admin/users', { userId: ownerId, fields: { firstName: 'x' } })).status === 403)
t('مالک: اقدام روی خودش ⟵ رد', (await act(O, ownerId, 'ban')).status === 400)

head('تعلیقِ A — همه‌ی راه‌های دورزدن')
const until = new Date(Date.now() + 864e5).toISOString()
const sus = await act(O, a.id, 'suspend', { expiresAt: until, reason: 'spam' })
t('مالک A را تعلیق کرد', sus.status === 200, JSON.stringify(sus.json))
/* کوکیِ دسترسی پیش از آزمونِ تمدید (که کوکی‌ها را پاک می‌کند) نگه داشته می‌شود */
const aAt = a.jar.get('bh_at') ?? ''
t('A: GET عمومی با کوکی ⟵ ۴۰۳ ACCOUNT_BLOCKED', gate(await a.c.req('GET', '/api/clubs')))
t('A: توکنِ قدیمیِ هفت‌روزه در هدر ⟵ ۴۰۳', gate(await client().req('GET', '/api/clubs', undefined, { Authorization: `Bearer ${a.legacy}` })))
t('A: تمدیدِ نشست ⟵ ۴۰۳ یا ۴۰۱ (نشست باطل شده)', [401, 403].includes((await a.c.req('POST', '/api/auth/refresh')).status))
t('A: ورودِ دوباره ⟵ ۴۰۳ با پیامِ وضعیت', (await login(A)).r.json?.code === 'ACCOUNT_BLOCKED')
t('A: adopt با توکنِ قدیمی ⟵ ۴۰۳', (await client().req('POST', '/api/auth/adopt', { token: a.legacy })).status === 403)
const st = await client().req('GET', '/api/account/status', undefined, { Authorization: `Bearer ${a.legacy}` })
t('A: وضعیتِ خودش را می‌بیند (suspended)', st.json?.status === 'suspended')
t('A: پیام شاملِ یادداشتِ داخلی نیست', !JSON.stringify(st.json).includes('آزمونِ نفوذ'))
t('A: صفحه‌ی داشبورد ⟵ /account-status', (await client().req('GET', '/dashboard', undefined, { Cookie: `bh_at=${aAt}` })).location?.includes('/account-status') ?? false)

head('restricted و limited — B')
t('مالک B را restricted کرد', (await act(O, b.id, 'restrict')).status === 200)
t('B: GET آزاد', (await b.c.req('GET', '/api/account/status')).status === 200)
t('B: POST رزرو ⟵ ۴۰۳ ACCOUNT_RESTRICTED', (await b.c.req('POST', '/api/bookings', {})).json?.code === 'ACCOUNT_RESTRICTED')
t('B: پشتیبانی از دروازه رد می‌شود', !gate(await b.c.req('POST', '/api/support', {})))
t('مالک B را limited (بازار) کرد', (await act(O, b.id, 'limit', { restrictions: ['market'] })).status === 200)
t('B: POST بازار ⟵ ۴۰۳ FEATURE_RESTRICTED', (await b.c.req('POST', '/api/market', {})).json?.code === 'FEATURE_RESTRICTED')
t('B: POST رزرو از دروازه رد می‌شود', !gate(await b.c.req('POST', '/api/bookings', {})))
const enc = await b.c.req('POST', '/api/m%61rket', {})
t('B: مسیرِ رمزگذاری‌شده (/api/m%61rket) یا رد یا ناموجود — هرگز اجرا', enc.status === 403 || enc.status === 404, `status ${enc.status}`)

head('بازگرداندن و تاریخچه')
t('مالک A را بازگرداند', (await act(O, a.id, 'restore', { reason: 'mistake' })).status === 200)
a = await login(A)
t('A: ورود دوباره کار می‌کند', a.r.status === 200)
t('A: GET عمومی آزاد', !gate(await a.c.req('GET', '/api/clubs')))
const h = await O.c.req('GET', `/api/owner/enforcement/${a.id}`)
t('تاریخچه‌ی A دست‌کم دو اقدام دارد', (h.json?.history?.length ?? 0) >= 2)
t('تاریخچه دلیل، یادداشت، اقدام‌کننده و انقضا دارد',
  !!h.json?.history?.some(x => x.reason_code === 'spam' && x.internal_note && x.actor_id === ownerId && x.expires_at))

head('پاک‌سازی — حذفِ نرمِ حساب‌های آزمایشی')
for (const u of [a, b, c]) t(`حذفِ نرمِ ${u.id?.slice(0, 8)}`, (await act(O, u.id, 'delete', { reason: 'other' })).status === 200)
t('حسابِ حذف‌شده وارد نمی‌شود', (await login(A)).r.json?.code === 'ACCOUNT_BLOCKED')

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
