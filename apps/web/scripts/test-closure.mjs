/* تستِ منطقِ بستنِ رزرو.
       node scripts/test-closure.mjs

   باگی که این تست نگهبانش است: تیکِ «بستن رزرو امروز» کلِ صفحه‌ی
   رزرو را می‌بست، در حالی که باید فقط همان روز بسته شود. و بستنِ
   «۳ ساعت» باید فقط همان سه ساعت را ببندد، نه کلِ روز و نه کلِ سایت. */

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

const { closureState, isDateClosed, closedHours, closureLabel, todayInTehran,
        activeOption, isOptionDisabled, optionRank } =
  await load('lib/booking/closure.ts')

let pass = 0, fail = 0
const t = (name, got, want = true) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}
const head = s => console.log(`\n■ ${s}`)

/* لحظه‌ی ثابت برای تکرارپذیری: ۱۴ مرداد ۱۴۰۵، ساعت ۱۰:۰۰ تهران */
const NOW = new Date('2026-08-05T06:30:00.000Z')   // = ۱۰:۰۰ تهران
const TODAY = todayInTehran(NOW)
const TOMORROW = '2026-08-06'
const YESTERDAY = '2026-08-04'

head('۰) پایه')
{
  t('«امروز» به وقت تهران درست حساب می‌شود', TODAY, '2026-08-05')
  /* ۲۱:۰۰ UTC = ۰۰:۳۰ فردا در تهران — همان جایی که با UTC اشتباه می‌شد */
  t('۲۱:۰۰ UTC ⇒ فردای تهران', todayInTehran(new Date('2026-08-05T21:00:00Z')), '2026-08-06')
}

head('۱) هیچ قفلی نیست')
{
  const s = closureState({ now: NOW })
  t('always=false', s.always, false)
  t('امروز باز است', isDateClosed(TODAY, s, NOW), false)
  t('فردا باز است', isDateClosed(TOMORROW, s, NOW), false)
  t('هیچ ساعتی بسته نیست', closedHours(TODAY, s, NOW), [])
  t('برچسب', closureLabel(s), 'رزرو آنلاین باز است')
}

head('۲) «بستن رزرو امروز» — همان باگِ اصلی')
{
  const s = closureState({ closeToday: true, now: NOW })
  t('کلِ رزرو بسته نمی‌شود (always=false)', s.always, false)
  t('امروز بسته است', isDateClosed(TODAY, s, NOW), true)
  t('فردا باز می‌ماند  ← باگ این‌جا بود', isDateClosed(TOMORROW, s, NOW), false)
  t('پس‌فردا هم باز', isDateClosed('2026-08-07', s, NOW), false)
  t('همه‌ی ۲۴ ساعتِ امروز بسته', closedHours(TODAY, s, NOW).length, 24)
  t('هیچ ساعتی از فردا بسته نیست', closedHours(TOMORROW, s, NOW), [])
  t('برچسب گویا است', closureLabel(s), 'رزرو امروز بسته است — روزهای آینده باز')
}

head('۳) بستن برای ۳ ساعت — فقط همان ساعت‌ها')
{
  /* ساعت ۱۰:۰۰ تهران + ۳ ساعت = تا ۱۳:۰۰ */
  const until = new Date(NOW.getTime() + 3 * 3600_000).toISOString()
  const s = closureState({ closedUntil: until, now: NOW })
  t('کلِ رزرو بسته نمی‌شود', s.always, false)
  t('امروز به‌عنوان یک *روز* بسته نیست', isDateClosed(TODAY, s, NOW), false)
  t('فردا هم باز است', isDateClosed(TOMORROW, s, NOW), false)

  const h = closedHours(TODAY, s, NOW)
  /* ساعت‌های ۰ تا ۱۲ درونِ بازه‌اند: ساعتِ ۱۲ از ۱۲:۰۰ شروع می‌شود که
     هنوز پیش از ۱۳:۰۰ است. ساعتِ ۱۳ دیگر بسته نیست. */
  t('ساعتِ ۱۲ بسته است', h.includes(12), true)
  t('ساعتِ ۱۳ باز است', h.includes(13), false)
  t('ساعتِ ۲۰ باز است', h.includes(20), false)
  t('بیشترین ساعتِ بسته ۱۲ است', Math.max(...h), 12)
  t('هیچ ساعتی از فردا بسته نیست', closedHours(TOMORROW, s, NOW), [])
}

