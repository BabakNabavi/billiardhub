/* تست اطلاعات باشگاه: قفلِ حساب بانکی، مدرک جواز، و کد پستی.
       node scripts/test-club-info.mjs

   بخشِ منطقی بدون شبکه اجرا می‌شود. اگر SMS_API_KEY باشد، استعلامِ
   واقعیِ کد پستی هم گرفته می‌شود (دو فراخوان، نه بیشتر). */

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

const { normalizePostalCode, isValidPostalCode, composeAddress } = await load('lib/address-server.ts')

head('۱) نرمال‌سازی کد پستی')
{
  t('ارقام فارسی به لاتین', normalizePostalCode('۱۴۱۶۷۵۳۹۵۵'), '1416753955')
  t('ارقام عربی به لاتین', normalizePostalCode('١٤١٦٧٥٣٩٥٥'), '1416753955')
  t('خط تیره حذف می‌شود', normalizePostalCode('14167-53955'), '1416753955')
  t('فاصله حذف می‌شود', normalizePostalCode(' 1416 7539 55 '), '1416753955')
  t('بیش از ده رقم بریده می‌شود', normalizePostalCode('141675395512345'), '1416753955')
  t('ورودی خالی', normalizePostalCode(''), '')
  t('ورودی null', normalizePostalCode(null), '')
}

head('۲) اعتبارسنجی — پیش از سوزاندنِ اعتبار سرویس')
{
  t('کد ده‌رقمی درست', isValidPostalCode('1416753955'))
  t('نُه رقم رد می‌شود', isValidPostalCode('141675395'), false)
  t('یازده رقم ⇒ بریده و درست', isValidPostalCode('14167539551'))
  t('همه صفر رد می‌شود', isValidPostalCode('0000000000'), false)
  t('همه یک رقم تکراری رد می‌شود', isValidPostalCode('1111111111'), false)
  t('حروف رد می‌شود', isValidPostalCode('abcdefghij'), false)
  t('خالی رد می‌شود', isValidPostalCode(''), false)
}

head('۳) ساختِ آدرس از اجزا')
{
  t('اجزا با ویرگول فارسی',
    composeAddress({ street: 'خیابان ولیعصر', street2: 'کوچه دوم', number: '12', floor: '3' }),
    'خیابان ولیعصر، کوچه دوم، پلاک 12، طبقه 3')
  t('اجزای خالی نادیده گرفته می‌شوند',
    composeAddress({ street: 'خیابان آزادی', number: undefined }), 'خیابان آزادی')
  t('هیچ جزئی ⇒ رشته‌ی خالی', composeAddress({}), '')
}

