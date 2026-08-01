/* تستِ آدرس، موقعیت مکانی و نام بانک در اطلاعات باشگاه.
       node scripts/test-club-address.mjs */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(join(here, '..', p), 'utf8')
const load = async rel => import('data:text/javascript;base64,' + Buffer.from(
  ts.transpileModule(read(rel), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  }).outputText).toString('base64'))

let pass = 0, fail = 0
const t = (name, got, want = true) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}
const head = s => console.log(`\n■ ${s}`)

const dash = read('app/dashboard/club/page.tsx')
const api = read('app/api/clubs/[id]/route.ts')
const css = read('app/globals.css')

head('۱) نام بانک — مشتق از شبا، نه ورودی')
{
  const { bankOfIban, bankOfCard } = await load('lib/bank.ts')
  /* شبای واقعیِ همین پروژه: بانک صادرات */
  t('نام بانک از شبا درمی‌آید',
    typeof bankOfIban('IR880190000000304049392000') === 'string'
    && bankOfIban('IR880190000000304049392000').length > 0)
  console.log(`     IR88 0190… → «${bankOfIban('IR880190000000304049392000')}»`)
  t('از کارت هم درمی‌آید', typeof bankOfCard('6037697466654339') === 'string')
  console.log(`     6037 6974… → «${bankOfCard('6037697466654339')}»`)

  t('فیلدِ نام بانک فقط‌خواندنی است', /label="نام بانک" readOnly/.test(dash))
  t('مقدارش مشتق است', /value=\{derivedBankName \|\| clubInfo\.bankName\}/.test(dash))
  t('شبا بر کارت مقدم است', /const derivedBankName = ibanBank \|\| cardBank/.test(dash))
  /* `setTForm(p => ({...p, bankName: v}))` مالِ فرمِ مسابقات است و ربطی
     به این‌جا ندارد؛ ادعا باید فقط setClubInfo را ببیند. */
  t('کاربر دیگر نام بانکِ باشگاه را تایپ نمی‌کند',
    !/setClubInfo\(p => \(\{ \.\.\.p, bankName: v \}\)\)/.test(dash))
  /* پاسخِ خودِ سرویس اگر بیاید مقدم است — دقیق‌تر از حدسِ پیشوند */
  t('نامِ برگشته از استعلام همچنان ذخیره می‌شود', /bankName: j\.bankName \|\| p\.bankName/.test(dash))
  t('موقعِ ذخیره هم فرستاده می‌شود', /bankName: derivedBankName \|\| clubInfo\.bankName/.test(dash))
}

head('۲) آدرس — قفل، چندخطی، با توضیحاتِ جدا')
{
  t('آدرس دیگر input تک‌خطی نیست', !/label="آدرس"\s+value=\{clubInfo\.address\}/.test(dash))
  /* بلوکِ خودرشد به‌جای فیلدِ ثابت — در هیچ عرضی متن بریده نمی‌شود */
  t('آدرس در بلوکِ فقط‌خواندنیِ خودرشد است', /data-field="address"/.test(dash))
  t('ارتفاع از خودِ متن می‌آید', /height: 'auto', whiteSpace: 'pre-wrap'/.test(dash))
  t('راهنمای «قابل تغییر نیست»', /از استعلام کد پستی — قابل تغییر نیست/.test(dash))
  t('فیلدِ توضیحات آدرس هست', /clubInfo\.addressNote/.test(dash))
  t('توضیحات قابلِ ویرایش است', /addressNote: e\.target\.value\.slice\(0, 300\)/.test(dash))
  t('در state هست', /addressNote: c\.addressNote \?\? ''/.test(dash))

  t('سرور آدرسِ ورودی را دور می‌ریزد',
    /hasOwnProperty\.call\(body, 'address'\)[\s\S]{0,120}delete \(body as Record<string, unknown>\)\.address/.test(api))
  t('addressNote ستونِ اختیاریِ امن است', /'postalCode', 'addressNote'/.test(api))

  const sql = read('../../supabase/migrations/037_club_address_note.sql')
  t('مهاجرت ستون را می‌سازد', /ADD COLUMN IF NOT EXISTS "addressNote"/.test(sql))
}

