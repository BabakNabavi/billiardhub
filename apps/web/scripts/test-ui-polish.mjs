/* تستِ رگرسیونِ اصلاحاتِ ظاهری و باگِ کارت بانکی.
       node scripts/test-ui-polish.mjs

   این‌ها همه «بازرسی کد»اند و فقط ثابت می‌کنند تغییر سرِ جایش هست.
   دیدنِ واقعیِ چیدمان کارِ test:club-dashboard:ui است. */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(join(here, '..', p), 'utf8')

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !extra ? '' : `  ← ${extra}`}`)
}
const head = s => console.log(`\n■ ${s}`)

const dash = read('app/dashboard/club/page.tsx')
const booking = read('app/booking/[clubId]/page.tsx')
const css = read('app/globals.css')
const timeSel = read('components/ui/FaTimeSelect.tsx')
const profile = read('app/profile/me/page.tsx')

head('۱) کارت بانکی پروفایل — مسیرِ ۴۰۴ رفع شد')
{
  t('دیگر به مسیرِ مرده‌ی NestJS درخواست نمی‌دهد',
    !/user\/profile\/bank-card/.test(profile))
  t('به مسیر واقعیِ Next می‌رود', /'\/api\/users\/bank-card'/.test(profile))
  const route = read('app/api/users/bank-card/route.ts')
  t('مسیر ساخته شده و PUT دارد', /export async function PUT/.test(route))
  t('پشتِ ورود است', /ابتدا وارد شوید/.test(route))
  t('سقف نرخ دارد', /hitRateLimit/.test(route))
  t('Luhn محلی پیش از مصرفِ اعتبار', /isValidCard\(card\)/.test(route))
  t('کارت با کد ملیِ احرازشده تطبیق داده می‌شود', /matchCard\(u\.national_id/.test(route))
  t('کارتِ شخصِ دیگر رد می‌شود (۴۲۲)', /status: 422/.test(route))
  t('هویتِ تأییدنشده پیامِ خودش را دارد', /needsIdentity: true/.test(route))
  t('نام دارنده از هویت نوشته می‌شود، نه از ورودی',
    /const ownerName = `\$\{u\.firstName/.test(route))
  t('ورودیِ نامِ دارنده از فرم حذف شد', !/setBankOwner\(e\.target\.value\)/.test(profile))
  t('پیامِ دقیقِ سرور به کاربر می‌رسد', /j\?\.message \|\| 'ثبت کارت انجام نشد'/.test(profile))
  const prof = read('app/api/users/profile/route.ts')
  t('پروفایل کارتِ ثبت‌شده را برمی‌گرداند', /bankCard: u\.bank_card/.test(prof))
  t('کارت در فهرستِ نوشتنیِ پروفایل نیست',
    !/'bank_card'/.test(prof.split('const EDITABLE')[1]?.split(']')[0] ?? ''))
}

