/* قفلِ استعلام‌های پولی + مسیرِ تیکتِ پشتیبانی.
       node scripts/test-verification-lock.mjs

   چیزی که این‌جا سنجیده می‌شود «آیا دکمه خاموش می‌شود» نیست — آن را
   می‌شود با یک رفرش دور زد. سنجشِ اصلی این است که قفل *سمتِ سرور* و
   *پیش از فراخوانِ سرویسِ پولی* اعمال شود، و هیچ راهِ فراری (حذفِ
   کارت، مسیرِ دوم، مسیرِ بی‌شناسه) باز نمانده باشد. */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(join(here, '..', p), 'utf8')
/* کامنت‌ها کنار گذاشته می‌شوند: بارها متنی که باید حذف می‌شد در
   توضیحِ همان حذف مانده و سنجش را به‌دروغ قرمز کرده. */
const code = p => read(p).replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\//g, '')

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '\n      ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

/* ── منبعِ واحدِ قفل ── */
{
  head('کتابخانه‌ی قفل')
  const lock = read('lib/verification-lock.ts')
  t('پاسخِ استاندارد وجود دارد', /export function lockedResponse/.test(lock))
  /* ۴۰۹ نه ۴۰۳: مشکل دسترسیِ کاربر نیست، وضعیتِ منبع است */
  t('کدِ وضعیت ۴۰۹ است', /status: 409/.test(lock))
  t('پیام کاربر را به تماس با ما می‌فرستد',
    /تماس با ما/.test(lock) && /تیکت/.test(lock))
  t('موضوعِ تیکت هم برمی‌گردد', /supportSubject/.test(lock))
  t('هر دو موضوع تعریف شده‌اند',
    /درخواست تغییر کد پستی/.test(lock) && /درخواست ویرایش اطلاعات بانکی/.test(lock))
}

/* ── کد پستی ── */
{
  head('قفلِ کد پستی')
  const r = code('app/api/address/postal-code/route.ts')

  t('قفل بررسی می‌شود', /postalCodeVerified && !admin\) return lockedResponse\('postal'\)/.test(r))
  /* حیاتی: اگر بعد از lookup باشد، هزینه‌اش را داده‌ایم */
  t('قفل پیش از فراخوانِ سرویسِ پولی است',
    r.indexOf("lockedResponse('postal')") < r.indexOf('await lookupPostalCode'),
    `lock@${r.indexOf("lockedResponse('postal')")} lookup@${r.indexOf('await lookupPostalCode')}`)
  t('استعلامِ موفق فلگ را می‌نویسد', /postalCodeVerified: true/.test(r))
  /* مسیرِ بی‌clubId یک استعلامِ رایگان بود که هیچ‌جا ذخیره نمی‌شد */
  t('بدونِ شناسه‌ی باشگاه رد می‌شود', /if \(!clubId && !admin\)/.test(r))
  t('ادمین مستثناست', /const admin = await isAdmin\(actor\.id\)/.test(r))
  t('نبودِ ستون استعلام را نمی‌شکند', /isMissingColumn\(clubErr\.message\)/.test(r))

  /* مسیرِ دومِ استعلام که هیچ فراخوانی نداشت و فقط اعتبار می‌سوزاند */
  let dead = false
  try { read('app/api/postal-code/route.ts'); dead = true } catch { /* حذف شده */ }
  t('مسیرِ بدونِ‌کاربردِ /api/postal-code حذف شده', !dead)
}

