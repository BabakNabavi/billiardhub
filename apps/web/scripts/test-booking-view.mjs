/* نمایش ساعتِ رزرو و قاعده‌ی دیده‌شدن — منطقِ خالص، بدون شبکه.
       npx tsx scripts/test-booking-view.mjs   (یا npm run test:booking-view)

   هر موردی که این‌جا هست یک‌بار در عمل باگ شده: رزروِ رهاشده که در
   فهرست می‌ماند، و ساعتی که اشتباه نوشته می‌شد. */

import { faTimeRange } from '../lib/jalali.ts'
import { isVisibleBooking } from '../lib/bookings/visibility.ts'

let pass = 0, fail = 0
const t = (n, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${ok ? '' : '  ← ' + extra}`) }
const head = s => console.log(`\n■ ${s}`)

head('۱) بازه‌ی ساعت')
t('یک ساعت', faTimeRange('17') === '۱۷:۰۰ تا ۱۸:۰۰', faTimeRange('17'))
t('سه ساعت پیوسته', faTimeRange('8,9,10') === '۰۸:۰۰ تا ۱۱:۰۰', faTimeRange('8,9,10'))
t('نیمه‌شب', faTimeRange('23') === '۲۳:۰۰ تا ۲۴:۰۰', faTimeRange('23'))
t('ترتیب نامرتب', faTimeRange('10,8,9') === '۰۸:۰۰ تا ۱۱:۰۰', faTimeRange('10,8,9'))

head('۲) ورودیِ خالی — تله‌ی Number("") === 0')
for (const [v, why] of [['', 'رشته‌ی خالی'], [null, 'null'], [undefined, 'undefined'], ['  ', 'فاصله'], [',', 'فقط ویرگول']]) {
  t(`${why} ⇒ خط تیره`, faTimeRange(v) === '—', JSON.stringify(faTimeRange(v)))
}

head('۳) ساعت‌های ناپیوسته')
t('۸ و ۱۴ دو بازه‌ی جدا', faTimeRange('8,14') === '۰۸:۰۰ تا ۰۹:۰۰، ۱۴:۰۰ تا ۱۵:۰۰', faTimeRange('8,14'))
t('دو گروهِ پیوسته', faTimeRange('8,9,14,15') === '۰۸:۰۰ تا ۱۰:۰۰، ۱۴:۰۰ تا ۱۶:۰۰', faTimeRange('8,9,14,15'))
t('تکراری دوبار شمرده نشود', faTimeRange('9,9,10') === '۰۹:۰۰ تا ۱۱:۰۰', faTimeRange('9,9,10'))

head('۴) کدام رزرو دیده می‌شود')
const show = (bs, ps) => isVisibleBooking({ booking_status: bs, payment_status: ps })
t('CONFIRMED پرداخت‌شده', show('CONFIRMED', 'PAID') === true)
t('COMPLETED', show('COMPLETED', 'PAID') === true)
t('CANCELLEDِ پرداخت‌شده دیده شود', show('CANCELLED', 'REFUNDED') === true)
t('PENDING_PAYMENT پنهان', show('PENDING_PAYMENT', 'UNPAID') === false)
t('EXPIRED پنهان', show('EXPIRED', 'UNPAID') === false)
t('CANCELLEDِ هرگز پرداخت‌نشده پنهان', show('CANCELLED', 'UNPAID') === false)
t('ردیفِ قدیمیِ بی‌وضعیت دیده شود', show(null, null) === true)

console.log('\n' + '─'.repeat(52))
console.log(`  ${fail ? '✗' : '✓'} ${pass} پاس، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