head('۴) بستن برای ۱۲ ساعت — از ۱۰ صبح تا ۱۰ شب')
{
  const until = new Date(NOW.getTime() + 12 * 3600_000).toISOString()
  const s = closureState({ closedUntil: until, now: NOW })
  const h = closedHours(TODAY, s, NOW)
  t('ساعتِ ۲۱ بسته است', h.includes(21), true)
  t('ساعتِ ۲۲ باز است', h.includes(22), false)
  t('روز هنوز کاملاً بسته نیست', isDateClosed(TODAY, s, NOW), false)
  t('فردا دست‌نخورده', closedHours(TOMORROW, s, NOW), [])
}

head('۵) قفلی که از نیمه‌شب رد می‌شود')
{
  /* ۱۰ صبح + ۲۰ ساعت = ۶ صبحِ فردا */
  const until = new Date(NOW.getTime() + 20 * 3600_000).toISOString()
  const s = closureState({ closedUntil: until, now: NOW })
  t('امروز کاملاً بسته است', isDateClosed(TODAY, s, NOW), true)
  t('فردا کاملاً بسته نیست', isDateClosed(TOMORROW, s, NOW), false)
  const h = closedHours(TOMORROW, s, NOW)
  t('صبحِ فردا تا ۵ بسته است', h.includes(5), true)
  t('ساعتِ ۶ فردا باز است', h.includes(6), false)
}

head('۶) «همیشه»')
{
  const s = closureState({ closedUntil: 'infinity', now: NOW })
  t('always=true', s.always, true)
  t('هر روزی بسته است', isDateClosed(TOMORROW, s, NOW), true)
  t('همه‌ی ساعت‌ها بسته', closedHours(TOMORROW, s, NOW).length, 24)
  t('«always» هم پذیرفته می‌شود', closureState({ closedUntil: 'always', now: NOW }).always, true)
  t('برچسب', closureLabel(s), 'رزرو آنلاین همیشه بسته است')
}

head('۷) قفلِ منقضی و ورودی‌های بد')
{
  const past = new Date(NOW.getTime() - 3600_000).toISOString()
  t('قفلِ گذشته اثری ندارد', closureState({ closedUntil: past, now: NOW }).untilMs, null)
  t('رشته‌ی خالی', closureState({ closedUntil: '', now: NOW }).untilMs, null)
  t('null', closureState({ closedUntil: null, now: NOW }).untilMs, null)
  t('مقدارِ بی‌معنی', closureState({ closedUntil: 'سلام', now: NOW }).untilMs, null)
  /* داده‌ی قدیمیِ localStorage عددِ میلی‌ثانیه بود، نه ISO */
  const ms = String(NOW.getTime() + 3600_000)
  t('عددِ میلی‌ثانیه‌ی قدیمی هم خوانده می‌شود',
    closureState({ closedUntil: ms, now: NOW }).untilMs, NOW.getTime() + 3600_000)
  t('روزِ گذشته بسته حساب نمی‌شود', isDateClosed(YESTERDAY, closureState({ now: NOW }), NOW), false)
}

head('۸) هر دو قفل با هم')
{
  const until = new Date(NOW.getTime() + 3 * 3600_000).toISOString()
  const s = closureState({ closeToday: true, closedUntil: until, now: NOW })
  t('امروز بسته (به‌خاطر closeToday)', isDateClosed(TODAY, s, NOW), true)
  t('فردا باز', isDateClosed(TOMORROW, s, NOW), false)
  t('برچسب هر دو را می‌گوید', /امروز همیشه بسته/.test(closureLabel(s)), true)
}