/* ── بانکی ── */
{
  head('قفلِ اطلاعات بانکی')
  const user = code('app/api/users/bank-card/route.ts')
  const c2i = code('app/api/bank/card-to-iban/route.ts')
  const vib = code('app/api/bank/verify-iban/route.ts')

  t('کارتِ کاربر قفل می‌شود', /if \(u\.bank_card_verified\) return lockedResponse\('bank'\)/.test(user))
  t('قفل پیش از matchCard است',
    user.indexOf("lockedResponse('bank')") < user.indexOf('await matchCard'),
    `lock@${user.indexOf("lockedResponse('bank')")} match@${user.indexOf('await matchCard')}`)
  t('ثبتِ موفق فلگ را می‌نویسد', /bank_card_verified: true/.test(user))
  /* راهِ فرار: حذف کن و دوباره ثبت کن ⇒ استعلامِ تازه */
  t('حذفِ کارت پس از تأیید بسته است',
    /export async function DELETE[\s\S]*?bank_card_verified[\s\S]*?lockedResponse\('bank'\)/.test(user))

  t('حسابِ باشگاه (کارت‌به‌شبا) قفل می‌شود', /ibanVerified && !admin\) return lockedResponse\('bank'\)/.test(c2i))
  t('قفل پیش از هر سه استعلام است',
    c2i.indexOf("lockedResponse('bank')") < c2i.indexOf('await matchCard'))
  /* مسیرِ دومِ رسیدن به همان ستون */
  t('مسیرِ شبای مستقیم هم قفل است', /ibanVerified && !admin\) return lockedResponse\('bank'\)/.test(vib))
  t('قفل پیش از matchIban است',
    vib.indexOf("lockedResponse('bank')") < vib.indexOf('await matchIban'))
}