head('۲) انتخاب ساعت — ترتیب و ظاهر')
{
  t('قابِ ساعت LTR است (۰۹:۳۰ نه ۳۰:۰۹)', /direction: 'ltr'/.test(timeSel))
  t('کشوی بومی جایش را به Select پروژه داد', !/<select[\s/>]/.test(timeSel))
  t('از کامپوننت مشترک استفاده می‌کند', /import Select from '\.\/Select'/.test(timeSel))
  t('ساعت اول می‌آید', timeSel.indexOf('ساعت ${ariaLabel}') < timeSel.indexOf('دقیقه‌ی ${ariaLabel}'))

  /* ── ردیفِ ساعاتِ کاری در موبایل ──
     این چند بار «درست شد» و هر بار هیچ اثری نداشت، چون قاعده‌های CSS
     `.wh-cell select` را هدف می‌گرفتند و چنین عنصری در DOM نبود —
     سلکتورِ بی‌هدف نه خطا می‌دهد نه اثر. */
  /* کامنت‌ها کنار گذاشته می‌شوند، وگرنه همین توضیحِ بالای همان بخش —
     که ماجرا را شرح می‌دهد — خودش تست را قرمز می‌کند. */
  const cssRules = css.replace(/\/\*[\s\S]*?\*\//g, '')
  t('CSS به عنصرِ ناموجودِ select اشاره نمی‌کند', !/\.wh-cell\s+select/.test(cssRules),
    'قاعده‌ی بی‌اثر — این کامپوننت دکمه رندر می‌کند نه select')
  t('جعبه‌های ساعت عرضِ ثابت ندارند', !/width: compact \? 62/.test(timeSel),
    'عرضِ ثابت + flexShrink:0 یعنی سرریز و روی‌هم‌افتادن در موبایل')
  t('جعبه‌ها کشسان‌اند', /flex: '1 1 0'/.test(timeSel))
  t('فلشِ رو‌به‌پایین در جعبه‌ی ساعت نیست', /noChevron/.test(timeSel),
    'فلش یک‌سومِ عرضِ جعبه‌ی باریک را می‌گرفت')
  t('کامپوننتِ Select گزینه‌ی حذفِ فلش دارد',
    /noChevron\?: boolean/.test(read('components/ui/Select.tsx')))
}

head('۳) فرمِ میز — چیدمانِ تازه')
{
  t('کلاسِ چیدمان روی هر دو فرم هست',
    (dash.match(/className="bh-table-form"/g) ?? []).length === 2,
    String((dash.match(/className="bh-table-form"/g) ?? []).length))
  t('شبکه‌ی هم‌عرضِ قبلی برای میزها نمانده',
    !/minmax\(145px, 1fr\)\'\), gap: 12, marginBottom: 16/.test(dash))
  t('عکسِ میز کنارِ فیلدهاست', (dash.match(/className="bh-tf-photo"/g) ?? []).length === 2)
  t('CSS شبکه تعریف شده', /\.bh-tf-fields\s*\{/.test(css))
  t('شماره‌ی میز باریک‌ترین ستون است', /grid-template-columns: 84px/.test(css))
  /* چیدمانِ موبایل از «۷۸px + ۱fr» به شبکه‌ی دوازده‌ستونی رفت تا برند و
     مدل دقیقاً نصف‌نصف شوند. */
  t('موبایل دو ردیف می‌شود: شماره+قیمت، بعد برند+مدل',
    /\.bh-tf-num\s+\{ grid-column: span 4; \}/.test(css)
    && /\.bh-tf-price \{ grid-column: span 8/.test(css))
  t('عکس در موبایل تمام‌عرض', /\.bh-tf-photo \{ flex: 1 1 100%/.test(css))
}

head('۴) ردیفِ تخفیفِ زمانی')
{
  t('کلاسِ ردیف روی هر دو فرم هست',
    (dash.match(/className="bh-disc-row"/g) ?? []).length === 2,
    String((dash.match(/className="bh-disc-row"/g) ?? []).length))
  t('flex-wrap قبلی برداشته شد', !/flex: '1 1 110px', minWidth: 100/.test(dash))
  t('CSS ردیف تعریف شده', /\.bh-disc-row\s*\{/.test(css))
  t('ستونِ درصد فقط جای دو رقم است', /58px/.test(css))
  t('در موبایل درصد ستونِ باریکِ خودش را دارد', /grid-template-columns: 62px repeat\(3, 1fr\)/.test(css))
  t('دکمه در موبایل تمام‌عرض', /\.bh-disc-add \{ grid-column: 1 \/ -1/.test(css))
}

head('۵) برچسب‌ها و جداکننده')
{
  t('«تا چند نفر رایگان» دیگر نیست', !dash.includes('تا چند نفر رایگان'))
  t('«از این تعداد» جایش آمد', (dash.match(/از این تعداد/g) ?? []).length >= 2)
  t('جداکننده‌ی عنوانِ میز «|» است', /میز \$\{t\.number\} \| /.test(dash))
  t('جداکننده‌ی «—» از عنوانِ میز رفت', !/میز \$\{t\.number\} — /.test(dash))
}

head('۶) صفحه‌ی رزرو')
{
  t('نشانِ دکمه‌مانندِ رشته از کارتِ میز حذف شد',
    !/borderRadius:'20px',padding:'2px 9px',fontWeight:700\}\}>\{TYPE_LABEL\[table\.type\]/.test(booking))
  t('عنوانِ میز به شکل «میز X | رشته» است',
    /میز \$\{toFa\(table\.number\)\} /.test(booking) && /TYPE_LABEL\[table\.type\]\?\?table\.type\}`\}/.test(booking))
  t('شمارنده‌ی بازیکن وسط‌چین شد', /flexDirection:'column',alignItems:'center'/.test(booking))
  t('توضیح زیرِ شمارنده می‌آید و وسط‌چین است',
    /تا \{toFa\(surcharge\.from\)\} نفر بدون افزایش، از نفر بعد، هر نفر \{toFa\(surcharge\.percent\)\} درصد اضافه می‌شود/.test(booking))
  t('«رایگان» گمراه‌کننده برداشته شد', !/نفر رایگان؛ از نفر بعد/.test(booking))
  t('ترتیبِ میزها همچنان از منبعِ واحد می‌آید', /tableTypeRank\(a\[0\]\)/.test(booking))
}

head('۷) نشانِ «تأیید مدارک»')
{
  const badge = read('components/VerificationBadges.tsx')
  const route = read('app/api/users/document-status/route.ts')
  t('دیگر از verificationStatusِ کاربر خوانده نمی‌شود',
    !/documents: j\.verificationStatus/.test(badge))
  t('از مسیرِ اختصاصیِ وضعیتِ مدرک می‌خواند', /\/api\/users\/document-status/.test(badge))
  t('سبز فقط با state === verified', /done=\{state\.documents === 'verified'\}/.test(badge))
  t('حالتِ «در انتظار بررسی» هم دارد', /pending=\{state\.documents === 'pending'\}/.test(badge))
  t('نشانِ انتظار سبز نیست', /در انتظار بررسی/.test(badge) && /#92600A/.test(badge))
  t('باشگاه‌دار از جوازِ باشگاه سنجیده می‌شود', /licenseVerified/.test(route))
  t('آپلودِ بدونِ تأیید ⇒ pending', /uploaded \? 'pending' : 'missing'/.test(route))
  t('نقشِ بدونِ مدرک ⇒ not_required', /'not_required'/.test(route))
  t('فقط GET — نوشتنی نیست', !/export async function (POST|PUT|PATCH|DELETE)/.test(route))
  t('پشتِ ورود است', /ابتدا وارد شوید/.test(route))
}

head('۸) اصلاحاتِ این دور')
{
  /* ClosedToggle به components/dashboard/club/fields.tsx منتقل شد —
     صفحه‌ی داشبورد ۳۸۸۱ خط بود و این‌ها تنها بخشی بودند که هیچ
     وابستگی‌ای به state آن نداشتند. */
  t('برچسبِ تیکِ بستنِ میز',
    /قابلیت رزرو برای این میز غیرفعال می‌شود/.test(read('components/dashboard/club/fields.tsx')))
  t('«منطقه زمانی» حذف شد', !/label="منطقه زمانی"/.test(dash))
  t('تعداد میزها چهار ستونی است', /grid-template-columns: repeat\(4, 1fr\)/.test(css))
  /* فقط داخلِ همان بلوک شمرده می‌شود: این کلیدها جاهای دیگرِ فایل هم
     هستند (تعریفِ نوع، نگاشتِ ظرفیت) و `indexOf` روی کلِ فایل اولین
     رخداد را می‌گرفت، نه ترتیبِ واقعیِ فهرست. */
  {
    const block = dash.split('className="bh-table-counts"')[1]?.split('].map(f =>')[0] ?? ''
    const order = [...block.matchAll(/key: '(\w+)'/g)].map(m => m[1])
    t('ترتیبِ تعداد میزها', order, [
      'snookerTables', 'pocketTables', 'vipSnookerTables', 'vipPocketTables',
      'highballTables', 'airHockeyTables', 'dartBoards', 'playstations',
    ])
  }
  t('برند و مدل هرکدام نیمی از ردیف', /\.bh-tf-txt\s+\{ grid-column: span 6; \}/.test(css))
  t('ردیفِ ساعاتِ کاری شبکه‌ای شد', /\.wh-day-row\s*\{/.test(css))
  /* تبِ ساعاتِ کاری به کامپوننتِ خودش منتقل شد — فقط چهار prop لازم
     داشت، پس برخلافِ بقیه‌ی تب‌ها بی‌خطر جدا می‌شد. */
  t('انتخابگرهای ساعت فشرده‌اند',
    /ariaLabel="شروع" compact/.test(read('components/dashboard/club/HoursTab.tsx')))
  /* قفل دیگر با تغییرِ کد پستی یا رفرش باز نمی‌شود — سنجشِ قبلی
     همان رفتارِ قدیمی را تثبیت می‌کرد که خودش راهِ سوزاندنِ اعتبار بود */
  t('قفلِ کد پستی از سرور می‌آید', /postalLocked = postalVerified \|\|/.test(dash))
  t('در همان نشست هم بی‌درنگ اعمال می‌شود', /postalDone === clubInfo\.postalCode/.test(dash))
  /* باگی که دکمه‌های بستن را «بی‌اثر» نشان می‌داد: سرور ISO می‌داد و
     این‌جا هنوز عددِ میلی‌ثانیه خوانده می‌شد. */
  t('وضعیتِ بستن از منبعِ مشترک خوانده می‌شود',
    /const closure = closureState\(\{ closeToday, closedUntil: reserveClosedUntil \}\)/.test(dash))
  t('منطقِ دستیِ قدیمی برداشته شد', !/Number\(reserveClosedUntil\) > Date\.now\(\)/.test(dash))
}

head('۹) صفحه‌ی ویرایش پروفایل')
{
  const prof = read('app/profile/me/page.tsx')
  const route = read('app/api/users/bank-card/route.ts')

  t('بخشِ جداگانه‌ی «موقعیت» حذف شد', !/title="موقعیت"/.test(prof))
  t('استان/شهر داخلِ اطلاعات تماس آمد',
    /title="اطلاعات تماس"[\s\S]{0,500}<ProvinceCitySelect/.test(prof))
  t('ترتیب: استان/شهر ← نشانی ← تلفن',
    prof.indexOf('<ProvinceCitySelect') < prof.indexOf('label="نشانی"')
    && prof.indexOf('label="نشانی"') < prof.indexOf('label="تلفن محل کار"'))
  t('بخشِ «دسترسی‌ها» حذف شد', !/title="دسترسی‌ها"/.test(prof))

  t('چهار فیلدِ بانکی به ترتیب',
    prof.indexOf('label="شماره کارت"') < prof.indexOf('label="شماره شبا"')
    && prof.indexOf('label="شماره شبا"') < prof.indexOf('label="نام صاحب حساب"')
    && prof.indexOf('label="نام صاحب حساب"') < prof.indexOf('label="نام بانک"'))
  /* نشانِ کهربایی که شماره‌ی کارت را دوباره نشان می‌داد برداشته شد */
  t('شماره کارت دیگر دو جا نیست', !/<CreditCard size=\{17\} \/>/.test(prof))
  t('شبا فقط‌خواندنی است', /label="شماره شبا"[\s\S]{0,200}readOnly/.test(prof))
  t('نام حساب فقط‌خواندنی', /label="نام صاحب حساب"[\s\S]{0,160}readOnly/.test(prof))
  t('نام بانک فقط‌خواندنی', /label="نام بانک"[\s\S]{0,160}readOnly/.test(prof))
  t('پس از استعلام قفل می‌شود', /setCardLocked\(true\)/.test(prof))
  /* «تغییر کارت» حذف شد: با آن، هر کاربر می‌توانست بی‌شمار بار
     استعلامِ پولی بگیرد. حالا تغییر فقط با تیکتِ پشتیبانی است. */
  t('دکمه‌ی خودخدمتیِ «تغییر کارت» نمانده', !/setCardLocked\(false\)/.test(prof))
  t('جایش لینکِ پشتیبانی آمد', /درخواست تغییر کارت از پشتیبانی/.test(prof))
  t('قفل از فلگِ سرور خوانده می‌شود', /setCardLocked\(j\.bankCardVerified/.test(prof))

  /* ذخیره‌شدن کافی نیست — باید در پاسخِ پروفایل هم برگردد، وگرنه صفحه
     پس از رفرش «—» نشان می‌دهد در حالی که مقدار در دیتابیس هست. */
  {
    const profApi = read('app/api/users/profile/route.ts')
    t('پروفایل شبا را برمی‌گرداند', /bankIban: u\.bank_iban/.test(profApi))
    t('شبا در فهرستِ نوشتنی نیست',
      !/bank_iban/.test(profApi.split('const EDITABLE')[1]?.split(']')[0] ?? ''))
  }
  t('سرور شبا را هم می‌گیرد', /const ib = await cardToIban\(card\)/.test(route))
  t('نام بانک از شبا مشتق می‌شود', /iban \? bankOfIban\(iban\) : bankOfCard\(card\)/.test(route))
  t('نبودِ ستونِ اختیاری ثبت را نمی‌شکند', /مهاجرت ۰۳۸\/۰۳۹ اجرا نشده/.test(route))
  t('شکستِ استعلامِ شبا به کاربر گفته می‌شود', /ibanMessage/.test(route))
}

head('۱۰) پنل باشگاه — دسترسی سریع، دیالوگ، و بخشِ بانکی')
{
  {
    /* «گالری» به‌عنوانِ تبِ اصلی می‌ماند؛ فقط کارتِ دسترسی سریع رفت،
       پس ادعا باید محدود به همان بلوک باشد نه کلِ فایل. */
    const quick = dash.split('className="bh-quick"')[1]?.split('].map(')[0] ?? ''
    const labels = [...quick.matchAll(/label: '([^']+)'/g)].map(m => m[1])
    t('دسترسی سریع شش کارت دارد', labels.length, 6)
    t('کارتِ «گالری» از دسترسی سریع رفت', !labels.includes('گالری'))
  }
  t('دسترسی سریع سه‌ستونی است', /\.bh-quick \{[\s\S]{0,120}repeat\(3, 1fr\)/.test(css))

  /* پنجره‌ی خودِ مرورگر: انگلیسیِ چپ‌به‌راست با ظاهرِ سیستم‌عامل.
     نامش در کامنتِ توضیحی مانده، پس فقط فراخوانِ واقعی سنجیده می‌شود. */
  t('window.confirm دیگر صدا زده نمی‌شود', !/if \(!window\.confirm\(/.test(dash))
  /* پرسشِ تأییدِ درون‌صفحه‌ای دیگر لازم نیست: خودِ عملی که می‌پرسید
     («تغییر حساب») حذف شد، چون هر بار سه استعلامِ پولیِ تازه بود.
     جایش لینکِ تیکت آمد که هیچ چیزی را همان‌جا باطل نمی‌کند. */
  t('پرسشِ بازکردنِ قفل حذف شد', !/bankUnlockAsk/.test(dash))
  t('جایش لینکِ پشتیبانی آمد', /درخواست تغییر حساب/.test(dash))

  t('چهار فیلدِ بانکی به ترتیب',
    dash.indexOf('>شماره کارت</label>') < dash.indexOf('>شماره شبا</label>')
    && dash.indexOf('>شماره شبا</label>') < dash.indexOf('label="نام صاحب حساب"')
    && dash.indexOf('label="نام صاحب حساب"') < dash.indexOf('label="نام بانک"'))
  t('شبکه‌ی دوستونی جای سطرهای تمام‌عرض', /\.bh-bank-grid\s*\{/.test(css))
  t('شبا دیگر ورودی نیست', !/setClubInfo\(p => \(\{ \.\.\.p, iban: formatIban/.test(dash))
  t('نام حساب دیگر ورودی نیست', !/setClubInfo\(p => \(\{ \.\.\.p, bankCardOwner: v \}\)\)/.test(dash))
  /* نامش در کامنت مانده؛ خودِ دکمه باید رفته باشد */
  t('دکمه‌ی دومِ استعلام حذف شد', !/تأیید شبا بدون شماره کارت\s*\n\s*<\/button>/.test(dash))
  t('دکمه «ثبت کارت» نام گرفت', /'در حال استعلام…' : 'ثبت کارت'/.test(dash))
  t('«پیش‌نمایش کارت» حذف شد', !/پیش‌نمایش کارت/.test(dash))
  t('دکمه‌ی جداگانه‌ی ذخیره‌ی بانکی حذف شد', !/ذخیره اطلاعات بانکی/.test(dash))
}

/* ── گالریِ باشگاه: ۱۰ عکس، روی سرور، پس‌زمینه‌ی صفحه‌ی عمومی ──
   بخشِ رفتاریِ این‌ها پشتِ ورود است، پس این‌جا فقط چیزی سنجیده می‌شود
   که در مرورگر قابلِ اثبات نبود: اینکه عکس‌ها دیگر در localStorage
   نمی‌مانند (که هیچ بازدیدکننده‌ای نمی‌دیدشان) و سقف واقعاً اعمال است. */
{
  head('گالریِ باشگاه — تا ۱۰ عکس برای پس‌زمینه')
  /* کلِ گالری — state، هندلرها و JSX — به کامپوننتِ خودش منتقل شد.
     صفحه‌ی داشبورد دیگر هیچ‌کدامشان را نمی‌بیند. */
  const dash = read('components/dashboard/club/GalleryTab.tsx')
  const page = read('app/dashboard/club/page.tsx')
  const club = read('app/clubs/[id]/page.tsx')

  t('سقف ۱۰ عکس تعریف شده', /const MAX_CLUB_PHOTOS = 10/.test(dash))
  t('سقف هنگام آپلود اعمال می‌شود', /MAX_CLUB_PHOTOS - singlePhotos\.length/.test(dash))
  t('عکس‌ها روی سرور ذخیره می‌شوند',
    /api\.put\(`\/clubs\/\$\{club\.id\}`, \{ images:/.test(dash))
  /* base64 صفحه را سنگین می‌کرد و از سقفِ سطرِ دیتابیس هم رد می‌شد */
  t('آپلود به Storage می‌رود نه data-URL', /\/api\/upload/.test(dash))
  /* حالا به‌جای تکیه بر عکسِ لحظه‌ایِ فهرست، رکورد را تازه می‌گیرد —
     وگرنه پس از ذخیره و عوض‌کردنِ باشگاه، نسخه‌ی پیش از ذخیره برمی‌گشت. */
  t('عکس‌ها موقعِ باز شدن از سرور خوانده می‌شوند',
    /apiFetch\(`\/api\/clubs\/\$\{clubId\}`/.test(dash) && /c\?\.images/.test(dash))
  t('به کاربر گفته می‌شود پس‌زمینه می‌شوند', /پس‌زمینه‌ی صفحه‌ی عمومی/.test(dash))
  /* صفحه‌ی مادر فقط باشگاه و راهِ خبردادنِ لوگو را می‌دهد — نه بیست prop */
  t('صفحه فقط دو prop می‌دهد', /<GalleryTab club=\{selectedClub\}/.test(page))
  t('state گالری از صفحه رفته', !/const \[singlePhotos, setSinglePhotos\]/.test(page))
  t('همان images پس‌زمینه‌ی صفحه‌ی باشگاه است',
    /const images\s+= club\.images\?\.length \? club\.images/.test(club))
}

/* ── نشانِ پیش‌فرضِ باشگاه ── */
{
  head('نشانِ باشگاه')
  const logo = read('components/club/ClubLogo.tsx')
  const club = read('app/clubs/[id]/page.tsx')
  const list = read('app/clubs/page.tsx')
  const dash = read('app/dashboard/club/page.tsx')

  t('کامپوننتِ مشترک ساخته شد', /export default function ClubLogo/.test(logo))
  t('لوگوی آپلودشده اولویت دارد', /if \(src\) \{/.test(logo))
  /* idهای تکراری در فهرستِ باشگاه‌ها نامعتبرند.
     کامنت‌ها کنار گذاشته می‌شوند وگرنه خودِ توضیحِ همین قاعده
     باعثِ خطا می‌شد. */
  const logoCode = logo.replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}/g, '')
  t('بدونِ <defs> و idِ تکراری', !/<defs>/.test(logoCode) && !/\sid="/.test(logoCode))
  t('نشان با SVG است نه فونت', /<svg /.test(logo) && !/fontSize/.test(logo))

  t('صفحه‌ی باشگاه از آن استفاده می‌کند', /<ClubLogo src=\{club\.logo\}/.test(club))
  t('فهرستِ باشگاه‌ها هم', (list.match(/<ClubLogo src=\{club\.logo\}/g) ?? []).length === 2)
  /* پیش‌نمایشِ لوگو داخلِ تبِ گالری است، که کامپوننتِ خودش شد */
  t('پیش‌نمایشِ داشبورد هم',
    /<ClubLogo src=\{club\?\.logo\}/.test(read('components/dashboard/club/GalleryTab.tsx')))
  t('حرفِ اولِ نام دیگر جای لوگو نیست',
    !/club\.logo \? <img[\s\S]{0,220}club\.name\[0\]/.test(club + list))
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
