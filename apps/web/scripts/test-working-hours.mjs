/* آزمونِ ساعتِ کاری ⟵ ساعت‌های قابلِ رزرو — بی‌دیتابیس، بی‌شبکه (امن برای CI).
       node scripts/test-working-hours.mjs

   ۱) منطقِ خالصِ lib/booking/working-hours.ts — شیفتِ معمولی، نیم‌ساعت، عبور از
      نیمه‌شب، ۲۴ساعته، تا نیمه‌شب، تعطیل، دادهِ نامعلوم، و استقلال از منطقه‌ی زمانی
   ۲) گاردهای ایستا — سرور (فهرستِ ساعت‌ها و ثبتِ رزرو) و صفحه‌ی رزرو هر سه از همین
      تابع می‌خوانند و پنجره‌ی ثابتِ ۸ تا ۲۳ دیگر جایی نمانده */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..')
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const js = ts.transpileModule(read('lib/booking/working-hours.ts'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const W = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) pass++; else fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}
const head = s => console.log(`\n■ ${s}`)
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const week = day => Object.fromEntries(W.WEEKDAYS.map(k => [k, day]))

/* ۲۰۲۶-۱۱-۲۳ دوشنبه است؛ ۲۰۲۶-۱۱-۲۲ یک‌شنبه؛ ۲۰۲۶-۱۱-۲۷ جمعه */
const MON = '2026-11-23', SUN = '2026-11-22', FRI = '2026-11-27', SAT = '2026-11-28'

head('روزِ هفته از تاریخِ تقویمی')
t('دوشنبه', W.weekdayOf(MON), 'monday')
t('جمعه', W.weekdayOf(FRI), 'friday')
t('شنبه', W.weekdayOf(SAT), 'saturday')
t('تاریخِ نادرست', W.weekdayOf('2026/11/23'), null)
t('تاریخِ ناموجود (۳۰ فوریه) غلت نمی‌خورد', W.weekdayOf('2026-02-30'), null)

head('شیفتِ معمولی — همان شکایتِ مالک')
const tenToTen = week({ isOpen: true, open: '10:00', close: '22:00' })
t('۱۰ تا ۲۲ ⟵ خانه‌های ۱۰ تا ۲۱', W.bookableHours(tenToTen, MON).hours, range(10, 21))
t('ساعتِ ۸ صبح رزرو نمی‌شود', W.hoursOutsideWorking(tenToTen, MON, [8, 9, 10]), [8, 9])
t('ساعتِ ۲۲ (تا ۲۳) بیرون است', W.hoursOutsideWorking(tenToTen, MON, [21, 22]), [22])
t('بازه‌ی درون ساعت کاری مجاز', W.hoursOutsideWorking(tenToTen, MON, [10, 11, 12]), [])
t('ساعتِ معلوم', W.bookableHours(tenToTen, MON).known, true)

head('نیم‌ساعت و ربع — فقط خانه‌ی کامل')
const live = week({ isOpen: true, open: '10:00', close: '23:45' })
t('۱۰ تا ۲۳:۴۵ (دادهِ زنده‌ی سنچوری) ⟵ ۱۰ تا ۲۲', W.bookableHours(live, MON).hours, range(10, 22))
const half = week({ isOpen: true, open: '10:30', close: '14:30' })
t('۱۰:۳۰ تا ۱۴:۳۰ ⟵ ۱۱ تا ۱۳', W.bookableHours(half, MON).hours, range(11, 13))

