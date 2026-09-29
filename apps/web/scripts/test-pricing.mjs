/* تست قیمت‌گذاری رزرو — به‌ویژه «هزینه‌ی بازیکن اضافه».
       node scripts/test-pricing.mjs

   باگی که این تست نگهبانش است: عددی که صاحب باشگاه وارد می‌کند
   («تا چند نفر رایگان») خودش هم هزینه می‌گرفت. با from=۲ دو نفر ۱۵٪
   گران‌تر می‌شد، در حالی که باید از نفر سوم شروع شود. */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, '../lib/finance/pricing.ts'), 'utf8')
const js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const {
  extraPlayers, playerMultiplier, priceBooking, surchargeOf,
  slotPrice, slotDiscountPct, hoursBetween, hoursOfRange, sanitizeDiscountRules, DEFAULT_SURCHARGE,
} = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}
const head = s => console.log(`\n■ ${s}`)

const S = (from, percent = 15, enabled = true) => ({ enabled, percent, from })

head('«تا ۲ نفر رایگان» — عدد واردشده خودش هزینه ندارد')
{
  const s = S(2)
  t('۱ نفر ⇒ ۰ نفر اضافه', extraPlayers(1, s), 0)
  t('۲ نفر ⇒ ۰ نفر اضافه  ← خودِ عددِ واردشده', extraPlayers(2, s), 0)
  t('۳ نفر ⇒ ۱ نفر اضافه', extraPlayers(3, s), 1)
  t('۴ نفر ⇒ ۲ نفر اضافه', extraPlayers(4, s), 2)
  t('ضریب ۲ نفر = ۱ (بدون افزایش)', playerMultiplier(2, s), 1)
  t('ضریب ۳ نفر = ۱٫۱۵', Math.round(playerMultiplier(3, s) * 100) / 100, 1.15)
  t('ضریب ۴ نفر = ۱٫۳۰', Math.round(playerMultiplier(4, s) * 100) / 100, 1.3)
}

head('اعداد دیگر برای «تا چند نفر رایگان»')
{
  t('from=۱ ⇒ ۱ نفر رایگان، ۲ نفر یکی اضافه', extraPlayers(2, S(1)), 1)
  t('from=۱ ⇒ ۱ نفر بدون افزایش', extraPlayers(1, S(1)), 0)
  t('from=۳ ⇒ ۳ نفر رایگان', extraPlayers(3, S(3)), 0)
  t('from=۳ ⇒ ۴ نفر یکی اضافه', extraPlayers(4, S(3)), 1)
  t('from=۴ ⇒ ۶ نفر دو اضافه', extraPlayers(6, S(4)), 2)
}

head('حالت‌های خاموش و مرزی')
{
  t('غیرفعال ⇒ همیشه صفر', extraPlayers(10, S(2, 15, false)), 0)
  t('درصد صفر ⇒ همیشه صفر', extraPlayers(10, S(2, 0)), 0)
  t('تعداد صفر ⇒ صفر', extraPlayers(0, S(2)), 0)
  t('تعداد منفی ⇒ صفر', extraPlayers(-3, S(2)), 0)
  t('اعشاری گرد می‌شود', extraPlayers(3.4, S(2)), 1)
}

head('مبلغ نهایی رزرو')
{
  const table = { id: 't', pricePerHour: 100_000 }
  const hours = hoursBetween(18, 20)          // دو ساعت
  const s = S(2)
  const two = priceBooking(hours, table, 2, s)
  t('پایه‌ی دو ساعت', two.baseAmount, 200_000)
  t('۲ نفر ⇒ بدون افزایش', two.playerExtra, 0)
  t('۲ نفر ⇒ مبلغ نهایی همان پایه', two.finalAmount, 200_000)

  const three = priceBooking(hours, table, 3, s)
  t('۳ نفر ⇒ ۱۵٪ افزایش', three.playerExtra, 30_000)
  t('۳ نفر ⇒ مبلغ نهایی', three.finalAmount, 230_000)

  const four = priceBooking(hours, table, 4, s)
  t('۴ نفر ⇒ ۳۰٪ افزایش', four.finalAmount, 260_000)
}

