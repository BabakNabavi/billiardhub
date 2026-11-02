/* استعلامِ ثبت‌احوال در ثبت‌نام — بدون شبکه؛ fetch جعل می‌شود.
       npx tsx scripts/test-identity-verify.mjs
   یا `npm run test:identity`.

   چرا تست دارد (آبانِ ۱۴۰۵، گزارشِ مالک از ثبت‌نامِ واقعی): کاربری تاریخ
   تولدِ اشتباه زد و حسابش ساخته شد. ثبت‌احوال جوابِ «کسی با این تاریخ
   نیست» داده بود، ولی متنِ پیامش با چند عبارتِ حدسی نمی‌خواند، پس
   «سرویس در دسترس نیست» خوانده شد و مسیر به شاهکار بسنده کرد. این فایل
   می‌سنجد که هیچ جوابِ ناشناخته‌ای دیگر «تأیید» نشود. */

/* زنجیره‌ی importِ otp-server نشانیِ Supabase را هنگامِ بارگذاری می‌خواهد؛
   هیچ درخواستی به آن نمی‌رود (requireOtp: false) */
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:1'
const { verifyPerson, identitySubject } = await import('../lib/shahkar-server.ts')
const { canonicalBirthDate } = await import('../lib/jalali.ts')

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

/* پاسخِ جعلی؛ `bodies` به ترتیبِ فراخوان مصرف می‌شود */
let calls = []
const fake = (...bodies) => {
  calls = []
  globalThis.fetch = async (_url, init) => {
    calls.push(JSON.parse(String(init?.body ?? '{}')))
    const b = bodies.shift() ?? { status: 200, json: { success: true, data: null } }
    return new Response(JSON.stringify(b.json), { status: b.status ?? 200 })
  }
}
process.env.SAPIR_API_KEY = 'test-key-not-a-guid'
const quiet = console.error
console.error = () => {}

const NC = '0012345679', M = '09121234567'
const run = (bd = '1370/5/12', f = 'علی', l = 'رضایی') => verifyPerson(M, NC, bd, f, l, { requireOtp: false })

head('۱) هیچ جوابِ ناشناخته‌ای «تأیید» نیست')
for (const message of ['کد ملی و تاریخ تولد همخوانی ندارند', 'تاریخ تولد فاقد اعتبار است', 'اطلاعات نامعتبر', '', null]) {
  fake({ json: { success: true, data: null, message } }, { json: { success: true, data: null, message } })
  const r = await run()
  t(`data خالی با پیامِ «${message}» ⟵ مغایرت`, r.ok === true && r.match === false, JSON.stringify(r))
}
{
  fake({ status: 400, json: { success: false, code: 400, message: 'bad' } }, { status: 400, json: { success: false } })
  const r = await run()
  t('success=false ⟵ مغایرت', r.ok === true && r.match === false, JSON.stringify(r))
}

head('۲) سرویسِ در دسترس نبودن ⟵ «نمی‌دانیم»، و فراخوان باید ببندد')
for (const [label, b] of [
  ['۴۰۳', { status: 403, json: { message: 'forbidden' } }],
  ['trust level', { json: { success: false, message: 'trust level is not enough' } }],
  ['اعتبارِ حساب', { json: { success: false, message: 'اعتبار حساب شما کافی نیست' } }],
  ['۵۰۰', { status: 500, json: { success: false } }],
]) {
  fake(b)
  const r = await run()
  t(`${label} ⟵ unavailable`, r.ok === false && r.unavailable === true && r.match !== true, JSON.stringify(r))
}
{
  globalThis.fetch = async () => { throw new Error('ECONNRESET') }
  const r = await run()
  t('قطعِ شبکه ⟵ unavailable', r.ok === false && r.unavailable === true, JSON.stringify(r))
}