head('عبور از نیمه‌شب')
const night = week({ isOpen: true, open: '18:00', close: '02:00' })
t('۱۸ تا ۲ ⟵ بامدادِ ۰ و ۱ (از دیروز) و ۱۸ تا ۲۳', W.bookableHours(night, MON).hours, [0, 1, ...range(18, 23)])
t('۰ و ۱ «شب قبل»‌اند، نه پایانِ شیفتِ امشب', W.bookableHours(night, MON).spill, [0, 1])
const onlySun = { ...week({ isOpen: false }), sunday: { isOpen: true, open: '20:00', close: '03:00' } }
t('دوشنبه‌ی تعطیل هنوز بامدادِ شیفتِ یک‌شنبه را دارد', W.bookableHours(onlySun, MON).hours, [0, 1, 2])
t('… و همان سه ساعت «شب قبل»‌اند', W.bookableHours(onlySun, MON).spill, [0, 1, 2])
t('ثبتِ رزرو بامدادِ روزِ تعطیل را می‌پذیرد', W.hoursOutsideWorking(onlySun, MON, [0, 1, 2]), [])
t('… ولی ساعتِ ۳ را نه', W.hoursOutsideWorking(onlySun, MON, [2, 3]), [3])
t('روزِ یک‌شنبه خودش ۲۰ تا ۲۳', W.bookableHours(onlySun, SUN).hours, range(20, 23))
t('سه‌شنبه هیچ — تعطیل', W.bookableHours(onlySun, '2026-11-24').closedDay, true)

head('بازه‌های به‌هم‌چسبیده یکی می‌شوند')
const allDay930 = week({ isOpen: true, open: '09:30', close: '09:30' })
t('شبانه‌روزیِ ۰۹:۳۰ ⟵ ساعتِ ۹ هم باز است', W.bookableHours(allDay930, MON).hours, range(0, 23))
const junction = { ...week({ isOpen: false }), sunday: { isOpen: true, open: '18:00', close: '03:30' }, monday: { isOpen: true, open: '03:15', close: '23:00' } }
t('ادامه‌ی دیروز تا ۰۳:۳۰ + امروز از ۰۳:۱۵ ⟵ ساعتِ ۳ باز است', W.bookableHours(junction, MON).hours, range(0, 22))
t('ثبتِ رزروِ ساعتِ ۳ پذیرفته می‌شود', W.hoursOutsideWorking(junction, MON, [3]), [])
t('ساعتِ ۳ دیگر «شب قبل» نیست (در شیفتِ امروز هم نیست، ولی از ۰۳:۳۰ می‌گذرد)', W.bookableHours(junction, MON).spill, [0, 1, 2])

head('تا نیمه‌شب، ۲۴ساعته و ۲۴:۰۰')
const toMid = week({ isOpen: true, open: '14:00', close: '00:00' })
t('۱۴ تا ۰۰:۰۰ ⟵ ۱۴ تا ۲۳ و بی بامداد', W.bookableHours(toMid, MON).hours, range(14, 23))
const allDay = week({ isOpen: true, open: '00:00', close: '00:00' })
t('۰۰:۰۰ تا ۰۰:۰۰ ⟵ ۲۴ساعته', W.bookableHours(allDay, MON).hours, range(0, 23))
const allDay10 = week({ isOpen: true, open: '10:00', close: '10:00' })
t('۱۰ تا ۱۰ ⟵ ۲۴ساعته (پیوسته با دیروز)', W.bookableHours(allDay10, MON).hours, range(0, 23))
t('شبانه‌روزی برچسبِ «شب قبل» ندارد', W.bookableHours(allDay10, MON).spill, [])
const allDayAfterClosed = { ...allDay10, sunday: { isOpen: false } }
t('شبانه‌روزی پس از روزِ تعطیل از ساعتِ شروع باز می‌شود', W.bookableHours(allDayAfterClosed, MON).hours, range(10, 23))
const end24 = week({ isOpen: true, open: '09:00', close: '24:00' })
t('۰۹ تا ۲۴:۰۰ ⟵ ۹ تا ۲۳ (خواستِ مالک: ساعتِ ۲۳ رزرو شود)', W.bookableHours(end24, MON).hours, range(9, 23))
t('ثبتِ رزروِ ساعتِ ۲۳ با پایانِ ۲۴:۰۰ پذیرفته می‌شود', W.hoursOutsideWorking(end24, MON, [22, 23]), [])
t('پایانِ ۲۴:۰۰ بامدادِ روزِ بعد را باز نمی‌کند', W.bookableHours({ ...week({ isOpen: false }), sunday: { isOpen: true, open: '18:00', close: '24:00' } }, MON).hours, [])
t('۰۰:۰۰ تا ۲۴:۰۰ ⟵ ۲۴ساعته', W.bookableHours(week({ isOpen: true, open: '00:00', close: '24:00' }), MON).hours, range(0, 23))
t('شروعِ ۲۴:۰۰ نامعتبر ⟵ پیش‌فرض', W.bookableHours({ monday: { isOpen: true, open: '24:00', close: '24:00' } }, MON).known, false)