head('تخفیف بازه‌ای هم‌زمان با بازیکن اضافه')
{
  const table = {
    id: 't', pricePerHour: 100_000,
    discountRules: [{ startTime: '08:00', endTime: '12:00', percent: 20 }],
  }
  t('ساعت ۹ ⇒ ۲۰٪ تخفیف', slotDiscountPct(9, table), 20)
  t('ساعت ۹ ⇒ ۸۰٬۰۰۰', slotPrice(9, table), 80_000)
  t('ساعت ۱۴ ⇒ بدون تخفیف', slotPrice(14, table), 100_000)

  const r = priceBooking(hoursBetween(9, 11), table, 3, S(2))
  t('تخفیف روی پایه اعمال شده', r.discountAmount, 40_000)
  t('افزایش بازیکن روی مبلغ *پس از* تخفیف', r.finalAmount, 184_000)   // 160٬000 × 1.15
}

head('خواندن تنظیمات از میز و باشگاه')
{
  t('تنظیم میز بر باشگاه اولویت دارد',
    surchargeOf({ playerSurchargeFrom: 4 }, { playerSurchargeFrom: 2 }).from, 4)
  t('NULL در میز ⇒ ارث از باشگاه',
    surchargeOf({ playerSurchargeFrom: null }, { playerSurchargeFrom: 3 }).from, 3)
  t('هیچ‌کدام ⇒ پیش‌فرض', surchargeOf(null, null).from, DEFAULT_SURCHARGE.from)
  t('درصد بیرون از بازه ⇒ پیش‌فرض',
    surchargeOf({ playerSurchargePercent: 500 }).percent, DEFAULT_SURCHARGE.percent)
  t('from بیرون از بازه ⇒ پیش‌فرض', surchargeOf({ playerSurchargeFrom: 99 }).from, DEFAULT_SURCHARGE.from)
}

/* ── ساعت‌های یک بازه ──────────────────────────────────────────────
   باگی که این بخش نگهبانش است: `/api/bookings/slots` ساعت‌های ۸ تا
   ۲۳ را پیشنهاد می‌دهد، ولی **هیچ رزروی که ساعتِ ۲۳ را شامل می‌شد
   ثبت نمی‌شد** و کاربر «بازه‌ی زمانی معتبر نیست» می‌گرفت.

   ریشه: کلاینت پایان را `آخرین + ۱` می‌سازد، پس برای ۲۳ رشته‌ی
   `T24:00:00Z` درست می‌شد که به **روزِ بعد ۰۰:۰۰** می‌رود. سرور
   `hoursBetween(23, 0)` را صدا می‌زد و `for (h = 23; h < 0; h++)`
   هرگز اجرا نمی‌شد.

   این‌جا عینا همان payloadی ساخته می‌شود که صفحه‌ی رزرو می‌فرستد. */
{
  head('ساعت‌های بازه — payloadِ واقعیِ کلاینت')

  /* آینه‌ی apps/web/app/booking/[clubId]/page.tsx */
  const payload = (isoDate, slots) => {
    const sorted = [...slots].sort((a, b) => a - b)
    const startH = sorted[0]
    const endH = sorted[sorted.length - 1] + 1
    return [
      new Date(`${isoDate}T${String(startH).padStart(2, '0')}:00:00Z`),
      new Date(`${isoDate}T${String(endH).padStart(2, '0')}:00:00Z`),
    ]
  }
  const hoursFor = slots => hoursOfRange(...payload('2026-09-28', slots))

  t('یک ساعتِ صبح', hoursFor([8]), { ok: true, hours: [8] })
  t('سه ساعتِ پیوسته', hoursFor([18, 19, 20]), { ok: true, hours: [18, 19, 20] })
  t('ساعت ۲۲', hoursFor([22]), { ok: true, hours: [22] })
  t('⚠️ ساعت ۲۳ — آخرین اسلاتِ روز', hoursFor([23]), { ok: true, hours: [23] })
  t('⚠️ ۲۲ و ۲۳', hoursFor([22, 23]), { ok: true, hours: [22, 23] })
  t('⚠️ چهار ساعتِ پایانی', hoursFor([20, 21, 22, 23]), { ok: true, hours: [20, 21, 22, 23] })

  head('ساعت‌های بازه — ورودیِ نامعتبر')
  const D = h => new Date(`2026-09-28T${String(h).padStart(2, '0')}:00:00Z`)
  t('پایان = شروع', hoursOfRange(D(18), D(18)), { ok: false, reason: 'invalid' })
  t('پایان پیش از شروع', hoursOfRange(D(20), D(18)), { ok: false, reason: 'invalid' })
  t('عبور از نیمه‌شب', hoursOfRange(D(23), new Date('2026-09-29T02:00:00Z')),
    { ok: false, reason: 'overnight' })
  t('تاریخِ نامعتبر', hoursOfRange(new Date('x'), D(18)), { ok: false, reason: 'invalid' })

  head('هیچ ساعتی بیرونِ قیدِ دیتابیس (0..23) برنگردد')
  {
    let bad = 0
    for (let first = 8; first <= 23; first++) {
      for (let last = first; last <= 23; last++) {
        const r = hoursFor(Array.from({ length: last - first + 1 }, (_, i) => first + i))
        if (!r.ok) { bad++; console.log(`      ✗ ${first}..${last} ⟵ ${r.reason}`); continue }
        if (r.hours.some(h => h < 0 || h > 23)) { bad++; console.log(`      ✗ ${first}..${last} ساعتِ بیرون از بازه`) }
      }
    }
    t('همه‌ی بازه‌های ۸ تا ۲۳ ثبت‌شدنی‌اند', bad, 0)
  }
}