head('۳) پیدا شد ⟵ نام و تاریخ سنجیده می‌شوند')
{
  fake({ json: { success: true, data: { firstName: 'علي', lastName: 'رضائی', alive: true } } })
  const r = await run()
  t('ی/ک عربی یکی است ولی «رضائی» ≠ «رضایی»', r.match === false, JSON.stringify(r))
}
{
  fake({ json: { success: true, data: { firstName: 'محمد علی', lastName: 'رضایی' } } })
  const r = await run('1370/05/12', 'محمدعلی', 'رضایی')
  t('«محمد علی» = «محمدعلی»', r.ok === true && r.match === true, JSON.stringify(r))
}
{
  fake({ json: { success: true, data: { firstName: 'محمّد', lastName: 'رضایی' } } })
  const r = await run('1370/05/12', 'محمد', 'رضایی')
  t('تشدید در ثبت‌احوال: «محمّد» = «محمد»', r.match === true, JSON.stringify(r))
}
{
  fake({ json: { success: true, data: { firstName: 'محمد', lastName: 'رضایی' } } })
  const r = await run('1370/05/12', 'محمود', 'رضایی')
  t('…ولی «محمود» ≠ «محمد»', r.match === false, JSON.stringify(r))
}
{
  fake({ json: { success: true, data: { firstName: 'علی', lastName: 'رضایی', alive: false } } })
  const r = await run()
  t('فوت‌شده ⟵ رد', r.match === false, JSON.stringify(r))
}
{
  fake({ json: { success: true, data: { firstName: 'علی', lastName: 'رضایی', birthDate: '1371/05/12' } } })
  const r = await run()
  t('تاریخِ برگشتی ≠ تاریخِ واردشده ⟵ رد', r.match === false, JSON.stringify(r))
}

head('۴) قالبِ تاریخ')
{
  fake({ json: { success: true, data: null } }, { json: { success: true, data: { firstName: 'علی', lastName: 'رضایی' } } })
  const r = await run('1370/5/2')
  t('اول ۱۳۷۰/۰۵/۰۲ و بعد ۱۳۷۰/۵/۲', calls.map(c => c.birthDate).join(',') === '1370/05/02,1370/5/2', JSON.stringify(calls))
  t('…و با قالبِ دوم تأیید شد', r.match === true, JSON.stringify(r))
}
{
  fake({ json: { success: true, data: null } })
  await run('1370/11/12')
  t('تاریخِ بی‌صفر یک استعلام می‌خورد', calls.length === 1, String(calls.length))
}
{
  fake()
  const r = await run('1370/13/40')
  t('تاریخِ ناموجود ⟵ بدونِ استعلام رد', r.ok === false && calls.length === 0, JSON.stringify(r))
}
t('۳۰ اسفندِ ۱۴۰۲ (غیرکبیسه) نیست', canonicalBirthDate('1402/12/30') === null)
t('۳۰ اسفندِ ۱۴۰۳ (کبیسه) هست', canonicalBirthDate('1403/12/30') === '1403/12/30')
t('روزِ آینده نیست', canonicalBirthDate('1499/01/01') === null)
t('ارقامِ فارسی', canonicalBirthDate('۱۳۶۳/۶/۲') === '1363/06/02')

head('۵) نشانِ تأیید به همه‌ی اجزای هویت بند است')
{
  const a = identitySubject(NC, '1370/5/12', 'علی', 'رضایی')
  t('قالبِ تاریخ و فاصله فرقی نمی‌کند', a === identitySubject(NC, '1370/05/12', ' علي ', 'رضایی'))
  t('تاریخِ دیگر ⟵ نشانِ دیگر', a !== identitySubject(NC, '1370/5/13', 'علی', 'رضایی'))
  t('نامِ دیگر ⟵ نشانِ دیگر', a !== identitySubject(NC, '1370/5/12', 'حسن', 'رضایی'))
  /* همان چیزی که دو مسیر واقعا می‌سازند: /api/shahkar نامِ zod-trim و تاریخِ
     تقویم را می‌گیرد، register هم zod-trim و تاریخِ خامِ فرم را */
  const { PersonName } = await import('../lib/auth/person-name.ts')
  const shahkarSide = identitySubject('0012345679', '1370/5/12', PersonName.parse(' علی'), PersonName.parse('رضایی '))
  const registerSide = identitySubject(' 0012345679 ', '۱۳۷۰/۰۵/۱۲', PersonName.parse('علی '), PersonName.parse(' رضایی'))
  t('نشانِ /api/shahkar = نشانی که register می‌سنجد', shahkarSide === registerSide, `${shahkarSide} vs ${registerSide}`)
  t('تاریخِ نامعتبر نشانِ هیچ هویتِ درستی را نمی‌سازد', identitySubject(NC, '1370/13/12', 'علی', 'رضایی') !== a)
}

head('۶) بی‌کلید در پروداکشن «تأیید» نیست')
{
  delete process.env.SAPIR_API_KEY; delete process.env.SMS_API_KEY
  const env = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  const r = await run()
  t('بی‌کلید ⟵ unavailable', r.ok === false && r.unavailable === true, JSON.stringify(r))
  process.env.NODE_ENV = env
}

console.error = quiet
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
