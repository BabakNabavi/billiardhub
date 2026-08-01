/* تست ترتیب میزها و آمارِ شمردنیِ باشگاه.
       node scripts/test-club-stats.mjs

   دو چیز را نگه می‌دارد:
   ۱) ترتیب نمایش میز: اسنوکر ← پاکت بیلیارد ← هی‌بال، و درونِ هر
      رشته به ترتیب شماره.
   ۲) اینکه «اعضای فعال» و «مسابقات» دیگر فیلدِ متنیِ آزاد نیستند و
      از سرور شمرده می‌آیند. */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(join(here, '..', p), 'utf8')

const load = async rel => {
  const js = ts.transpileModule(read(rel), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  }).outputText
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
}

const { sortTables, tableTypeRank, TABLE_TYPE_ORDER } = await load('lib/tables/order.ts')

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}\n      دریافت: ${JSON.stringify(got)}`}`)
}
const ok = (name, cond, extra = '') => t(name, !!cond, true) || (extra && !cond && console.log(`      ${extra}`))
const head = s => console.log(`\n■ ${s}`)

const names = ts_ => ts_.map(x => `${x.type}${x.number}`)

head('۱) ترتیب رشته‌ها: اسنوکر ← پاکت ← هی‌بال')
{
  t('اسنوکر قبل از پاکت', tableTypeRank('snooker') < tableTypeRank('pocket'), true)
  t('پاکت قبل از هی‌بال', tableTypeRank('pocket') < tableTypeRank('highball'), true)
  t('هی‌بال قبل از VIPها', tableTypeRank('highball') < tableTypeRank('vip_snooker'), true)
  t('نوع ناشناخته ته فهرست', tableTypeRank('کاملاً-جدید') > tableTypeRank('playstation'), true)
  t('نوعِ خالی هم ته فهرست', tableTypeRank(undefined) > tableTypeRank('playstation'), true)
}

head('۲) مرتب‌سازی واقعی — ورودیِ درهم')
{
  const input = [
    { type: 'highball', number: 1 },
    { type: 'pocket', number: 2 },
    { type: 'snooker', number: 3 },
    { type: 'pocket', number: 1 },
    { type: 'snooker', number: 1 },
    { type: 'vip_snooker', number: 1 },
  ]
  t('ترتیب نهایی', names(sortTables(input)),
    ['snooker1', 'snooker3', 'pocket1', 'pocket2', 'highball1', 'vip_snooker1'])
}

head('۳) شماره‌ی میز — مرزها')
{
  t('درونِ یک رشته به ترتیب عدد',
    names(sortTables([{ type: 'snooker', number: 10 }, { type: 'snooker', number: 2 }])),
    ['snooker2', 'snooker10'])
  t('میزِ بی‌شماره آخر می‌آید، نه اول',
    names(sortTables([{ type: 'snooker' }, { type: 'snooker', number: 5 }])),
    ['snooker5', 'snookerundefined'])
  t('شماره‌ی صفر هم آخر', sortTables([{ type: 'snooker', number: 0 }, { type: 'snooker', number: 7 }])[0].number, 7)
}

head('۴) بی‌اثر بودن روی ورودی')
{
  const input = [{ type: 'highball', number: 1 }, { type: 'snooker', number: 1 }]
  const before = names(input)
  sortTables(input)
  t('آرایه‌ی ورودی دست‌نخورده می‌ماند', names(input), before)
  t('فهرست خالی خطا نمی‌دهد', sortTables([]), [])
}

head('۵) هر نوعِ شناخته‌شده رتبه‌ی یکتا دارد')
{
  const ranks = Object.values(TABLE_TYPE_ORDER)
  t('بدون رتبه‌ی تکراری', ranks.length, new Set(ranks).size)
}

/* ── بازرسی کد ───────────────────────────────────────────────────── */
head('۶) آمار باشگاه — شمرده می‌شود، تایپ نمی‌شود')
{
  const api = read('app/api/clubs/[id]/stats/route.ts')
  t('از club_members می‌شمارد', /count\('club_members'\)/.test(api), true)
  t('از tournaments می‌شمارد', /count\('tournaments'\)/.test(api), true)
  t('شمارشِ سرشماری، نه واکشیِ کامل', /count: 'exact', head: true/.test(api), true)
  t('کش نمی‌شود', /'Cache-Control': 'no-store'/.test(api), true)
  t('فقط GET دارد — نوشتنی نیست', !/export async function (POST|PUT|PATCH|DELETE)/.test(api), true)

  const dash = read('app/dashboard/club/page.tsx')
  t('فیلد اعضا readOnly است', /label="اعضای فعال" readOnly/.test(dash), true)
  t('فیلد مسابقات readOnly است', /label="مسابقات" readOnly/.test(dash), true)
  t('مقدارها از liveStats می‌آیند', /liveStats\.members\.toLocaleString\('fa-IR'\)/.test(dash), true)
  t('دیگر از clubStats.members نمی‌خواند', !/clubStats\.members/.test(dash), true)
  t('دیگر setClubStats برای members ندارد', !/\.\.\.p, members: v/.test(dash), true)

  const pub = read('app/clubs/[id]/page.tsx')
  t('صفحه‌ی عمومی هم از سرور می‌خواند', /\/api\/clubs\/\$\{id\}\/stats/.test(pub), true)
  t('صفحه‌ی عمومی دیگر از localStorage نمی‌خواندشان', !/clubStats\.members/.test(pub), true)
}

head('۷) میزها — ویرایشِ هزینه‌ی بازیکن اضافه')
{
  const dash = read('app/dashboard/club/page.tsx')
  t('editForm فیلدهای درصد را دارد', /surchargeFrom: '', surchargePercent: ''/.test(dash), true)
  t('startEditTable مقدار قبلی را می‌خواند', /surchargeFrom: t\.playerSurchargeFrom == null/.test(dash), true)
  t('saveEditTable ذخیره‌اش می‌کند', /playerSurchargeFrom: editForm\.surchargeFrom/.test(dash), true)
  t('خالی ⇒ undefined (ارث از باشگاه)', /editForm\.surchargeFrom \? parseInt\(editForm\.surchargeFrom, 10\) : undefined/.test(dash), true)
  t('در فرمِ ویرایش رندر می‌شود', /ariaLabel="تا چند نفر رایگان"/.test(dash), true)
  t('فهرست میزها مرتب‌شده رندر می‌شود', /sortTables\(tables\)\.map/.test(dash), true)

  const booking = read('app/booking/[clubId]/page.tsx')
  t('صفحه‌ی رزرو از همان منبع ترتیب می‌خواند', /tableTypeRank\(a\[0\]\) - tableTypeRank\(b\[0\]\)/.test(booking), true)
}

head('۸) درصد تخفیف و شماره‌ی میز')
{
  const dash = read('app/dashboard/club/page.tsx')
  t('درصد تخفیف با ورودیِ فارسی', /FaNumberInput value=\{discountForm\.percent\}/.test(dash), true)
  t('درصد تخفیفِ فرمِ ویرایش هم فارسی', /FaNumberInput value=\{editDiscountForm\.percent\}/.test(dash), true)
  t('هیچ input عددیِ بومی برای درصد نمانده', !/type="number" min="1" max="99"/.test(dash), true)
  t('علامت ٪ وسط‌چین', (dash.match(/marginBottom: [0-9]+, textAlign: 'center' \}\}>٪/g) ?? []).length, 2)
  t('شماره‌ی میز باریک‌تر (هر دو فرم)', (dash.match(/label="شماره میز" type="number" maxWidth=\{96\}/g) ?? []).length, 2)
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
