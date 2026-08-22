/* قفلِ استعلام‌های پولی + مسیرِ تیکتِ پشتیبانی.
       node scripts/test-verification-lock.mjs

   چیزی که این‌جا سنجیده می‌شود «آیا دکمه خاموش می‌شود» نیست — آن را
   می‌شود با یک رفرش دور زد. سنجشِ اصلی این است که قفل *سمتِ سرور* و
   *پیش از فراخوانِ سرویسِ پولی* اعمال شود، و هیچ راهِ فراری (حذفِ
   کارت، مسیرِ دوم، مسیرِ بی‌شناسه) باز نمانده باشد. */

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(join(here, '..', p), 'utf8')
/* کامنت‌ها کنار گذاشته می‌شوند: بارها متنی که باید حذف می‌شد در
   توضیحِ همان حذف مانده و سنجش را به‌دروغ قرمز کرده. */
const code = p => read(p)
  .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\//g, '')
  /* `[^:]` تا `https://` سالم بماند */
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1')

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
  t('فرم به مسیرِ واقعی پست می‌کند', /apiFetch\('\/api\/contact'/.test(page))
  /* ⚠️ با fetchِ خام درخواست بدونِ هدرِ CSRF می‌رود و سرور ۴۰۳ می‌دهد */
  t('و از راهِ apiFetch تا هدرِ CSRF بیاید', /import \{ apiFetch \} from/.test(page))
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

  t('هر دو هندلر با کلیدِ support قفل‌اند',
    (api.match(/await can\(actor\.id, 'support'\)/g) ?? []).length >= 2)
  /* گاردِ ضدِ پس‌رفت: برگشت به isAdminِ همه‌کاره یعنی ادمینِ محدودِ
     بی‌ربط هم می‌تواند قفلِ بانکیِ کاربران را باز کند. */
  t('به isAdminِ همه‌کاره برنگشته', !/await isAdmin\(actor\.id\)/.test(api))
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

/* ── «منتشرشده» در میزِ تیکِ آبی ──
   تیک فقط به چیزی داده می‌شود که در سایت دیده می‌شود. تعریفِ
   «دیده می‌شود» یک‌جا در API نوشته شده؛ اگر صفحه‌ی ادمین همان را
   تکرار نکند، ادمین به باشگاهی تیک می‌دهد که هیچ‌کس نمی‌بیندش. */
{
  head('میزِ تیکِ آبی — همانِ شرطِ فهرستِ عمومی')
  const api = code('app/api/clubs/route.ts')
  const page = code('app/admin/verified/page.tsx')

  /* شرطِ مرجع: هم isActive، هم یکی از دو وضعیتِ تأیید */
  t('API هنوز روی isActive فیلتر می‌کند',
    /\.eq\('isActive', true\)/.test(api) && /verificationStatus'?, \['verified', 'approved'\]/.test(api))

  t('صفحه‌ی ادمین هم isActive را می‌خواند', /isActive !== false/.test(page))
  t('و هر دو وضعیتِ تأیید را می‌پذیرد',
    /verificationStatus === 'verified'/.test(page) && /verificationStatus === 'approved'/.test(page))

  /* دکمه‌ی اعطا باید به همین published قفل باشد، نه فقط رنگش */
  const row = code('components/admin/VerifiedRow.tsx')
  t('دکمه‌ی اعطا با منتشرنشده قفل است', /const locked = busy \|\| !row\.published/.test(row))
  t('و نشانِ «منتشر نشده» نشان داده می‌شود', /منتشر نشده/.test(row))

  /* صفِ «در انتظار» نباید ردیفِ منتشرنشده نشان دهد */
  t('صفِ انتظار فقط منتشرشده‌ها', /r\.published && !r\.verified && r\.hasDoc/.test(page))
}

/* ── وضعیتِ دعوتِ مربی مالِ سرور است ──
   پنلِ باشگاه کلِ آرایه‌ی coaches را PUT می‌کند. بدونِ ادغام در سرور،
   اولین ذخیره‌ی باشگاه‌دار پاسخِ مربی را به pending برمی‌گرداند و مربی
   از صفحه‌ی عمومی حذف می‌شود. */
{
  head('دعوتِ مربی — ادغام به‌جای بازنویسی')
  const put = code('app/api/clubs/[id]/route.ts')
  /* PUT دیگر اصلاً این ستون را نمی‌نویسد — یک راهِ نوشتن بیشتر نیست */
  t('PUT ستونِ مربیان را رد می‌کند', /hasOwnProperty\.call\(body, 'coaches'\)/.test(put))
  t('و به مسیرِ درست ارجاع می‌دهد', /api\/clubs\/:id\/coaches/.test(put))
  t('بلوکِ ادغام دیگر لازم نیست', !/merged\.status/.test(put) && !/out\.status = 'pending'/.test(put))

  const dash = code('app/dashboard/club/page.tsx')
  t('پنل پاسخِ سرور را می‌نشاند', /Array\.isArray\(saved\)\) setCoaches\(saved as CoachEntry\[\]\)/.test(dash))
  /* خطای «نسخه‌ات کهنه است» هم فهرستِ درست را برمی‌گرداند */
  t('و در خطا هم دوباره هم‌گام می‌شود', /res\?\.data\?\.coaches/.test(dash))
  t('پاسخِ دیررسِ باشگاهِ قبلی ننشیند', /selectedClubRef\.current === cid/.test(dash))
  t('با عوضِ باشگاه فهرست خالی می‌شود', /setCoaches\(\[\]\);[\s\S]{0,60}setCoachesReady\(false\)/.test(dash))

  /* ── مسیرِ تک‌تغییری ──
     ادغام جلوی بازنویسیِ وضعیت را می‌گیرد ولی حذفِ ردیفِ نادیده را
     نه: «نبودن در آرایه» از «حذفش کردم» قابلِ تشخیص نیست. پس پنل
     باید نیت را صریح بفرستد. */
  const cRoute = code('app/api/clubs/[id]/coaches/route.ts')
  t('مسیرِ مربیانِ باشگاه هست', /export async function PATCH/.test(cRoute))
  t('فقط مالک یا ادمین', /!isAdmin && row\.ownerId !== payload\.id/.test(cRoute))
  /* نامک روی ستونِ uuid یعنی خطای 22P02 و ۵۰۰ به‌جای ۴۰۴ */
  t('شناسه‌ی غیر-uuid زود رد می‌شود', /if \(!isUUID\(id\)\) return err\(/.test(cRoute))
  t('نقشِ ادمین از کلیدِ ریزدانه می‌آید', /await can\(payload\.id, 'clubs'\)/.test(cRoute))
  t('خطاهای کهنگی فهرست را هم می‌دهند', /err\('این مربی در فهرست نیست', 404, list\)/.test(cRoute))
  t('ممیزی ثبت می‌شود', /CLUB_COACH_ADDED/.test(cRoute) && /CLUB_COACH_REMOVED/.test(cRoute))
  t('افزودن همیشه pending است', /entry\.status = 'pending';/.test(cRoute))
  t('status از بدنه خوانده نمی‌شود', !/src\.status/.test(cRoute))
  t('دعوتِ تکراری ۴۰۹ می‌گیرد', /از قبل در فهرست است', 409/.test(cRoute))
  t('حذف با شناسه است نه با آرایه', /body\.removeId/.test(cRoute))
  t('پنل دیگر کلِ آرایه را PUT نمی‌کند', !/\{ coaches: next \}/.test(dash))
  t('پنل از مسیرِ تک‌تغییری می‌رود', /api\.patch\(/.test(dash) && /mutateCoaches/.test(dash))
  t('دکمه‌ها حالتِ busy دارند', /disabled=\{coachBusy\}/.test(dash))
  /* مسیرِ خودِ مربی از اول همین گارد را داشت */
  const inv = code('app/api/coach/club-invites/route.ts')
  t('مسیرِ مربی هم کلِ ستون را نمی‌نویسد', /list\.map\(e => \{/.test(inv))

  /* امتیازِ دستی برنگردد */
  t('امتیازِ دستیِ مربی در پنل نیست', !/★ \{c\.rating\}/.test(dash) && !/rating: ''/.test(dash))
  t('به‌جایش وضعیتِ دعوت دیده می‌شود', /در انتظار پذیرش/.test(dash))
}

/* ── کلیدهای دسترسیِ ادمین باید واقعی باشند ──
   ⚠️ `can()` مقایسه‌ی دقیق می‌کند و کلیدِ ناموجود بی‌صدا false
   می‌دهد: مسیر برای همه جز سوپرادمین بسته می‌شود بدونِ هیچ خطا، هیچ
   لاگ، و هیچ نشانه‌ای. سه مسیر ماه‌ها همین‌طور بسته بودند و چون تنها
   ادمینِ سایت سوپرادمین است، کسی متوجه نشد.

   این گارد هر `can(x, 'k')` را در کلِ کد با فهرستِ کلیدها
   می‌سنجد. */
{
  head('کلیدهای دسترسیِ ادمین')
  const perms = code('lib/admin/permissions.ts')
  /* ⚠️ آیتم‌ها با `}` در همان خط تمام می‌شوند؛ گروه بعدش `items` دارد.
     الگوی قبلی فقط چون سورس گروه را چندخطی نوشته بود گروه‌ها را
     نمی‌گرفت — یعنی همان باگی که این شاخه رفعش می‌کند از دیدِ گارد
     پنهان می‌ماند اگر روزی گروهی یک‌خطی نوشته شود. */
  const keys = [...perms.matchAll(/\{ key: '([^']+)', label: '[^']*'(?:, hint: '[^']*')? \}/g)].map(m => m[1])
  /* گروه‌ها هم کلید دارند ولی هرگز داده نمی‌شوند؛ فقط آیتم‌ها معتبرند.
     نامِ گروه در همان الگو نمی‌آید (بعدش items است، نه label تنها). */
  t('فهرست کلیدها خوانده شد', keys.length >= 25, String(keys.length))
  /* نامِ گروه هرگز به کسی داده نمی‌شود؛ اگر در فهرست بیاید، گارد
     دقیقاً همان اشتباهی را می‌پذیرد که باید بگیرد. */
  t('نامِ گروه کلید نیست', !keys.includes('content') && !keys.includes('business')
    && !keys.includes('people') && !keys.includes('money') && !keys.includes('community'),
    keys.join(','))

  const walk = (dir, out = []) => {
    for (const d of readdirSync(join(here, '..', dir), { withFileTypes: true })) {
      if (d.name === 'node_modules' || d.name === '.next') continue
      const rel = dir + '/' + d.name
      if (d.isDirectory()) walk(rel, out)
      else if (/\.(ts|tsx)$/.test(d.name)) out.push(rel)
    }
    return out
  }
  const bad = [], unparsed = []
  for (const p of [...walk('app'), ...walk('lib'), ...walk('components'), ...walk('hooks')]) {
    /* خودِ تعریفِ can() این‌جا نیست که سنجیده شود */
    if (p === 'lib/admin/permissions.ts') continue
    const src = code(p)
    const hits = [...src.matchAll(/\bcan\([^,]+,\s*'([^']+)'\)/g)]
    for (const m of hits) {
      /* 'access' عمداً بیرونِ فهرست است — کارِ سوپرادمین. */
      if (m[1] !== 'access' && !keys.includes(m[1])) bad.push(p + ' ⟵ ' + m[1])
    }
    /* ⚠️ الگوی بالا فقط رشته‌ی تک‌کوتیشنِ چسبیده به `)` را می‌گیرد.
       `can(x, "k")`، بک‌تیک، متغیر، یا فراخوانیِ چندخطی از دستش
       درمی‌رفت — یعنی کلیدِ نامعتبر بی‌صدا رد می‌شد. پس شمارشِ خامِ
       `can(` باید با شمارشِ الگو یکی باشد. */
    const raw = (src.match(/\bcan\(/g) ?? []).length
    if (raw !== hits.length) unparsed.push(`${p} (${raw} فراخوان، ${hits.length} خوانده‌شده)`)
  }
  t('هیچ can() با کلیدِ ناموجود نمانده', bad.length === 0, bad.join(' · '))
  t('هر can() برای گارد خوانا است', unparsed.length === 0, unparsed.join(' · '))

  /* هر کارتِ صفحه‌ی اولِ پنل باید کلیدی داشته باشد که بشود داد */
  const home = code('app/admin/page.tsx')
  const mapped = [...home.matchAll(/^\s*([a-z-]+): '([a-z-]+)',/gm)].map(m => m[1])
  const links = [...new Set([...home.matchAll(/link: '\/admin\/([a-z0-9-]+)'/g)].map(m => m[1]))]
  const orphan = links.filter(l => l !== 'access' && !keys.includes(l) && !mapped.includes(l))
  t('هر کارتِ پنل کلیدِ قابلِ‌دادن دارد', orphan.length === 0, orphan.join(', '))

  /* کلیدهایی که همین دور درست شدند — تا کسی دوباره برشان نگرداند */
  const club = code('app/api/clubs/[id]/route.ts')
  t('ستون‌های خصوصیِ باشگاه با کلیدِ clubs باز می‌شوند',
    /can\(actor\.id, 'clubs'\)/.test(club) && !/clubs\.review/.test(club))
  t('پنلِ ویدیو کلیدِ media می‌خواهد',
    /can\(actor\.id, 'media'\)/.test(code('app/api/admin/videos/route.ts')))
  t('محتوای نمایشی کلیدِ خودش را دارد',
    /can\(actor\.id, 'demo-content'\)/.test(code('app/api/admin/demo-profiles/route.ts'))
    && keys.includes('demo-content'))
  /* گاردِ مسیرِ تکی با یک ?all=true دور می‌خورد اگر فهرست هم همان
     تفکیک را نداشته باشد — و فهرست بدتر است: همه‌ی باشگاه‌ها یک‌جا. */
  t('فهرستِ ادمینی هم ستون‌های خصوصی را جدا می‌کند', /canSeePrivate = await can\(actor!\.id, 'clubs'\)/.test(code('app/api/clubs/route.ts')))
  t('و از همان فهرستِ مشترک می‌خواند', /stripClubPrivate/.test(code('app/api/clubs/route.ts')) && /stripClubPrivate/.test(code('app/api/clubs/[id]/route.ts')))
  /* خودِ سند از نشانی‌اش حساس‌تر است */
  t('سندِ مجوز هم پشتِ کلیدِ clubs است', /!\(await can\(actor\.id, 'clubs'\)\)/.test(code('app/api/clubs/[id]/license-doc/route.ts')))
  /* ویرایش و حذفِ باشگاهِ دیگران هم نباید به ادعای توکن تکیه کند */
  t('PUT/DELETE نقش را از دیتابیس می‌گیرند', (code('app/api/clubs/[id]/route.ts').match(/const isAdmin = await can\(userId, 'clubs'\)/g) ?? []).length === 2)
}

/* ── کانالِ بیلیارد مدیا: منبعِ واحد، شناسه‌ی تغییرناپذیر، دروازه ── */
{
  head('کانال و دروازه‌ی انتشار')

  /* یک تایپ، نه سه. سه اعلانِ جدا داشتیم و یکی‌شان `role` نداشت. */
  const shared = code('lib/media/channel.ts')
  t('منبعِ واحدِ کانال وجود دارد',
    /export interface UserChannel/.test(shared) && /export const CHANNEL_ROLES/.test(shared))
  t('نقشِ «کاربر عادی» کانال ندارد', !/'user'/.test(shared))
  for (const p of ['app/api/media/channel/route.ts', 'lib/media-user.ts', 'components/media/ChannelGate.tsx', 'components/media/useChannelPublish.tsx']) {
    const src = code(p)
    t(p + ' تایپِ کانال را از نو اعلام نمی‌کند',
      !/^\s*(export )?interface UserChannel \{/m.test(src) && /lib\/media\/channel/.test(src))
  }

  /* ⚠️ کلیدِ «مالک + هندل» تغییرِ نام را به ساختِ کانالِ دوم تبدیل
     می‌کرد و ویدیوهای قدیمی به کانالی رها اشاره می‌کردند. */
  const chRoute = code('app/api/media/channel/route.ts')
  /* کلید شناسه است، نه هندل — و ردیفِ قدیمیِ بی‌شناسه هم شناسه‌ی
     قطعی دارد، وگرنه ویرایشش دوباره کانالِ دوم می‌ساخت. */
  t('کلیدِ کانال شناسه است نه هندل', /const existing = wantId[\s\S]{0,80}channelKey\(c\) === wantId/.test(chRoute))
  t('شناسه‌ی ناموجود ۴۰۴ می‌گیرد', /\(wantId \|\| addRole\) && !existing/.test(chRoute) && /status: 404/.test(chRoute))
  t('هر کانالِ تازه شناسه می‌گیرد', /id: existing \? channelKey\(existing\) : newId\(\)/.test(chRoute))
  t('شناسه‌ی ردیفِ قدیمی از داده ساخته می‌شود نه تصادفی',
    /export const legacyId/.test(shared) && !/Math\.random/.test(shared))
  t('جای‌گذاری روی همان شیء انجام می‌شود', /c === existing \? channel : c/.test(chRoute))
  /* ⚠️ «کانال تازه» بدونِ شناسه می‌آید؛ اگر مسیر آن را ویرایش بفهمد،
     بی‌صدا کانالِ قبلی را تغییرِ نام می‌دهد — زیرِ ویدیوهای منتشرشده. */
  t('بدونِ شناسه و بدونِ addRole ویرایش نمی‌شود',
    /: addRole$/m.test(chRoute) && /^\s*: undefined$/m.test(chRoute))
  t('هندلِ تکراری حتی مالِ خودم رد می‌شود',
    /list\.some\(c => c\.handle === handle && c !== existing\)/.test(chRoute))
  /* میدانی که فرستاده نشده نباید پاک شود — مهرِ نقش عکس را می‌برد */
  t('ویرایش میدان‌های نافرستاده را پاک نمی‌کند',
    /avatar: b\.avatar !== undefined/.test(chRoute) && /bio: b\.bio !== undefined/.test(chRoute))
  t('ورودی با Zod اعتبارسنجی می‌شود', /BODY\.safeParse/.test(chRoute) && /z\.object\(/.test(chRoute))
  /* شکستِ مهرِ نقش نباید بی‌صدا بماند، وگرنه پنجره تا ابد باز می‌شود */
  t('مهرِ نقش پاسخِ سرور را می‌خواند',
    /if \(!r\.ok \|\| !j\?\.channel\) return miss\(\)/.test(code('components/media/useChannelPublish.tsx')))
  t('نبودِ کلیدِ مالک هم پیام دارد',
    /کانالِ شما شناسایی نشد/.test(code('components/media/useChannelPublish.tsx')))
  const media = code('app/api/media/route.ts')
  t('انتشار در کانالِ غریبه بسته است', /myChannelHandles/.test(media))
  /* ⚠️ `clubId` هم از بدنه می‌آید؛ بدونِ گارد هر کسی ویدیویش را زیرِ
     هر باشگاهی می‌نشاند و در فیلترِ آن باشگاه ظاهر می‌شود. */
  t('نشاندنِ ویدیو زیرِ باشگاهِ غریبه بسته است',
    /if \(!owns && !\(await can\(actor\.id, 'clubs'\)\)\)/.test(media) && /این باشگاه متعلق به شما نیست/.test(media)
    && /club_id: wantClub \|\| null/.test(media))
  /* ⚠️ شناسه در پاسخِ عمومی برمی‌گردد؛ اگر از `ownerKey` ساخته شود،
     شماره‌ی موبایل تنها مجهولِ معادله است. */
  t('شناسه‌ی کانال شماره‌ی موبایل را لو نمی‌دهد',
    !/ownerKey/.test(shared.slice(shared.indexOf('export const legacyId'))))
  /* فایلِ کانال‌ها `ownerKey` خام دارد و در باکتِ عمومی بود */
  t('فهرستِ کانال‌ها در باکتِ خصوصی است',
    /'social\/media\/channels\.json',/.test(code('lib/social-server.ts')))
  /* مسیرِ بی‌احراز هویت نباید بگوید «فلان شماره صاحبِ فلان هندل است» */
  t('بررسیِ هندل اوراکلِ مالکیت نیست',
    /const taken = list\.some\(c => c\.handle === h\)/.test(chRoute))
  t('نام و هندل هم معناشناسیِ PATCH دارند',
    /const name = b\.name !== undefined/.test(chRoute) && /const handle = b\.handle !== undefined/.test(chRoute))
  /* ⚠️ ذخیره نباید ردیفِ کاربرِ دیگری را دور بیندازد */
  t('ذخیره فهرست را بی‌صدا نمی‌بُرد',
    !/slice\(-2000\)/.test(chRoute) && /MAX_CHANNELS/.test(chRoute) && /status: 507/.test(chRoute))
  t('پیامِ خطای ورودی میدان را نام می‌برد',
    /FIELD_FA\[field\]/.test(chRoute) && /parsed\.error\.issues\[0\]/.test(chRoute))
  /* ⚠️ فهرست مشترک است و روی هر انتشار کامل خوانده می‌شود؛ عکس باید
     نشانی باشد نه خودِ فایل. */
  t('عکسِ کانال نشانی است نه data-URL',
    /avatar: z\.string\(\)\.max\(2048\)/.test(chRoute) && /startsWith\('data:'\)/.test(chRoute))
  t('عکس هنگام ذخیره هم کوتاه می‌شود', /String\(b\.avatar\)\.trim\(\)\.slice\(0, 2048\)/.test(chRoute))

  /* هر هفت نقش باید دروازه داشته باشد — «کاربر عادی» عمداً نه */
  const GATED = [
    ['app/clubs/[id]/page.tsx', 'club'],
    ['app/coaches/[id]/page.tsx', 'coach'],
    ['app/referees/[id]/page.tsx', 'referee'],
    ['app/players/[id]/page.tsx', 'player'],
    ['app/services/[id]/page.tsx', 'technician'],
    ['app/sellers/[id]/FlatShop.tsx', 'seller'],
    ['app/manufacturers/[id]/page.tsx', 'manufacturer'],
  ]
  for (const [p, role] of GATED) {
    const src = code(p)
    t('گالریِ ' + role + ' به دروازه وصل است',
      src.includes("useChannelPublish('" + role + "'") && /\{channelGate\}/.test(src))
    /* ⚠️ پرسیدنِ *بعد از* آپلود یعنی کاربر ۲۵ مگابایت را بالا
       می‌فرستد و تازه آن‌وقت پنجره می‌آید. باید پیش از انتخابگرِ
       فایل پرسیده شود. */
    t('گالریِ ' + role + ' پیش از انتخابِ فایل می‌پرسد',
      src.includes('beforeAddVideos={() => askChannel(')
      && src.includes('ask: askChannel'))
  }

  /* ⚠️ ویدیویی که در گالری ذخیره نشد نباید در مدیا منتشر شود */
  const clubPage = code('app/clubs/[id]/page.tsx')
  t('باشگاه فقط ویدیوی ذخیره‌شده را منتشر می‌کند',
    clubPage.indexOf('saved.push(') > -1
    && clubPage.indexOf('await saveClubVideos(next))) break') < clubPage.indexOf('saved.push('))
  /* انتخابگرِ ویدیو باید منتظرِ تصمیم بماند، نه اینکه همان لحظه باز شود */
  const pg = code('components/profile/ProfileGallery.tsx')
  /* ⚠️ بازکردنِ انتخابگرِ فایل «حرکتِ کاربر» می‌خواهد و سافاری آن را
     پس از یک درخواستِ شبکه پس می‌گیرد. پس هیچ `await`ی نباید بینِ
     کلیک و `click()` بنشیند — نه در گالری، نه در هوک. */
  t('انتخابگرِ ویدیو پیش از باز شدن await نمی‌کند',
    !/const pickVideo = async/.test(pg) && !/await beforeAddVideos/.test(pg)
    && /if \(gate === true\) \{ openVideoPicker\(\); return \}/.test(pg))
  /* ⚠️ «+»ِ آلبوم عکس هم می‌گیرد، پس *پیش* از انتخاب نباید بپرسد —
     کسی که فقط عکس می‌گذارد نباید سؤالِ کانالِ ویدیو ببیند. دروازه
     بعد از انتخاب و پیش از آپلود است، جایی که «حرکتِ کاربر» لازم
     نیست چون فایل‌ها انتخاب شده‌اند. */
  t('«+»ِ آلبوم فقط وقتی ویدیو هست می‌پرسد',
    /const pickBoth = \(album\?: string\) => \{ target\.current = album; bothRef\.current\?\.click\(\) \}/.test(pg)
    && /if \(vids\.length\) \{[\s\S]{0,260}beforeAddVideos\?\.\(\)[\s\S]{0,200}onAddVideos\?\.\(vids/.test(pg))
  /* ⚠️ عنوانِ ویدیو تا دیروز *نامِ فایل* بود و همان به مدیا می‌رفت:
     «screen record 04-14-2026» برای بیننده بی‌معنا و برای گوگل
     بی‌ارزش است. حالا کاربر خودش عنوان/دسته/توضیح می‌دهد. */
  const vd = code('components/media/VideoDetailsDialog.tsx')
  const vdl = code('lib/media/video-details.ts')
  t('فرمِ مشخصاتِ ویدیو وجود دارد',
    /export const weakTitle/.test(vdl) && /export const titleFromFile/.test(vdl)
    && /VideoDetailsDialog/.test(pg))
  t('منطقِ عنوان در lib است نه در کامپوننت',
    !/const MACHINE =/.test(vd) && /'use client'/.test(vd) && !/'use client'/.test(vdl))
  /* ⚠️ گزاره‌ی رشته‌ای کافی نیست: الگو یک‌بار «screen record 04 14 2026»
     را رد نمی‌کرد (چون تابعِ نام، خط‌تیره را به فاصله می‌کند) و یک‌بار
     «ScreenRecording…» را (چون جداکننده اجباری بود و «recording» نبود).
     پس خودِ رفتار سنجیده می‌شود، نه متنِ رجکس. */
  {
    const src = read('lib/media/video-details.ts')
    const m = src.match(/const MACHINE = (\/.*\/i)/)
    const RX = m ? eval(m[1]) : null
    const clean = (n) => n.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
    const BAD = ['screen record 04-14-2026.mp4', 'ScreenRecording_04-14-2026 03-56-17_1.mov',
      'IMG_1234.mp4', 'VID_20240101.mp4', 'WhatsApp 2024-01-01.mp4', 'Screenshot 2026-01-01.png']
    const GOOD = ['آموزش ضربه‌ی کشویی', 'Low Bitrate', 'Screen recording of my best break',
      'Trick shot 2026 در آرتا کلاب']
    t('نامِ ماشینی به‌عنوانِ عنوان رد می‌شود',
      !!RX && BAD.every(n => RX.test(clean(n))), BAD.filter(n => RX && !RX.test(clean(n))).join(' · '))
    t('عنوانِ واقعی رد نمی‌شود',
      !!RX && GOOD.every(n => !RX.test(n)), GOOD.filter(n => RX && RX.test(n)).join(' · '))
  }
  t('دسته‌بندی اجباری است', /دسته‌بندی را انتخاب کنید/.test(vd))
  t('گالری پیش از آپلود مشخصات می‌پرسد',
    /details = await askDetails\(vids, album\)/.test(pg)
    && /if \(vids\.length && details\) await onAddVideos\?\.\(vids, album, details\)/.test(pg)
    && pg.indexOf('await askDetails') < pg.indexOf('await onAddImages'))
  /* عنوانِ گالری و عنوانِ مدیا باید یکی باشد */
  for (const [p, who] of [['app/clubs/[id]/page.tsx', 'باشگاه'],
    ['app/coaches/[id]/page.tsx', 'مربی'], ['app/referees/[id]/page.tsx', 'داور'],
    ['app/players/[id]/page.tsx', 'بازیکن'], ['app/services/[id]/page.tsx', 'متخصص'],
    ['app/sellers/[id]/FlatShop.tsx', 'فروشگاه'], ['app/manufacturers/[id]/page.tsx', 'تولیدکننده']]) {
    const src = code(p)
    t('عنوانِ کاربر در گالریِ ' + who + ' می‌نشیند',
      !/title: file\.name\.replace/.test(src) && /detailTitle\(details, i, file\)/.test(src))
    t('«فقط گالری»ِ ' + who + ' در مدیا منتشر نمی‌شود',
      /details\?\.\[i\]\?\.publish !== false/.test(src))
  }
  const hook = code('components/media/useChannelPublish.tsx')
  const cg = code('components/media/ChannelGate.tsx')
  /* دسته و توضیح باید به سرور برسند، نه ثابتِ `other` */
  t('دسته و توضیح به مدیا می‌روند',
    /category: v\.category \|\| 'other'/.test(hook) && /description: v\.description \?\? ''/.test(hook))
  /* ⚠️ ویدیویی که یک‌بار با نامِ فایل منتشر شده بود تا ابد همان
     می‌ماند: مسیرِ ویرایش فقط ادمینی بود و هیچ صفحه‌ای صدایش
     نمی‌زد. حالا صاحبِ ویدیو خودش می‌تواند عوضش کند. */
  const ve = code('components/media/useVideoEdit.tsx')
  t('مسیرِ ویرایشِ ویدیوی خودی وجود دارد',
    /export async function PATCH/.test(media) && /prev\.owner_id !== actor\.id && !actor\.isAdmin/.test(media))
  t('ویرایش همان قاعده‌ی عنوان را اعمال می‌کند',
    /const weak = weakTitle\(title\)/.test(media))
  /* نشانیِ قبلی نباید ۴۰۴ شود */
  t('تغییرِ عنوان نشانیِ قدیمی را در تاریخچه نگه می‌دارد',
    /video_slug_history/.test(media) && /patch\.slug = makeSlug\(title\)/.test(media))
  /* دو عنوانِ متفاوت برای یک ویدیو بدتر از عنوانِ بد است */
  t('اگر گالری ذخیره نشد، مدیا هم دست نمی‌خورد',
    /if \(!\(await saveToGallery\(target, detail\)\)\)/.test(ve))
  /* ⚠️ `src` یکتا نیست: دو ردیفِ هم‌نشانی `maybeSingle` را `null`
     می‌کرد و مالکِ واقعی برای همیشه ۴۰۴ می‌گرفت. */
  t('یافتن با src به خودِ کاربر محدود است',
    /if \(src && !id && !slug && !actor\.isAdmin\) sel = sel\.eq\('owner_id', actor\.id\)/.test(media))
  t('خطای خواندن بلعیده نمی‌شود',
    /error: findErr/.test(media) && /خواندنِ ویدیو انجام نشد/.test(media))
  /* «منتشر نشده» باید از «خطا» جدا بماند */
  t('«ردیفِ مدیا نیست» کدِ خودش را دارد',
    /code: 'no-media-row'/.test(media) && /j\.code === 'no-media-row'/.test(ve))
  t('ویرایش سقفِ نرخ دارد', /action: 'video-patch'/.test(media))
  t('ورودیِ ویرایش با Zod سنجیده می‌شود', /PATCH_BODY\.safeParse/.test(media))
  t('تاریخچه‌ی نشانی بعد از موفقیتِ ذخیره نوشته می‌شود',
    media.indexOf('.update(patch)') < media.indexOf("if (renamed) await sb.from('video_slug_history')"))
  t('updated_at ثبت می‌شود', /updated_at: new Date\(\)\.toISOString\(\)/.test(media))
  /* پنجره تا پایانِ ذخیره باز می‌ماند تا نوشته‌ی کاربر از دست نرود */
  t('فرمِ ویرایش حالتِ لودینگ و خطا دارد',
    /busy=\{saving\}/.test(ve) && /error=\{err\}/.test(ve) && /در حال ذخیره…/.test(vd))
  /* لحنِ پیش‌فرضِ notify «خطا» است */
  t('پیامِ موفقیت قرمز نشان داده نمی‌شود',
    /notify\?\.\(msg, tone\)/.test(ve) && /منتشر شد\.\`, 'ok'\)/.test(hook))
  for (const [p, who] of [['app/clubs/[id]/page.tsx', 'باشگاه'],
    ['app/coaches/[id]/page.tsx', 'مربی'], ['app/referees/[id]/page.tsx', 'داور'],
    ['app/players/[id]/page.tsx', 'بازیکن'], ['app/services/[id]/page.tsx', 'متخصص'],
    ['app/sellers/[id]/FlatShop.tsx', 'فروشگاه'], ['app/manufacturers/[id]/page.tsx', 'تولیدکننده']]) {
    const src = code(p)
    t('ویرایشِ عنوان در ' + who + ' هست',
      /onEdit: \(\) => editVideo\(v\)/.test(src) && /\{videoEditDialog\}/.test(src)
      && /useVideoEdit\(/.test(src))
  }
  t('فهرستِ کانال‌ها از پیش خوانده می‌شود',
    /const cache = useRef/.test(hook) && /useEffect\(\(\) => \{[\s\S]{0,200}loadMyChannels/.test(hook))
  t('ask همگام تصمیم می‌گیرد', !/const ask = useCallback\(async/.test(hook))
  /* قولِ باز نباید معلق بماند، وگرنه «+» تا پایانِ عمرِ صفحه مرده است */
  t('قولِ دروازه در unmount هم حل می‌شود',
    /useEffect\(\(\) => \(\) => \{ askDone\.current\?\.\(\)/.test(hook))
  /* یک لمسِ اشتباهی روی بیرونِ پنجره نباید انتشار را خاموش کند */
  t('«فعلاً نه» از بستن جدا است',
    /onSkip=\{onSkip\}/.test(hook) && /className="cg-skip" onClick=\{onSkip\}/.test(code('components/media/ChannelGate.tsx')))
  /* کلیدِ مالک عوض می‌شود؛ کشِ کلیدِ قبلی نباید جواب بدهد */
  t('کش با عوض‌شدنِ مالک پاک می‌شود',
    /cache\.current = undefined[\s\S]{0,60}picked\.current = null/.test(hook)
    && /if \(alive && cache\.current === undefined\)/.test(hook))
  /* همان ویدیویی که کاربر جوابش را داده نباید دوبار پرسیده شود */
  t('شکستِ مهرِ نقش همین ویدیو را دوبار نمی‌پرسد',
    /const session = useRef/.test(hook) && /picked\.current \?\? session\.current/.test(hook))
  t('کارِ پس‌زمینه گیرنده‌ی خطا دارد',
    /\}\)\(\)\.catch\(\(\) => notify\?\./.test(hook))
  t('گامِ پایانی فوکوس و اعلام دارد',
    /doneRef\.current\?\.focus\(\)/.test(cg) && /className="cg-done" role="status"/.test(cg))
  /* ⚠️ `/.[^.]+$/` نقطه نیست، «هر نویسه» است: `clip.mp4` در گالری
     «cli» ذخیره می‌شد ولی با نامِ درست به مدیا می‌رفت. */
  t('نامِ ویدیو در گالری و مدیا یکی است',
    !['app/coaches/[id]/page.tsx', 'app/referees/[id]/page.tsx', 'app/services/[id]/page.tsx',
      'app/players/[id]/page.tsx', 'app/manufacturers/[id]/page.tsx', 'app/sellers/[id]/FlatShop.tsx',
      'app/clubs/[id]/page.tsx', 'components/profile/ProfileGallery.tsx']
      .some(p => /replace\(\/\.\[\^\.\]\+\$\//.test(code(p).replace(/\\./g, '\u0000')) ))

  /* پنجره‌ی قدیمیِ آپلود دیگر کورکورانه در کانالِ اول منتشر نمی‌کند */
  const up = code('components/MediaUpload.tsx')
  const step = code('components/media/ChannelStep.tsx')
  t('پنجره‌ی آپلود همه‌ی کانال‌ها را می‌خواند',
    /fetchMyChannels\(/.test(up) && !/fetchMyChannel\(/.test(up))
  t('پنجره‌ی آپلود انتخابگرِ کانال دارد', /role="radiogroup"/.test(step) && /<ChannelPicker/.test(up))
  /* رادیوگروپ فقط رادیو می‌پذیرد و باید یک ایستگاهِ Tab باشد */
  t('دکمه‌ی «کانال تازه» بیرونِ رادیوگروپ است',
    step.indexOf('</div>') < step.indexOf('کانال تازه'))
  t('انتخابگر با فلش کار می‌کند', /ArrowRight/.test(step) && /tabIndex=\{on \? 0 : -1\}/.test(step))
  t('حالتِ «فهرست خوانده نشد» پرچمِ خودش را دارد',
    /failed=\{chFailed\}/.test(up) && /if \(failed\)/.test(step))
  t('متنِ «کانال یک‌بار ساخته می‌شود» برداشته شد',
    !/کانال یک‌بار ساخته می‌شود/.test(up) && !/کانال یک‌بار ساخته می‌شود/.test(step))
  /* هندل شناسه است، نه عددی که تبدیلِ سراسری باید فارسی‌اش کند */
  t('هندلِ کانال لاتین می‌ماند',
    /bh-latin" dir="ltr">@\{c\.handle\}/.test(code('components/media/ChannelGate.tsx'))
    && /className="bh-latin"[^>]*>@\{c\.handle\}/.test(step))
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