/* ── UI ── */
{
  head('رابطِ کاربری')
  const dash = code('app/dashboard/club/page.tsx')
  const me = code('app/profile/me/page.tsx')

  /* قفلِ قبلی حالتِ ری‌اکت بود و رفرش بازش می‌کرد */
  t('قفلِ کد پستی از سرور می‌آید', /const \[postalVerified, setPostalVerified\]/.test(dash))
  t('و در محاسبه‌ی قفل به کار می‌رود', /postalLocked = postalVerified \|\|/.test(dash))
  t('هنگام بارگذاری از باشگاه خوانده می‌شود', /setPostalVerified\(c\.postalCodeVerified/.test(dash))
  t('خودِ فیلدِ کد پستی هم قفل می‌شود', /readOnly=\{postalLocked\}/.test(dash))
  t('لینکِ تیکت کنارش هست', /subject=\$\{encodeURIComponent\('درخواست تغییر کد پستی'\)\}/.test(dash))

  /* دکمه‌ای که خودِ کاربر با آن قفل را باز می‌کرد */
  t('دکمه‌ی «تغییر حساب» خودخدمتی حذف شد', !/onClick=\{\(\) => setBankUnlockAsk\(true\)\}/.test(dash))
  t('تابعِ unlockBank حذف شد', !/const unlockBank = \(\)/.test(dash))
  t('جایش لینکِ پشتیبانی آمد', /درخواست تغییر حساب/.test(dash))

  t('پروفایل: دکمه‌ی «تغییر کارت» حذف شد',
    !/onClick=\{\(\) => \{ setCardLocked\(false\); setBankCard\(''\) \}\}/.test(me))
  t('پروفایل: لینکِ پشتیبانی آمد', /درخواست تغییر کارت از پشتیبانی/.test(me))
  t('پروفایل: قفل از فلگِ سرور خوانده می‌شود', /setCardLocked\(j\.bankCardVerified/.test(me))
  t('پروفایل API فلگ را برمی‌گرداند',
    /bankCardVerified: !!u\.bank_card_verified/.test(read('app/api/users/profile/route.ts')))
}

/* ── تماس با ما ── */
{
  head('تماس با ما')
  const page = code('app/contact/page.tsx')
  const api = code('app/api/contact/route.ts')

  t('موضوعِ تغییر کد پستی اضافه شد', /'درخواست تغییر کد پستی'/.test(page))
  t('موضوعِ ویرایش اطلاعات بانکی اضافه شد', /'درخواست ویرایش اطلاعات بانکی'/.test(page))
  t('فرم به مسیرِ واقعی پست می‌کند', /fetch\('\/api\/contact'/.test(page))
  /* پیش‌تر در شکست، پیام در localStorage می‌ماند و باز هم «ارسال شد»
     نشان داده می‌شد — یعنی تیکت هرگز به کسی نمی‌رسید */
  t('دیگر به localStorage نمی‌ریزد', !/bh_contact_messages/.test(page))
  t('شکستِ ارسال به کاربر گفته می‌شود', /errors\.submit/.test(page))
  t('موضوع از لینک پیش‌پر می‌شود', /searchParams|URLSearchParams/.test(page))

  t('مسیرِ تیکت وجود دارد', /export async function POST/.test(api))
  t('در جدولِ تیکت ذخیره می‌کند', /from\('support_tickets'\)\.insert/.test(api))
  t('موضوعِ دلخواه پذیرفته نمی‌شود', /SUBJECTS\.includes\(subject\)/.test(api))
  t('سقفِ نرخ دارد', /hitRateLimit/.test(api))
  /* اگر جدول نباشد نباید «ارسال شد» بگوید */
  t('در شکست، موفقیتِ دروغین نمی‌دهد', /status: 503/.test(api))
  t('مالکیتِ باشگاه سمتِ سرور بررسی می‌شود', /ownerId.*=== actor\.id/.test(api))
}

/* ── ادمین ── */
{
  head('پنلِ ادمین')
  const api = code('app/api/admin/support/route.ts')
  const page = code('app/admin/support/page.tsx')
  const home = code('app/admin/page.tsx')

  t('فقط ادمین دسترسی دارد', (api.match(/await isAdmin\(actor\.id\)/g) ?? []).length >= 2)
  t('بازکردنِ قفلِ کد پستی', /postalCodeVerified: false/.test(api))
  t('بازکردنِ قفلِ بانکی', /bank_card_verified: false/.test(api))
  t('قفلِ شبای باشگاه هم باز می‌شود', /ibanVerified: false/.test(api))
  t('در ممیزی ثبت می‌شود', /action: 'unlock_postal_code'/.test(api) && /action: 'unlock_bank_info'/.test(api))
  /* ادمین نباید مقدار را دستی بنویسد؛ باید از استعلام رد شود */
  t('ادمین مقدارِ بانکی را مستقیم نمی‌نویسد', !/bank_card:/.test(api))
  t('ادمین کد پستی را مستقیم نمی‌نویسد', !/postalCode:/.test(api))

  t('صفحه‌ی ادمین ساخته شد', /export default function AdminSupportPage/.test(page))
  t('وضعیتِ قفل کنارِ تیکت دیده می‌شود', /postalCodeVerified/.test(page) && /bank_card_verified/.test(page))
  t('پس از عمل، از سرور دوباره می‌خواند', /await load\(\)/.test(page))
  t('در فهرستِ پنل ادمین آمده', /\/admin\/support/.test(home))
}

/* ── مهاجرت ── */
{
  head('مهاجرت ۰۳۹')
  const m = read('../../supabase/migrations/039_verification_locks_support.sql')
  t('فلگِ کد پستی', /"postalCodeVerified" boolean NOT NULL DEFAULT false/.test(m))
  t('فلگِ کارتِ کاربر', /bank_card_verified boolean NOT NULL DEFAULT false/.test(m))
  t('جدولِ تیکت', /CREATE TABLE IF NOT EXISTS public\.support_tickets/.test(m))
  /* بدونِ بک‌فیل، همه‌ی کاربرانِ فعلی یک استعلامِ رایگانِ اضافه می‌گرفتند */
  t('بک‌فیلِ کاربرانِ فعلی', /UPDATE public\.users[\s\S]*?SET bank_card_verified = true/.test(m))
  t('بک‌فیلِ باشگاه‌های فعلی', /UPDATE public\.clubs[\s\S]*?SET "postalCodeVerified" = true/.test(m))
  t('idempotent است', (m.match(/IF NOT EXISTS/g) ?? []).length >= 4)
  t('RLS روشن است', /ENABLE ROW LEVEL SECURITY/.test(m))
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