head('۳) ترازِ کد پستی و دکمه در موبایل')
{
  t('کلاسِ شبکه‌ای جای flex-wrap آمد', /className="bh-postal-row"/.test(dash))
  t('CSS تعریف شده', /\.bh-postal-row\s*\{/.test(css))
  t('در موبایل تک‌ستونی می‌شود', /\.bh-postal-row \{ grid-template-columns: 1fr/.test(css))
  t('هر دو ارتفاعِ یکسان دارند', (dash.match(/height: 40/g) ?? []).length >= 2)
}

head('۴) موقعیت مکانی — از داشبورد')
{
  t('دکمه‌ی ثبت موقعیت هست', /const saveLocation/.test(dash))
  t('از geolocation مرورگر می‌گیرد', /navigator\.geolocation\.getCurrentPosition/.test(dash))
  t('روی سرور ذخیره می‌شود', /latitude: lat, longitude: lon/.test(dash))
  t('صفر یعنی ثبت‌نشده، نه مختصاتِ واقعی',
    /Number\(c\.latitude\) && Number\(c\.longitude\)/.test(dash))
  t('ردِ دسترسی پیامِ خودش را دارد', /PERMISSION_DENIED/.test(dash))
  t('دقتِ بالا درخواست می‌شود', /enableHighAccuracy: true/.test(dash))
  t('لینکِ دیدن روی نقشه', /maps\.google\.com/.test(dash))

  /* قابلیتِ «نزدیک‌ترین» که این مختصات به آن خوراک می‌دهد */
  const clubs = read('app/clubs/page.tsx')
  t('فهرست باشگاه‌ها مرتب‌سازی بر اساس فاصله دارد', /value:'distance'/.test(clubs))
  t('فاصله محاسبه می‌شود', /calcDistance\(userLoc\.lat, userLoc\.lon/.test(clubs))
  t('موقعیتِ کاربر گرفته می‌شود', /navigator\.geolocation\.getCurrentPosition/.test(clubs))
}

head('۵) کدام منبعِ موقعیت برنده است')
{
  t('GPSِ بی‌دقت ذخیره نمی‌شود', /if \(acc > 150\)/.test(dash))
  t('دقت به کاربر گفته می‌شود', /دقت موقعیت پایین است/.test(dash))
  t('دقتِ خوب با عددش ثبت می‌شود', /با دقت ±\$\{faDigit\(String\(acc\)\)\} متر ثبت شد/.test(dash))

  const postal = read('app/api/address/postal-code/route.ts')
  t('استعلام مختصاتِ موجود را بازنویسی نمی‌کند', /if \(!hasCoords\)/.test(postal))
  t('«موجود» یعنی غیرصفر', /!!Number\(c\.latitude\) && !!Number\(c\.longitude\)/.test(postal))
  t('آدرس و استان همچنان به‌روز می‌شوند', /if \(address\) patch\.address = address/.test(postal))
}

head('۶) رزروهای باشگاه — مسیرهای غایب')
{
  const club = read('app/api/bookings/club/[clubId]/route.ts')
  t('مسیر ساخته شد', /export async function GET/.test(club))
  t('فقط مالکِ باشگاه', /ownsClub\(actor, clubId\)/.test(club))
  t('نام و شماره‌ی رزروکننده هم می‌آید', /firstName.*lastName.*phone/.test(club))
  t('در یک کوئری، نه به‌ازای هر رزرو', /\.in\('id', userIds\)/.test(club))

  const st = read('app/api/bookings/[id]/status/route.ts')
  t('مسیر تغییر وضعیت ساخته شد', /export async function PUT/.test(st))
  t('فقط مالکِ باشگاه', /ownsClub\(actor, String\(b\.clubId\)\)/.test(st))
  t('لغو به مسیرِ خودش ارجاع می‌شود', /از دکمه‌ی لغو استفاده کنید/.test(st))
  t('رزروِ لغوشده دوباره فعال نمی‌شود', /این رزرو لغو شده و قابل تغییر نیست/.test(st))
  t('هر دو ستونِ وضعیت به‌روز می‌شوند', /status: next,\s*\n\s*booking_status: ALLOWED\[next\]/.test(st))

  t('catch خالی دیگر خطا را نمی‌بلعد', /دریافت رزروها ناموفق/.test(dash))
  t('خطا به کاربر نشان داده می‌شود', /bookingsError && \(/.test(dash))

  /* «رد» یک لغو است: باید بازپرداخت حساب شود و ساعتِ قفل‌شده آزاد
     گردد. مسیرِ وضعیت این کارها را نمی‌کند و عمداً `cancelled` را
     نمی‌پذیرد، پس دکمه باید به مسیرِ لغو برود. */
  t('دکمه‌ی «رد» به مسیرِ لغو می‌رود، نه مسیرِ وضعیت',
    /if \(status === 'cancelled'\)[\s\S]{0,200}\/api\/bookings\/\$\{id\}\/cancel/.test(dash))
  t('پیامِ خطای سرور به کاربر می‌رسد', /setBookingsError\(msg \|\| 'تغییر وضعیت رزرو انجام نشد'\)/.test(dash))
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