head('۸ب) سلسله‌مراتبِ اولویت — همیشه ← امروز ← ۱۲ ← ۶ ← ۳')
{
  const at = h => new Date(NOW.getTime() + h * 3600_000).toISOString()
  const open   = closureState({ now: NOW })
  const h3     = closureState({ closedUntil: at(3),  now: NOW })
  const h6     = closureState({ closedUntil: at(6),  now: NOW })
  const h12    = closureState({ closedUntil: at(12), now: NOW })
  const today  = closureState({ closeToday: true,    now: NOW })
  const always = closureState({ closedUntil: 'infinity', now: NOW })

  /* کدام دکمه «زده‌شده» دیده می‌شود */
  t('هیچ‌کدام فعال نیست', activeOption(open, NOW), null)
  t('۳ ساعت ⇒ دکمه‌ی ۳', activeOption(h3, NOW), 3)
  t('۶ ساعت ⇒ دکمه‌ی ۶', activeOption(h6, NOW), 6)
  t('۱۲ ساعت ⇒ دکمه‌ی ۱۲', activeOption(h12, NOW), 12)
  t('همیشه ⇒ دکمه‌ی همیشه', activeOption(always, NOW), 'always')
  /* دو ساعت بعد از زدنِ «۱۲ ساعت» هنوز همان دکمه فعال است */
  const later = new Date(NOW.getTime() + 2 * 3600_000)
  t('گذرِ زمان دکمه را عوض نمی‌کند', activeOption(h12, later), 12)

  /* هیچ قفلی ⇒ همه‌چیز روشن */
  t('باز: هیچ گزینه‌ای خاموش نیست',
    [3, 6, 12, 'always', 'today'].map(o => isOptionDisabled(o, open, NOW)),
    [false, false, false, false, false])

  /* «۳ ساعت» ضعیف‌ترین است و چیزی را خاموش نمی‌کند */
  t('۳ ساعت چیزی را خاموش نمی‌کند',
    [6, 12, 'today', 'always'].map(o => isOptionDisabled(o, h3, NOW)),
    [false, false, false, false])

  /* «۶ ساعت» فقط «۳» را می‌بندد */
  t('۶ ساعت فقط ۳ را خاموش می‌کند',
    [3, 12, 'today', 'always'].map(o => isOptionDisabled(o, h6, NOW)),
    [true, false, false, false])

  /* «۱۲ ساعت» هر دوی ۶ و ۳ را می‌بندد */
  t('۱۲ ساعت، ۶ و ۳ را خاموش می‌کند',
    [3, 6, 12, 'today', 'always'].map(o => isOptionDisabled(o, h12, NOW)),
    [true, true, false, false, false])

  /* تیکِ «امروز» هر سه ساعتی را می‌بندد ولی «همیشه» را نه */
  t('امروز، ۳ و ۶ و ۱۲ را خاموش می‌کند',
    [3, 6, 12].map(o => isOptionDisabled(o, today, NOW)),
    [true, true, true])
  t('ولی «همیشه» همچنان روشن است', isOptionDisabled('always', today, NOW), false)

  /* «همیشه» همه‌چیز را می‌بندد، از جمله تیکِ امروز */
  t('همیشه، همه‌چیز را خاموش می‌کند',
    [3, 6, 12, 'today'].map(o => isOptionDisabled(o, always, NOW)),
    [true, true, true, true])
  /* حتی خودش: با «همیشه» تنها راهِ باقی‌مانده «باز کردن رزرو» است */
  t('خودِ «همیشه» هم خاموش می‌شود', isOptionDisabled('always', always, NOW), true)
  /* ولی ۳/۶/۱۲ باید قابلِ تمدید بمانند */
  t('۳ ساعتِ فعال قابلِ تمدید است', isOptionDisabled(3, h3, NOW), false)
  t('۶ ساعتِ فعال قابلِ تمدید است', isOptionDisabled(6, h6, NOW), false)

  /* ترتیبِ رتبه‌ها همان چیزی است که کاربر خواسته */
  t('ترتیبِ رتبه‌ها',
    [optionRank(3), optionRank(6), optionRank(12), optionRank('today'), optionRank('always')],
    [0, 1, 2, 3, 4])
}

/* ── بازرسی کد ───────────────────────────────────────────────────── */
head('۹) اعمال روی سرور')
{
  const bk = read('app/api/bookings/route.ts')
  t('از منبعِ مشترک می‌خواند', /from '@\/lib\/booking\/closure'/.test(bk))
  t('فقط تاریخِ بسته را رد می‌کند', /isDateClosed\(bookingDate, closure\)/.test(bk))
  t('ساعتِ بسته را هم رد می‌کند', /closedHours\(bookingDate, closure\)/.test(bk))
  t('میزِ بسته رد می‌شود', /t\.reservationClosed === true/.test(bk))
  t('«همیشه» پیامِ خودش را دارد', /closure\.always/.test(bk))

  const tables = read('app/api/clubs/[id]/tables/route.ts')
  t('فهرستِ رزرو میزهای بسته را نمی‌دهد', /reservationClosed !== true/.test(tables))
  t('داشبورد با all=1 همه را می‌گیرد', /searchParams\.get\('all'\) === '1'/.test(tables))

  const sync = read('app/api/clubs/[id]/tables/sync/route.ts')
  t('ذخیره‌ی وضعیتِ میز', /reservationClosed: !!t\.reservationClosed/.test(sync))

  const settings = read('app/api/clubs/[id]/settings/route.ts')
  t('بستنِ موقت روی سرور ذخیره می‌شود', /reserveClosedUntil/.test(settings))
  t('لحظه‌ی پایان را سرور حساب می‌کند', /Date\.now\(\) \+ h \* 3600_000/.test(settings))
  t('بازه‌ی نامعتبر رد می‌شود', /بازه‌ی بستن معتبر نیست/.test(settings))
}