/* ── قاعده‌ی تخفیف تا نیمه‌شب ──────────────────────────────────────
   «۲۰:۰۰ تا ۰۰:۰۰» هیچ ساعتی را پوشش نمی‌داد (`eh = 0`)، و چون ساعتِ ۲۳
   حالا رزروشدنی است، این تنها راهِ تخفیف دادن به آن است. */
{
  head('قاعده‌ی تخفیف — پایانِ نیمه‌شب')
  const night = { id: 'x', pricePerHour: 100_000, discountRules: [{ startTime: '20:00', endTime: '00:00', percent: 20 }] }
  t('۲۰ پوشش داده شود', slotDiscountPct(20, night), 20)
  t('⚠️ ۲۳ پوشش داده شود', slotDiscountPct(23, night), 20)
  t('۱۹ بیرون بماند', slotDiscountPct(19, night), 0)
  t('قیمتِ ساعتِ ۲۳', slotPrice(23, night), 80_000)

  /* رفتارِ قاعده‌های سالمِ موجود نباید عوض شود */
  const day = { id: 'y', pricePerHour: 100_000, discountRules: [{ startTime: '08:00', endTime: '12:00', percent: 30 }] }
  t('قاعده‌ی روزانه — ۱۱ داخل', slotDiscountPct(11, day), 30)
  t('قاعده‌ی روزانه — ۱۲ بیرون', slotDiscountPct(12, day), 0)
  const late = { id: 'z', pricePerHour: 100_000, discountRules: [{ startTime: '20:00', endTime: '23:45', percent: 10 }] }
  t('۲۳:۴۵ — رفتارِ قبلی حفظ شود (۲۳ بیرون)', slotDiscountPct(23, late), 0)
}

/* ── بازه‌ی غیرِ تمام‌ساعت ── */
{
  head('بازه — فقط ساعتِ کامل')
  const D = x => new Date(`2026-09-28T${x}:00Z`)
  t('۱۸:۰۰ تا ۱۸:۳۰ رد شود', hoursOfRange(D('18:00'), D('18:30')), { ok: false, reason: 'invalid' })
  t('۰۸:۰۰ تا ۱۰:۳۰ رد شود', hoursOfRange(D('08:00'), D('10:30')), { ok: false, reason: 'invalid' })
  t('۱۸:۰۰ تا ۲۰:۰۰ پذیرفته شود', hoursOfRange(D('18:00'), D('20:00')), { ok: true, hours: [18, 19] })
  t('شروعِ غیرِ سرِ ساعت رد شود (۱۸:۳۰ تا ۱۹:۳۰)', hoursOfRange(D('18:30'), D('19:30')), { ok: false, reason: 'invalid' })
}

