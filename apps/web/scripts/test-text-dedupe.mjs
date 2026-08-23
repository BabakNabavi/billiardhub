/* ─────────────────────────────────────────────────────────────
   سنجه‌ی حذفِ بازگویی.
       node scripts/test-text-dedupe.mjs

   ⚠️ نودِ ۲۲٫۱۸+ لازم است: فایلِ `.ts` را مستقیم import می‌کند و
   تایپ‌زداییِ بدونِ فلگ از آن نسخه به بعد هست. روی نودِ قدیمی‌تر
   با `ERR_UNKNOWN_FILE_EXTENSION` می‌میرد.

   ⚠️ این منطق تصمیم می‌گیرد کدام متنِ *کاربر* روی صفحه بیاید، پس
   یک باگ این‌جا یعنی محتوای واقعیِ کسی بی‌صدا ناپدید شود — دقیقاً
   همان چیزی که یک‌بار اتفاق افتاد و بازبینی گرفتش.
   ───────────────────────────────────────────────────────────── */
/* ⚠️ مستقیم از `.ts` وارد می‌شود: نودِ ۲۴ تایپ‌ها را خودش برمی‌دارد.
   نسخه‌ی قبلیِ این فایل سورس را با رجکس «تایپ‌زدایی» می‌کرد و
   `readonly string[]` را نصفه می‌برید — یعنی آزمون به‌خاطرِ ابزارِ
   خودش قرمز می‌شد، نه به‌خاطرِ کد. */
import { norm, echoes, dropEchoes, keepLongest } from '../lib/text-dedupe.ts'
let pass = 0, fail = 0
const t = (name, ok) => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${name}`) }

/* دادهٔ واقعیِ پروفایلِ زنده */
const TITLE = 'خدمات فنی'
const INTRO = 'خدمات فنی بیلیارد'
const ABOUT = 'کلیه خدمات فنی نصب و سرویس'

t('عنوان و معرفیِ هم‌پوشان یکی حساب می‌شوند', echoes(TITLE, INTRO))
t('بندِ درباره بازگویی نیست', !echoes(TITLE, ABOUT))
/* ⚠️ ستونِ فقراتِ این منطق: حذف نباید اطلاعات کم کند */
t('از دو بازگویی، بلندتر می‌ماند',
  dropEchoes([TITLE, INTRO]).join('|') === INTRO)
t('ترتیب حفظ می‌شود و بلندتر جای اولی می‌نشیند',
  dropEchoes([TITLE, INTRO, ABOUT]).join('|') === `${INTRO}|${ABOUT}`)
/* ⚠️ خاصیتِ اصلی، نه جزئیاتِ آستانه: هر ورودی یا خودش می‌ماند یا
   داخلِ چیزی که مانده هست. تا وقتی این برقرار است، آستانه هرچه
   باشد محتوایی گم نمی‌شود. */
const noLoss = xs => {
  const out = dropEchoes(xs)
  return xs.map(norm).filter(Boolean).every(x => out.some(o => o.includes(x)))
}
t('هیچ واژه‌ای گم نمی‌شود',
  noLoss([TITLE, INTRO, ABOUT])
  && noLoss(['تعمیر میز بیلیارد', 'تعمیر میز بیلیارد با ضمانتِ کتبی'])
  && noLoss(['نصب', 'نصب و سرویس', 'نصب و سرویس و تعمیر']))
t('خالی و فقط‌فاصله هرگز بازگویی نیستند',
  !echoes('', TITLE) && !echoes('   ', TITLE) && dropEchoes(['', '  ', TITLE]).length === 1)
t('نیم‌فاصله در مقایسه نویسه حساب نمی‌شود',
  echoes('میان‌بر', 'میانبر'))
t('یکسانِ دقیق یک‌بار می‌ماند', dropEchoes([ABOUT, ABOUT]).length === 1)
t('متنِ نامرتبط دست‌نخورده می‌ماند',
  dropEchoes([TITLE, 'ساخت اکستنشن اختصاصی']).length === 2)

/* ── ترکیبِ واقعیِ صفحه ──
   ⚠️ آزمونِ `dropEchoes` به‌تنهایی سبز بود در حالی که *صفحه* داده
   می‌خورد: هر تابع درست بود، ترکیبشان نه. پس همان کاری که صفحه
   می‌کند این‌جا عیناً بازسازی می‌شود. */
const page = (title, intro, about) => {
  const slots = keepLongest([title, intro, ...about])
  const [lede = '', introTxt = ''] = slots.slice(0, 2).filter(Boolean)
  return [lede, introTxt, ...slots.slice(2).filter(Boolean)].filter(Boolean)
}
const pageNoLoss = (title, intro, about) => {
  const out = page(title, intro, about)
  return [title, intro, ...about].map(norm).filter(Boolean)
    .every(x => out.some(o => o.includes(x)))
}

t('ترکیبِ صفحه هم چیزی گم نمی‌کند',
  pageNoLoss(TITLE, INTRO, [ABOUT])
  && pageNoLoss(TITLE, INTRO, ['خدمات فنی بیلیارد و اسنوکر'])
  && pageNoLoss('تعمیر میز', 'تعمیر میز بیلیارد', ['تعمیر میز بیلیارد با ضمانت کتبی'])
  && pageNoLoss('', '', [])
  && pageNoLoss(TITLE, TITLE, [TITLE]))

t('بندِ بلندترِ درباره به سرلوحه می‌آید، نه اینکه حذف شود',
  page(TITLE, INTRO, ['خدمات فنی بیلیارد و اسنوکر'])[0] === 'خدمات فنی بیلیارد و اسنوکر')

t('متنِ مستقلِ درباره سرِ جایش می‌ماند',
  page(TITLE, INTRO, [ABOUT]).length === 2 && page(TITLE, INTRO, [ABOUT])[1] === ABOUT)

console.log(`\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