/* ── بازرسی کد ───────────────────────────────────────────────────── */
head('۴) قفلِ حساب بانکی پس از تأیید')
{
  const dash = read('app/dashboard/club/page.tsx')
  t('وضعیت تأیید از سرور خوانده می‌شود', /setIbanVerified\(!!c\.ibanVerified\)/.test(dash))
  t('قفل = تأییدشده و در حالِ ویرایش نبودن', /const bankLocked = ibanVerified && !bankEditing/.test(dash))
  t('دکمه‌ی «دریافت شبا از کارت» پس از تأیید خاموش',
    /disabled=\{bankLocked \|\| ibanBusy \|\| !isValidCard/.test(dash))
  t('دکمه‌ی «تأیید شبا بدون کارت» پس از تأیید پنهان',
    /isValidIban\(clubInfo\.iban\) && !bankLocked/.test(dash))
  t('استعلامِ موفقِ کارت قفل می‌کند', /setIbanVerified\(true\); setBankEditing\(false\)/.test(dash))
  t('شماره کارت قفل می‌شود', /readOnly=\{bankLocked\}[\s\S]{0,200}formatCard/.test(dash))
  t('شبا قفل می‌شود', /readOnly=\{bankLocked\}[\s\S]{0,200}formatIban/.test(dash))
  t('نام صاحب حساب قفل می‌شود', /label="نام صاحب حساب"[^\n]*readOnly=\{bankLocked\}/.test(dash))
  t('نام بانک قفل می‌شود', /label="نام بانک"[^\n]*readOnly=\{bankLocked\}/.test(dash))
  t('راهِ خروج هست (تغییر حساب)', /const unlockBank/.test(dash) && dash.includes('تغییر حساب'))

  const api = read('app/api/clubs/[id]/route.ts')
  t('سرور هم تغییرِ هر چهار فیلد را باطل‌کننده می‌داند',
    /\['iban', 'bankCard', 'ibanOwnerName', 'bankName'\]/.test(api))
  t('باطل‌کردن یعنی برداشتنِ تیک، نه رد کردنِ درخواست',
    /body\.ibanVerified = false;\s*\n\s*body\.ibanOwnerName = null;/.test(api))
  t('مقایسه بدون فاصله و خط تیره', /replace\(\/\[\\s-\]\/g, ''\)/.test(api))
}

head('۵) مدرک جواز کسب')
{
  const up = read('app/api/upload/route.ts')
  t('پیشوند documents مجاز شد', /'documents\/'/.test(up))
  t('PDF شناسایی می‌شود', /'%PDF-'/.test(up))
  t('مدرک به باکت خصوصی می‌رود', /const bucket = bucketFor\(path\)/.test(up))
  t('فایل خصوصی لینک عمومی نمی‌گیرد', /private: true/.test(up))
  t('مالکیتِ باشگاه بررسی می‌شود', /clubInPath/.test(up) && /دسترسی به این باشگاه مجاز نیست/.test(up))
  t('مدرکِ بی‌شناسه رد می‌شود', /مسیر مدرک باید شامل شناسه‌ی باشگاه باشد/.test(up))

  const doc = read('app/api/clubs/[id]/license-doc/route.ts')
  t('فقط مالک یا ادمین', /c\.ownerId !== actor\.id && !\(await isAdmin\(actor\.id\)\)/.test(doc))
  t('لینکِ امضاشده‌ی کوتاه‌عمر', /createSignedUrl\(ref, SIGNED_TTL_SEC\)/.test(doc))
  t('رکوردهای قدیمیِ URL کامل هم کار می‌کنند', /legacy: true/.test(doc))
  t('کش نمی‌شود', /'Cache-Control': 'no-store'/.test(doc))
  t('فقط GET — نوشتنی نیست', !/export async function (POST|PUT|PATCH|DELETE)/.test(doc))

  const dash = read('app/dashboard/club/page.tsx')
  t('داشبورد آپلود دارد', /const uploadLicenseDoc/.test(dash))
  t('مسیرِ آپلود شاملِ شناسه‌ی باشگاه است', /documents\/clubs\/\$\{selectedClub\.id\}\/license-/.test(dash))
  t('عکس و PDF پذیرفته می‌شود', /accept="image\/\*,application\/pdf"/.test(dash))
  t('مشاهده‌ی مدرک از مسیر مجوزدار', /\/api\/clubs\/\$\{selectedClub\.id\}\/license-doc/.test(dash))

  const admin = read('app/admin/clubs/page.tsx')
  t('ادمین هم از همان مسیر می‌خواند', /openLicenseDoc\(club\.id\)/.test(admin))
  t('لینکِ خامِ قبلی دیگر مستقیم باز نمی‌شود', !/href=\{club\.licenseDocumentUrl\}/.test(admin))
}

head('۶) کشور ⇐ کد پستی')
{
  const dash = read('app/dashboard/club/page.tsx')
  t('فیلد کشور از فرم رفت', !/label="کشور"/.test(dash))
  t('state دیگر country ندارد', !/country: c\.country/.test(dash))
  t('کد پستی در state هست', /postalCode: c\.postalCode \?\? ''/.test(dash))
  t('ورودیِ کد پستی فارسی است', /ariaLabel="کد پستی"/.test(dash))
  t('دکمه‌ی استعلام آدرس هست', dash.includes('استعلام آدرس'))
  t('استعلام فقط با ده رقم فعال است', /!\/\^\\d\{10\}\$\/\.test\(clubInfo\.postalCode\)/.test(dash))

  const route = read('app/api/address/postal-code/route.ts')
  t('پشتِ ورود است', /احراز هویت الزامی است/.test(route))
  t('سقف نرخ دارد', /hitRateLimit/.test(route))
  t('مالکیتِ باشگاه بررسی می‌شود', /دسترسی مجاز نیست/.test(route))
  t('استان/شهر با فهرست رسمی تطبیق داده می‌شود', /normalizeGeo/.test(route))
  t('از iran-geo می‌خواند — نه لیست هاردکد', /from '@\/lib\/iran-geo'/.test(route))
  t('فیلدِ خالی مقدارِ قبلی را پاک نمی‌کند', /if \(address\) patch\.address = address/.test(route))
  t('نبودِ ستون، استعلام را نمی‌شکند', /postalCodeStored: false/.test(route))

  const sql = read('../../supabase/migrations/035_club_postal_code.sql')
  t('مهاجرت ستون را اضافه می‌کند', /ADD COLUMN IF NOT EXISTS "postalCode"/.test(sql))
  t('قید فقط شکل را می‌گیرد', /IS NULL OR "postalCode" ~ '\^\[0-9\]\{10\}\$'/.test(sql))
  t('ستون country حذف نمی‌شود', !/DROP COLUMN.*country/i.test(sql))
}

/* ── استعلام واقعی ─────────────────────────────────────────────── */
if (process.env.SMS_API_KEY) {
  const { lookupPostalCode } = await load('lib/address-server.ts')
  head('۷) استعلام واقعیِ کد پستی')
  const good = await lookupPostalCode('1416753955')

  /* سرویسِ بالادستیِ ارائه‌دهنده گاهی پاسخ نمی‌دهد. قرمز کردنِ تست در
     آن حالت دروغ است — کدِ ما درست کار کرده. */
  if (good.unavailable) {
    console.log(`  ⏭  سرویسِ ارائه‌دهنده در دسترس نیست — بخشِ استعلام رد شد.`)
    console.log(`     «${good.providerMessage ?? good.message}» (code ${good.providerCode ?? '—'})`)
    t('شکستِ سرویس با «کد پستی اشتباه» اشتباه گرفته نمی‌شود',
      /موقتاً پاسخ نمی‌دهد|در دسترس نیست/.test(good.message ?? ''), true)
    t('کد کوتاه هنوز بدونِ تماس با سرویس رد می‌شود',
      (await lookupPostalCode('123')).unavailable !== true, true)
    console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
    process.exit(fail ? 1 : 0)
  }

  t('کد معتبر ⇒ ok', good.ok)
  t('کد معتبر ⇒ found', good.found)
  t('استان برگشت', typeof good.data?.province === 'string' && good.data.province.length > 0)
  t('آدرس برگشت', typeof good.data?.address === 'string' && good.data.address.length > 0)
  t('مختصات عددی‌اند', typeof good.data?.lat === 'number' && typeof good.data?.long === 'number')
  console.log(`     ← ${good.data?.province} / ${good.data?.city} — ${String(good.data?.address).slice(0, 60)}…`)

  const bad = await lookupPostalCode('1234567890')
  t('کدِ ناموجود ⇒ ok ولی found=false', bad.ok && bad.found === false, true)
  console.log(`     ← ${bad.message ?? ''}`)

  const short = await lookupPostalCode('123')
  t('کد کوتاه بدونِ تماس با سرویس رد می‌شود', short.ok === false && !short.unavailable, true)
} else {
  console.log('\n  ⏭  SMS_API_KEY نیست — استعلام واقعی رد شد.')
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