/* ── پاک‌سازیِ قواعدِ تخفیف ────────────────────────────────────────
   قواعد پیش‌تر خام در `tables.discountRules` می‌نشستند. `percent: 150`
   مبلغِ منفی می‌ساخت. */
{
  head('پاک‌سازیِ قواعدِ تخفیف')
  /* هم‌شکلِ ردیفِ واقعی — پنلِ باشگاه `id` و `label` می‌گذارد */
  const ok = { startTime: '20:00', endTime: '00:00', percent: 20, id: 'd-1785954745279', label: 'شب' }
  t('قاعده‌ی سالم دست نخورد', sanitizeDiscountRules([ok]), [ok])
  /* ⚠️ نگهبانِ باگی که بازبینی گرفت: بدونِ `id` حذفِ یک قاعده در پنل
     همه‌ی قواعدِ میز را پاک می‌کرد. */
  t('⚠️ id و label بمانند', sanitizeDiscountRules([ok])?.map(r => [r.id, r.label]), [['d-1785954745279', 'شب']])
  t('قاعده‌ی بی‌id شناسه‌ی پایدار بگیرد',
    sanitizeDiscountRules([{ startTime: '08:00', endTime: '12:00', percent: 10 }]),
    [{ startTime: '08:00', endTime: '12:00', percent: 10, id: 'd-0', label: '08:00–12:00' }])
  t('idِ بلند بریده شود', sanitizeDiscountRules([{ ...ok, id: 'x'.repeat(500) }])?.[0].id.length, 40)
  t('درصدِ ۱۰۰ انداخته شود (مبلغِ صفر پرداخت‌نشدنی است)', sanitizeDiscountRules([{ ...ok, percent: 100 }]), null)
  t('⚠️ درصدِ ۱۵۰ انداخته شود (نه بریده)', sanitizeDiscountRules([{ ...ok, percent: 150 }]), null)
  t('درصدِ منفی انداخته شود', sanitizeDiscountRules([{ ...ok, percent: -5 }]), null)
  t('درصدِ رشته‌ای عدد شود', sanitizeDiscountRules([{ ...ok, percent: '25' }]), [{ ...ok, percent: 25 }])
  t('درصدِ صفر نگه داشته شود', sanitizeDiscountRules([{ ...ok, percent: 0 }]), [{ ...ok, percent: 0 }])
  t('ساعتِ بد انداخته شود', sanitizeDiscountRules([{ ...ok, startTime: '25:00' }]), null)
  t('ساعتِ غیرِ رشته انداخته شود', sanitizeDiscountRules([{ ...ok, endTime: 20 }]), null)
  t('ورودیِ غیرِ آرایه', sanitizeDiscountRules('x'), null)
  t('آرایه‌ی خالی', sanitizeDiscountRules([]), null)
  t('فیلدِ اضافه حذف شود', sanitizeDiscountRules([{ ...ok, evil: 1 }]), [ok])
  t('فقط نامعتبرها بیفتند', sanitizeDiscountRules([ok, { ...ok, percent: 999 }, null]), [ok])
  t('سقفِ ۲۴ قاعده', sanitizeDiscountRules(Array(100).fill(ok)).length, 24)

  /* پس از پاک‌سازی هیچ مبلغی منفی نمی‌شود */
  let neg = 0
  for (const p of [-50, 0, 50, 100, 101, 150, 1e9, NaN, '200']) {
    const rules = sanitizeDiscountRules([{ startTime: '00:00', endTime: '00:00', percent: p }])
    for (let h = 0; h < 24; h++) if (slotPrice(h, { id: 'n', pricePerHour: 100_000, discountRules: rules }) < 0) neg++
  }
  t('هیچ مبلغِ منفی‌ای ساخته نشود', neg, 0)
}

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