head('تعطیل و دادهِ نامعلوم')
const friClosed = { ...tenToTen, friday: { isOpen: false, open: '10:00', close: '22:00' } }
t('جمعه‌ی تعطیل ⟵ هیچ', W.bookableHours(friClosed, FRI), { hours: [], spill: [], known: true, closedDay: true })
t('شنبه پس از جمعه‌ی تعطیل عادی', W.bookableHours(friClosed, SAT).hours, range(10, 21))
t('بی ساعت ⟵ ۰۹:۰۰ تا ۲۳:۰۰ِ پیش‌فرضِ پنل ⟵ ۹ تا ۲۲', W.bookableHours(null, MON), { hours: range(9, 22), spill: [], known: false, closedDay: false })
t('شیءِ خالی ⟵ پیش‌فرض', W.bookableHours({}, MON).known, false)
t('روزِ ناقص ⟵ پیش‌فرض', W.bookableHours({ monday: { isOpen: true, open: '', close: '' } }, MON).known, false)
t('ساعتِ نادرست ⟵ پیش‌فرض', W.bookableHours({ monday: { isOpen: true, open: '25:00', close: '22:00' } }, MON).known, false)
t('isOpen غایب ⟵ پیش‌فرض', W.bookableHours({ monday: { open: '10:00', close: '22:00' } }, MON).known, false)

head('متنِ نمایشِ ساعتِ روز')
const label = (raw, date) => W.dayHoursLabel(raw, date)?.text ?? null
t('معمولی', W.dayHoursLabel(tenToTen, MON), { closed: false, hasSpill: false, text: '10:00 تا 22:00' })
t('شبانه با ادامه‌ی شبِ قبل', label(night, MON), '00:00 تا 02:00 ادامه شب قبل و 18:00 تا 02:00 بامداد')
t('شبانه پس از روزِ تعطیل — بی ادامه', label(onlySun, SUN), '20:00 تا 03:00 بامداد')
t('تا نیمه‌شب («00:00»ِ قدیمی) ⟵ ۲۴:۰۰ و بی «بامداد»', label(toMid, MON), '14:00 تا 24:00')
t('۲۴:۰۰ همان ۲۴:۰۰ نمایش داده می‌شود', label(end24, MON), '09:00 تا 24:00')
t('۰۰:۰۰ تا ۲۴:۰۰ ⟵ شبانه‌روزی', label(week({ isOpen: true, open: '00:00', close: '24:00' }), MON), 'شبانه‌روزی')
t('پایانِ پس از ۶ صبح «روز بعد» است نه «بامداد»', label(week({ isOpen: true, open: '14:00', close: '13:00' }), MON), '00:00 تا 13:00 ادامه شب قبل و 14:00 تا 13:00 روز بعد')
t('۲۴ساعته ⟵ شبانه‌روزی', label(allDay10, MON), 'شبانه‌روزی')
t('۰۰:۰۰ تا ۰۰:۰۰ ⟵ شبانه‌روزی', label(allDay, MON), 'شبانه‌روزی')
t('تعطیل', W.dayHoursLabel(friClosed, FRI), { closed: true, hasSpill: false, text: 'تعطیل' })
t('تعطیل با ادامه‌ی شبِ قبل', W.dayHoursLabel(onlySun, MON), { closed: true, hasSpill: true, text: 'تعطیل، فقط 00:00 تا 03:00 ادامه شب قبل' })
t('نامعلوم', W.dayHoursLabel(null, MON), null)

