/* تست قفلِ «نام مدیر» در اطلاعات باشگاه.
       node scripts/test-manager-name.mjs        (نیاز به سرور روی 3300)

   قاعده: نام مدیرِ باشگاه همیشه نام و نام خانوادگیِ احرازشده‌ی مالک
   است. قفلِ UI کافی نیست — هرکس می‌تواند مستقیم PUT بزند — پس سرور
   باید هر managerName ای که از مرورگر بیاید دور بریزد و خودش مقدار
   درست را بنویسد. این تست دقیقاً همان دور ریختن را می‌سنجد. */

const BASE = process.env.BH_BASE ?? 'http://127.0.0.1:3300'

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !extra ? '' : `\n      ${extra}`}`)
}
const head = s => console.log(`\n■ ${s}`)

/* ── ورود ─────────────────────────────────────────────────────────
   از حساب واقعیِ موجود استفاده می‌شود، نه ساختِ حساب تازه: تست نباید
   ردِ داده در دیتابیس بگذارد. */
const PHONE = process.env.BH_TEST_PHONE
const PASS = process.env.BH_TEST_PASS
if (!PHONE || !PASS) {
  console.log('\n  ⏭  BH_TEST_PHONE / BH_TEST_PASS تنظیم نشده — تستِ شبکه رد شد.')
  console.log('     (بخشِ ایستا در ادامه همچنان اجرا می‌شود)\n')
}

const jar = new Map()
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
const remember = res => {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const i = pair.indexOf('=')
    jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim())
  }
}
const call = async (path, init = {}) => {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(jar.size ? { cookie: cookieHeader() } : {}),
      ...(jar.has('bh_csrf') ? { 'x-csrf-token': jar.get('bh_csrf') } : {}),
      ...init.headers,
    },
  })
  remember(res)
  const text = await res.text()
  let body = null
  try { body = JSON.parse(text) } catch { body = text }
  return { status: res.status, body }
}

if (PHONE && PASS) {
  head('۱) ورود و یافتن باشگاه')
  const login = await call('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ phone: PHONE, password: PASS }),
  })
  t('ورود موفق', login.status === 200, `وضعیت ${login.status}: ${JSON.stringify(login.body).slice(0, 160)}`)

  if (login.status === 200) {
    const mine = await call('/api/clubs/my-clubs')
    const clubs = Array.isArray(mine.body) ? mine.body : (mine.body?.data ?? [])
    t('حداقل یک باشگاه دارد', clubs.length > 0, `دریافت ${clubs.length} باشگاه`)

    if (clubs.length > 0) {
      const id = clubs[0].id
      const before = await call(`/api/clubs/${id}`)
      const original = before.body?.managerName ?? ''
      console.log(`     باشگاه: ${before.body?.name} — نام مدیرِ فعلی: «${original}»`)

      head('۲) تلاش برای جعلِ نام مدیر از راه API')
      const FORGED = 'نامِ جعلیِ آزمایشی'
      const put = await call(`/api/clubs/${id}`, {
        method: 'PUT',
        /* فقط همین یک فیلد فرستاده می‌شود تا اگر سرور بی‌دفاع بود،
           اثرش قطعی و بدون ابهام دیده شود. */
        body: JSON.stringify({ managerName: FORGED }),
      })
      t('درخواست رد نشد (۲۰۰ — سرور بی‌صدا فیلد را نادیده می‌گیرد)',
        put.status === 200, `وضعیت ${put.status}`)

      const after = await call(`/api/clubs/${id}`)
      const now = after.body?.managerName ?? ''
      t('نامِ جعلی ذخیره نشد', now !== FORGED, `در دیتابیس نشست: «${now}»`)

      /* نامِ نوشته‌شده باید همان نامِ کاربر باشد، نه فقط «جعلی نیست» */
      const me = await call('/api/users/profile')
      const u = me.body?.user ?? me.body
      const verified = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim()
      if (verified) {
        t(`نام مدیر برابر نام احرازشده است («${verified}»)`, now === verified,
          `انتظار «${verified}» — دریافت «${now}»`)
      } else {
        console.log('     ⏭  کاربر نام ثبت‌شده ندارد؛ مقایسه‌ی برابری رد شد.')
      }

      head('۳) ویرایش عادی هنوز کار می‌کند')
      const desc = before.body?.description ?? ''
      const edit = await call(`/api/clubs/${id}`, {
        method: 'PUT', body: JSON.stringify({ description: desc }),
      })
      t('ویرایش فیلدهای مجاز ۲۰۰ می‌دهد', edit.status === 200, `وضعیت ${edit.status}`)
      const back = await call(`/api/clubs/${id}`)
      t('نام مدیر پس از ویرایش عادی هم درست مانده',
        (back.body?.managerName ?? '') === now)
    }
  }
}

/* ── بخشِ ایستا: خودِ کد ────────────────────────────────────────────
   این‌ها بدون سرور هم اجرا می‌شوند و نگهبانِ رگرسیون‌اند: اگر کسی
   دوباره فیلد را ویرایش‌پذیر کند، این‌جا قرمز می‌شود. */
head('۴) بازرسی کد')
const { readFileSync } = await import('node:fs')
const { fileURLToPath } = await import('node:url')
const { dirname, join } = await import('node:path')
const here = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(join(here, '..', p), 'utf8')

const api = read('app/api/clubs/[id]/route.ts')
t('سرور managerName ی ورودی را حذف می‌کند',
  /delete\s*\(body as Record<string, unknown>\)\.managerName/.test(api))
t('سرور نام را از رکورد کاربرِ مالک می‌خواند',
  /from\('users'\)[\s\S]{0,80}firstName[\s\S]{0,200}club\.ownerId/.test(api))

const dash = read('app/dashboard/club/page.tsx')
t('فیلد داشبورد readOnly است', /label="نام مدیر"\s+readOnly/.test(dash))
t('مقدار از نام احرازشده می‌آید', /value=\{verifiedManagerName/.test(dash))
t('onChange دیگر state را عوض نمی‌کند',
  !/managerName:\s*v\}/.test(dash), 'هنوز جایی managerName را از ورودی می‌نویسد')

const neu = read('app/clubs/new/page.tsx')
t('فرم ثبت اولیه هم نام را مشتق می‌گیرد',
  /const managerName = `\$\{user\?\.firstName/.test(neu))

head('۵) برچسب «مربی»')
for (const [file, src] of [['clubs/new', neu], ['dashboard/club', dash], ['clubs/[id]', read('app/clubs/[id]/page.tsx')]]) {
  t(`${file}: «مربی حرفه‌ای» دیگر نیست`, !src.includes('مربی حرفه‌ای'))
  t(`${file}: برچسب «مربی» هست`, /label:\s*'مربی'/.test(src))
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