head('۱۰) رفتارِ صفحه‌ها')
{
  const bp = read('app/booking/[clubId]/page.tsx')
  t('دیگر از localStorage نمی‌خواند', !/club-reserveClosedUntil/.test(bp))
  t('از سرور می‌خواند', /booking-status/.test(bp))
  t('فقط «همیشه» کلِ صفحه را می‌بندد', /if \(closure\.always\) return/.test(bp))
  t('روزهای بسته در تقویم غیرفعال‌اند', /isClosedDay=\{d => isDateClosed/.test(bp))
  t('ساعت‌های بسته قرمز می‌شوند', /const isShut  = blockedHours\.includes\(slot\.hour\)/.test(bp))
  t('برچسبِ «بسته» روی ساعت', /بسته<\/span>/.test(bp))
  t('نوارِ توضیح دارد', /closureLabel\(closure\)/.test(bp))

  const dash = read('app/dashboard/club/page.tsx')
  /* خودِ کامپوننت به fields.tsx رفت؛ چیزی که این‌جا اهمیت دارد این
     است که هنوز در هر دو فرمِ صفحه به کار می‌رود. */
  t('تیکِ بستنِ میز هست', /export function ClosedToggle/.test(read('components/dashboard/club/fields.tsx')))
  t('در هر دو فرم', (dash.match(/<ClosedToggle/g) ?? []).length, 2)
  t('«یک روز» حذف شد', !/\['یک روز', 24\]/.test(dash))
  t('«همیشه» مانده است', /\['همیشه', 'always'\]/.test(dash))
  /* قاعده از ماژولِ مشترک می‌آید نه از شرطِ دستیِ داخلِ صفحه */
  t('خاموشی از سلسله‌مراتب می‌آید', dash.includes('isOptionDisabled(opt, closure)'))
  t('دکمه‌ی فعال رنگ می‌گیرد', /const on = activeClosureOpt === opt/.test(dash))
  t('تیکِ امروز با «همیشه» خاموش می‌شود',
    dash.includes("todayLocked = isOptionDisabled('today', closure)"))
  t('بستنِ موقت روی سرور ذخیره می‌شود', /closeForHours: opt === 'open' \? null : opt/.test(dash))

  /* ترتیبِ خواسته‌شده: اول تیکِ «امروز»، بعد وضعیت و دکمه‌های ساعتی */
  /* جای *استفاده* در JSX سنجیده می‌شود نه جای تعریفِ متغیر — تعریف
     صدها خط بالاتر است و هر مقایسه‌ای با آن بی‌معنی. */
  t('«بستن رزرو امروز» بالاتر از نوارِ وضعیت است',
    dash.indexOf('بستن رزرو امروز') < dash.indexOf('{reserveClosedLabel}'))
  /* شماره‌ی پیامک پیش‌تر میانِ آن دو نشسته بود و ترتیب را می‌شکست */
  t('شماره‌ی پیامک پایین‌ترین کارت است',
    dash.indexOf('{reserveClosedLabel}') < dash.indexOf('شماره‌ی دریافت پیامک‌ها'))

  /* «همیشه بسته» باید همان‌جا در صفحه‌ی باشگاه گفته شود، نه یک
     صفحه جلوتر */
  const clubPage = read('app/clubs/[id]/page.tsx')
  t('صفحه‌ی باشگاه وضعیت را می‌خواند', /booking-status/.test(clubPage))
  t('دکمه‌ی رزرو خاموش می‌شود', /disabled=\{bookingClosed\}/.test(clubPage))
  t('پیامِ «تا اطلاع بعدی» نشان داده می‌شود',
    /رزروهای این باشگاه تا اطلاع بعدی بسته است/.test(clubPage))
  t('کلیک وقتی بسته است کاری نمی‌کند', /if \(bookingClosed\) return;/.test(clubPage))

  const bookPage = read('app/booking/[clubId]/page.tsx')
  t('صفحه‌ی رزرو هم همان را می‌گوید', /رزروها تا اطلاع بعدی بسته است/.test(bookPage))
  t('نشانِ «رزرو بسته» روی کارتِ میز', /رزرو بسته<\/span>/.test(dash))
  t('داشبورد میزهای بسته را هم می‌گیرد', /tables\?all=1/.test(dash))

  const sql = read('../../supabase/migrations/036_reservation_closure.sql')
  t('ستونِ میز', /ADD COLUMN IF NOT EXISTS "reservationClosed"/.test(sql))
  t('ستونِ باشگاه', /ADD COLUMN IF NOT EXISTS "reserveClosedUntil"/.test(sql))
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