head('گاردهای ایستا — هر سه جا از همین تابع')
const slots = read('app/api/bookings/slots/route.ts')
const post = read('app/api/bookings/route.ts')
const page = read('app/booking/[clubId]/page.tsx')
t('فهرستِ ساعت‌ها از ساعتِ کاری ساخته می‌شود', /bookableHours\(/.test(slots), true)
t('فهرستِ ساعت‌ها دیگر ۸ تا ۲۳ِ ثابت ندارد', /for \(let hour = 8; hour < 24/.test(slots), false)
t('ثبتِ رزرو ساعتِ کاری را می‌سنجد', /hoursOutsideWorking\(/.test(post), true)
t('سنجشِ ساعتِ کاری پیش از ساختِ رزرو است', post.indexOf('hoursOutsideWorking(') < post.indexOf("rpc<Record<string, unknown>>('bh_create_booking'"), true)
t('صفحه‌ی رزرو از همین تابع می‌خواند', /bookableHours\(/.test(page), true)
t('صفحه‌ی رزرو دیگر ۸ تا ۲۳ِ ثابت ندارد', /length:16\},\(_,i\)=>\(\{hour:i\+8/.test(page), false)
t('بازه از ساعتِ غایب یا بسته نمی‌پرد', !/if \(!slot\) continue;/.test(page), true)
t('خانه‌های ادامه‌ی شب برچسبِ «شب قبل» دارند', /\.spill\b/.test(page) && /شب قبل/.test(page), true)
t('خطای خواندنِ باشگاه در ثبتِ رزرو ⟵ ۵۰۳، نه پنجره‌ی پیش‌فرض', /clubErr[\s\S]{0,400}status: 503/.test(post), true)
/* پیش‌فرضِ دادهِ نامعلوم همان است که باشگاه‌دار در پنل می‌بیند */
const dash = read('app/dashboard/club/page.tsx')
t('پیش‌فرضِ پنل همان ۰۹:۰۰ تا ۲۳:۰۰ است', /DEFAULT_HOURS[\s\S]{0,200}open: '09:00', close: '23:00'/.test(dash), true)

head('گاردهای ایستا — «۲۴:۰۰» در انتخابگرهای پایان')
const fts = read('components/ui/FaTimeSelect.tsx')
t('انتخابگرِ ساعت گزینه‌ی ۲۴ دارد', /allowEndOfDay \? \[\.\.\.HOURS, '24'\]/.test(fts), true)
t('ساعتِ ۲۴ همیشه 24:00 ذخیره می‌شود', /v === '24' \? '24:00'/.test(fts), true)
t('«تا»ی ساعتِ کاریِ فرمِ باشگاه ۲۴ دارد', /label="تا"[^\n]*endOfDay/.test(read('components/club/WorkingHours.tsx')), true)
t('«تا»ی ساعتِ کاریِ پنل ۲۴ دارد', /value=\{dh\.close\}[^\n]*allowEndOfDay/.test(read('components/dashboard/club/HoursTab.tsx')), true)
t('«از» ۲۴ ندارد (شروعِ ۲۴ بی‌معناست)', /value=\{dh\.open\}[^\n]*allowEndOfDay/.test(read('components/dashboard/club/HoursTab.tsx')), false)
t('پایانِ هر دو فرمِ تخفیف ۲۴ دارد', (dash.match(/ariaLabel="پایان تخفیف" compact allowEndOfDay/g) ?? []).length, 2)
t('فرمِ ساختِ باشگاه همان کامپوننتِ ساعتِ کاری را دارد', /from '(@\/|(\.\.\/)+)components\/club\/WorkingHours'/.test(read('app/clubs/new/page.tsx')), true)

console.log(`\n  نتیجه: ${pass} موفق، ${fail} ناموفق`)
process.exit(fail ? 1 : 0)
