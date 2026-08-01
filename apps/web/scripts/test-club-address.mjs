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

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
