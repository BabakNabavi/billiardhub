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
  slotPrice, slotDiscountPct, hoursBetween, DEFAULT_SURCHARGE,
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

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
