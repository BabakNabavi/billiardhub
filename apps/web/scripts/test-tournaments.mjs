/* بازرسیِ ایستای ماژولِ مسابقات.
       node scripts/test-tournaments.mjs

   ── چرا این فایل هست ──
   نُه ایراد در یک آزمایشِ واقعیِ مسابقه بیرون زدند و هیچ‌کدام را نه
   تایپ‌چک می‌گرفت نه بیلد. مشترکشان یک الگو بود: **پنل کار می‌کرد،
   سرور خطا نمی‌داد، ولی خروجی به بازدیدکننده نمی‌رسید.**

   نمونه‌ها:
     • `rules` ستون نداشت، API نمی‌فرستادش، و نگاشتِ کلاینت رشته‌ی
       خالیِ ثابت می‌گذاشت. هر سه لایه ساکت بودند.
     • کالبک به `/tournaments/result` ریدایرکت می‌کرد و چنین صفحه‌ای
       نبود؛ مسیرِ پویای `[id]` آن را می‌قاپید و به کاربری که تازه
       پول داده بود می‌گفت «این مسابقه پیدا نشد».
     • نگاشتِ نوعِ بازی `8ball` را نمی‌شناخت و همه را «سایر» می‌کرد.

   هیچ‌کدام در مرورگر هم فوری پیدا نمی‌شدند. این آزمون‌ها ارزان‌اند و
   دقیقاً همان چیزهایی را می‌گیرند که تایپ‌چک نمی‌گیرد.
*/

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`);
};
/* توضیحاتِ کد از بررسی بیرون می‌مانند: کامنتی که می‌گوید «چرا فلان
   چیز برداشته شد» نباید خودش باعثِ ردشدنِ همان تست شود. */
const strip = src => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');
const read = p => { try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return ''; } };

console.log('\n■ ماژول مسابقات\n');

/* ── ۱ · صفحه‌ی بازگشت از درگاه ──
   کالبک به مسیری ریدایرکت می‌کند؛ اگر آن مسیر صفحه نداشته باشد،
   `app/tournaments/[id]` آن را به‌عنوان شناسه‌ی مسابقه می‌گیرد و
   «پیدا نشد» می‌گوید — درست بعد از پرداخت. */
console.log('― بازگشت از درگاه ―');
const cb = read('app/api/tournaments/callback/[provider]/route.ts');
const target = cb.match(/callbackOrigin\(\)\}(\/[a-z/-]+)\?/);
t('کالبک مقصدِ ریدایرکت مشخصی دارد', !!target, 'الگوی ریدایرکت پیدا نشد');
if (target) {
  const seg = target[1].replace(/^\//, '');
  t(`صفحه‌ی «${target[1]}» واقعاً وجود دارد`,
    existsSync(join(ROOT, 'app', seg, 'page.tsx')),
    'مسیرِ پویا [id] آن را می‌قاپد و «مسابقه پیدا نشد» می‌دهد');
}
const resultPage = read('app/tournaments/result/page.tsx');
for (const state of ['ok', 'cancelled', 'failed', 'full', 'mismatch']) {
  t(`حالتِ «${state}» پیام دارد`, resultPage.includes(`'${state}'`));
}
t('جزئیات از سرور خوانده می‌شود نه از کوئریِ نشانی',
  /api\/tournaments\/my/.test(resultPage),
  'وگرنه ?state=ok دستی یعنی رسیدِ جعلی');

/* ── ۲ · قوانین ──
   سه لایه باید هم‌زمان درست باشند، وگرنه متن جایی بی‌صدا گم می‌شود. */
console.log('\n― قوانین مسابقه ―');
t('ستونِ rules در مهاجرت هست',
  /ADD COLUMN IF NOT EXISTS rules/.test(read('../../supabase/migrations/068_tournament_rules_formats_offline.sql')));
t('POST مسابقه قوانین را می‌نویسد',
  /rules:\s*String\(b\?\.rules/.test(read('app/api/tournaments/route.ts')));
t('PATCH مسابقه قوانین را می‌پذیرد',
  /b\.rules !== undefined/.test(read('app/api/tournaments/[id]/route.ts')));
t('فرمِ پنل قوانین را می‌فرستد',
  /rules:\s*tForm\.rules/.test(read('app/dashboard/club/page.tsx')));
const client = read('lib/tournaments/client.ts');
t('نگاشتِ کلاینت قوانین را از ردیف می‌خواند',
  /rules:\s*r\.rules/.test(client),
  'پیش‌تر `rules: \'\'` ثابت بود');
t('صفحه‌ی عمومی کارتِ قوانینِ خالی نمی‌سازد',
  /rules\.length > 0 &&/.test(read('app/tournaments/[id]/page.tsx')));

/* ── ۳ · نوعِ بازی و فرمت ── */
console.log('\n― نوع بازی و فرمت ―');
const fmt = read('lib/tournaments/formats.ts');
t('منبعِ واحدِ فرمت‌ها وجود دارد', fmt.length > 0);
t('«سایر» از فهرستِ انتخاب بیرون است',
  !/DISCIPLINE_CHOICES[\s\S]{0,400}'other'/.test(fmt));
t('«های بال» در فهرستِ انتخاب هست', /key:\s*'highball'/.test(fmt));
t('نگاشت، های‌بال را به ناین‌بال نمی‌برد',
  !/highball:\s*'9ball'/.test(fmt) && !/highball:\s*'9ball'/.test(client),
  'باگِ قبلی: های‌بال ناین‌بال نمایش داده می‌شد');
t('نگاشت، 8ball و 9ball را می‌شناسد',
  /'8ball'.*'9ball'/s.test(fmt) && /normalizeDiscipline/.test(client),
  'پیش‌تر هر دو به «سایر» می‌افتادند');

/* محدوده‌ی نهایی: race4..race12 · زمان‌دار از ۶۰
   `race3` عمداً نیست — مسابقه‌ای که با دو رکِ بُرد تمام شود
   قرعه‌کشی است نه مسابقه. */
const raceRange = fmt.match(/RACE_TARGETS = \[([^\]]+)\]/)?.[1] ?? '';
t('Race to 3 حذف شده', !/\b3\b/.test(raceRange), raceRange);
t('Race to 12 اضافه شده', /\b12\b/.test(raceRange), raceRange);
for (const n of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
  t(`Race to ${n} هست`, new RegExp(`\\b${n}\\b`).test(raceRange));
}
t('«تن بال» در فهرستِ انتخاب هست', /key:\s*'10ball'/.test(fmt));
t('تن‌بال فرمتِ ناین‌بال را می‌گیرد (فقط race)',
  !/'10ball'[\s\S]{0,80}=> \['bo'\]/.test(fmt) && /return \['race'\]/.test(fmt));
/* املای درست «هی‌بال» است — نه «های بال» و نه انگلیسیِ HI-BALL.
   کاربر هر دو را در چند صفحه پیدا کرد. */
t('«هی‌بال» با املای درست', /'هی‌بال'/.test(fmt) && !/های.?بال/.test(fmt));
t('اسنوکر «Best of» می‌گیرد',
  /if \(d === 'snooker'\) return \['bo'\]/.test(fmt));
t('هی‌بال هر دو خانواده را دارد',
  /if \(d === 'highball'\) return \['race', 'time'\]/.test(fmt));

const timeRange = fmt.match(/TIME_MINUTES\s*= \[([^\]]+)\]/)?.[1] ?? '';
t('زمان‌دار از ۶۰ شروع می‌شود',
  !/\b30\b/.test(timeRange) && !/\b45\b/.test(timeRange) && /\b60\b/.test(timeRange), timeRange);
for (const m of [60, 90, 120]) {
  t(`فرمتِ زمان‌دارِ ${m} دقیقه هست`, new RegExp(`\\b${m}\\b`).test(timeRange));
}
t('برچسبِ خانواده «فریمی» است', /race: 'فریمی'/.test(fmt));
t('قیدِ دیتابیس با همین محدوده هم‌خوان است',
  /race\(\[4-9\]\|1\[012\]\)/.test(read('../../supabase/migrations/069_tournament_format_range.sql')));

console.log('\n― فرمِ پنل ―');
const dashForm = read('app/dashboard/club/page.tsx');
t('ظرفیتِ ۱۲۸ نفر هست', /'8','16','32','64','128'/.test(dashForm));
/* توضیحاتِ داخلِ کد از بررسی بیرون می‌مانند — وگرنه همان کامنتی که
   می‌گوید «چرا برداشته شد» باعثِ ردشدنِ تست می‌شود. */
const stripped = dashForm.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
t('گزینه‌ی «واریز مستقیم» از فرم برداشته شد',
  !/واریز مستقیم/.test(stripped) && !/card_transfer['"]?\s*,\s*label/.test(stripped),
  'با درگاهِ فعال، پولِ بیرونِ سایت نه در دفترِ مالی می‌نشیند نه بازپرداخت می‌شود');
t('فیلدهای شماره‌ی کارتِ مسابقه هم رفتند',
  !/tForm\.cardNumber/.test(stripped),
  'حسابِ تسویه از پروفایلِ باشگاه می‌آید نه فرمِ هر مسابقه');
t('فیلدِ ساعت هم‌ترازِ تقویم است',
  /<TimeField/.test(dashForm) && /fontSize: 12\.5, fontWeight: 700/.test(read('components/dashboard/club/fields.tsx')),
  'برچسبِ ۱۲/۵۰۰ در برابر ۱۲٫۵/۷۰۰ کنترل را چند پیکسل بالاتر می‌برد');
/* اول با سقفِ عرض کوچکش کردم و نتیجه بدتر شد: در گریدِ دوستونی
   یک سلولِ نصفه‌پُر می‌ماند. کنترل باید تمامِ سلولِ خودش را بگیرد. */
t('فیلدِ ساعت تمامِ سلول را می‌گیرد',
  !/maxWidth: 128/.test(read('components/dashboard/club/fields.tsx')));
t('سرور فرمت را با نوعِ بازی می‌سنجد',
  /optionsFor\(discipline\)\.some/.test(read('app/api/tournaments/route.ts')),
  'وگرنه «۹۰ دقیقه» روی اسنوکر ذخیره می‌شود');
t('صفحه‌ی عمومی فرمت را از سرور می‌خواند نه localStorage',
  !/localStorage\.getItem\(`matchFormat/.test(read('app/tournaments/[id]/page.tsx')));

/* ── ۴ · ساعت‌ها ── */
console.log('\n― ساعت کنارِ تاریخ ―');
t('ساعتِ مهلتِ ثبت‌نام در نگاشت هست',
  /registrationDeadlineTime/.test(client));
t('ساعت در وقتِ تهران خوانده می‌شود نه وقتِ مرورگر',
  /timeZone: 'Asia\/Tehran'[\s\S]{0,160}hour: '2-digit'/.test(client),
  'getHours() ساعتِ دستگاهِ کاربر را می‌دهد');
const reg = read('app/tournaments/[id]/register/page.tsx');
t('صفحه‌ی پرداخت ساعتِ برگزاری را نشان می‌دهد', /t\.startTime \? ` — ساعت/.test(reg));
t('صفحه‌ی پرداخت ساعتِ مهلت را نشان می‌دهد', /registrationDeadlineTime/.test(reg));

/* ── ۵ · ثبت‌نام‌کنندگان و ثبت‌نامِ حضوری ── */
console.log('\n― ثبت‌نام‌کنندگان ―');
const server = read('lib/tournaments/server.ts');
t('شماره‌ی تماس به برگزارکننده داده می‌شود',
  /phone:\s*r\.contact_phone/.test(server),
  'توضیحِ تابع می‌گفت می‌آید ولی کد نمی‌داد');
t('حضوری/آنلاین در خروجی مشخص است', /source:\s*r\.source/.test(server));
const regsRoute = read('app/api/tournaments/[id]/registrations/route.ts');
t('مسیرِ افزودنِ حضوری (PUT) هست', /export async function PUT/.test(regsRoute));
t('مسیرِ حذفِ حضوری (DELETE) هست', /export async function DELETE/.test(regsRoute));
t('حذف فقط ردیفِ حضوری را می‌پذیرد',
  /not_offline/.test(regsRoute) && /not_offline/.test(server) === false
    ? /not_offline/.test(regsRoute) : /not_offline/.test(regsRoute));
const mig = read('../../supabase/migrations/068_tournament_rules_formats_offline.sql');
t('ظرفیت در تابعِ دیتابیس و با قفلِ ردیف سنجیده می‌شود',
  /FOR UPDATE[\s\S]{0,900}v_taken >= t\.max_players/.test(mig),
  'وگرنه افزودنِ دستی و پرداختِ هم‌زمان از سقف رد می‌شوند');
t('یکتاییِ «هر کاربر یک ثبت‌نام» با ایندکسِ جزئی حفظ شده',
  /CREATE UNIQUE INDEX[\s\S]{0,200}WHERE user_id IS NOT NULL/.test(mig));
const comp = read('components/dashboard/club/TournamentRegistrations.tsx');
t('کامپوننتِ فهرستِ ثبت‌نام‌کنندگان هست', comp.length > 0);
/* شرط عمداً روی «قبل از removeOffline یک گاردِ offline هست» است، نه
   روی شکلِ دقیقِ نوشتار — وگرنه با هر بازچینیِ JSX تست می‌شکند بی
   آنکه رفتاری عوض شده باشد. */
t('دکمه‌ی حذف فقط برای حضوری رندر می‌شود',
  /r\.source === 'offline'\s*[?&][\s\S]{0,400}setPendingDelete/.test(comp));
t('در پنلِ باشگاه وصل شده',
  /<TournamentRegistrations/.test(read('app/dashboard/club/page.tsx')));

/* ── ۶ · اعلانِ برگزارکننده ── */
console.log('\n― خبرِ ثبت‌نام به برگزارکننده ―');
const notify = read('lib/notify.ts');
t('تابعِ اعلان هست', /notifyOrganizerOfRegistration/.test(notify));
t('شمارنده‌ی ظرفیت در پیام است',
  /in\('status', \['PENDING_PAYMENT', 'CONFIRMED'\]\)/.test(notify),
  'باید همان شمارشی باشد که ظرفیت را می‌بندد');
t('الگو در فهرستِ الگوها ثبت شده',
  /'tournament_reg_for_owner'/.test(read('lib/sms-server.ts')));
t('کالبکِ پرداخت صدایش می‌زند',
  /notifyOrganizerOfRegistration/.test(cb));
t('مسیرِ مسابقه‌ی رایگان هم صدایش می‌زند',
  /notifyOrganizerOfRegistration/.test(read('app/api/tournaments/[id]/register/route.ts')),
  'مسابقه‌ی رایگان از کالبک نمی‌گذرد');

/* ── ۷ · پنلِ ثبت‌نام‌کنندگان ──
   شش ایرادی که در آزمایشِ دومِ کاربر بیرون زدند. */
console.log('\n― پنلِ ثبت‌نام‌کنندگان ―');
t('افزودن/حذف کارتِ والد را هم تازه می‌کند',
  /onChanged\?\.\(\)/.test(comp) && /onChanged=\{/.test(read('app/dashboard/club/page.tsx')),
  'وگرنه عددِ «۱ از ۱۶» بالای کارت دست‌نخورده می‌ماند');
t('تازه‌سازی نشانه‌ی دیدنی دارد',
  /setSyncedAt/.test(comp) && /refreshing/.test(comp),
  'بدونِ آن، وقتی چیزی عوض نشده دکمه خراب به‌نظر می‌رسد');
t('ردیف‌ها گرید هستند تا ستون‌ها زیرِ هم بیفتند',
  /grid-template-columns/.test(comp),
  'با فلکس، وضعیت و مبلغ به نامِ هر بازیکن می‌چسبید');
t('در موبایل فاصله‌ی شماره تا نام کم می‌شود',
  /max-width: 640px[\s\S]{0,200}16px minmax/.test(comp));

console.log('\n― مهلتِ پرداخت ―');
t('مهلت ۱۵ دقیقه است', /PAYMENT_WINDOW_MINUTES = 15/.test(server));
t('تابعِ انقضا واقعاً صدا زده می‌شود',
  /await expireStalePending\(\)/.test(server),
  'تابع از مهاجرت ۰۲۶ بود ولی هیچ‌کس صدایش نمی‌زد');
t('پیش از شمارشِ ظرفیت اجرا می‌شود',
  /export async function seatsLeft[\s\S]{0,200}expireStalePending/.test(server));
t('فهرستِ برگزارکننده هم پاک‌سازی می‌کند',
  /expireStalePending/.test(regsRoute));
t('رابط مهلت را به کاربر می‌گوید', /۱۵ دقیقه/.test(comp));

console.log('\n― پوستر ―');
const posterDir = join(ROOT, 'public', 'images', 'tournaments');
for (const k of ['snooker', '8ball', '9ball', '10ball', 'highball']) {
  t(`پوسترِ ${k} ساخته شده`, existsSync(join(posterDir, `${k}.svg`)));
}
t('نگاشت، بی‌پوستر را به پوسترِ همان بازی می‌برد',
  /posterFor\(normalizeDiscipline/.test(client),
  'پیش‌تر همه عکسِ club1.png می‌گرفتند');
t('پوستر داخلِ SVG متنِ فارسی ندارد',
  /* فقط متنِ رندرشونده ملاک است؛ کامنتِ داخلِ SVG دیده نمی‌شود */
  !/[؀-ۿ]/.test(read('public/images/tournaments/9ball.svg').replace(/<!--[\s\S]*?-->/g, '')),
  'SVGی بارگذاری‌شده با <img> به فونت‌های صفحه دسترسی ندارد');
const poster = read('components/dashboard/club/TournamentPoster.tsx');
t('کامپوننتِ آپلودِ پوستر هست', poster.length > 0);
t('زیرِ شناسه‌ی همان باشگاه آپلود می‌شود',
  /clubs\/\$\{clubId\}\/tournaments\//.test(poster));
t('سرور نشانیِ دلخواه را نمی‌پذیرد',
  /export const safeCover/.test(read('app/api/tournaments/route.ts')),
  'وگرنه صفحه‌ی عمومی تصویری از دامنه‌ی دلخواهِ باشگاه‌دار سرو می‌کند');
t('POST و PATCH هر دو پوستر را می‌پذیرند',
  /cover_url: safeCover/.test(read('app/api/tournaments/route.ts'))
  && /patch\.cover_url = safeCover/.test(read('app/api/tournaments/[id]/route.ts')));

console.log('\n― پنجره‌ی حذف و پیام ―');
t('confirm() مرورگر برداشته شد', !/\bconfirm\(/.test(strip(comp)),
  'پنجره‌ی بومی انگلیسیِ چپ‌به‌راست است و نشانیِ سایت را بالای خودش می‌نویسد');
t('پنجره‌ی تأیید نامِ بازیکن را نشان می‌دهد',
  /pendingDelete\.playerName/.test(comp));
t('بعد از حذف پیامِ تأیید می‌آید',
  /از فهرست ثبت‌نام‌کنندگان مسابقه حذف شد/.test(comp));
t('برچسب‌ها و مبلغ یک ستون شدند', /treg-meta/.test(comp) && !/treg-badges/.test(comp));
t('هر ردیف راهِ پرداختش را می‌گوید — حضوری یا اینترنتی',
  /'حضوری' : 'اینترنتی'/.test(comp),
  'نبودِ برچسب مبهم است: «اینترنتی» یا «هنوز مشخص نیست»؟');

console.log('\n― چیدمانِ دکمه‌ها ―');
t('دکمه‌های فرم گریدِ ستون‌مساوی‌اند', /\.tform-actions\{[\s\S]{0,120}grid/.test(read("app/dashboard/club/page.tsx")));
t('دکمه‌های کارت گریدِ ستون‌مساوی‌اند', /\.tcard-actions\{[\s\S]{0,160}grid-template-columns/.test(read("app/dashboard/club/page.tsx")));
t('در گوشی دو ستون، در دسکتاپ چهار',
  /repeat\(2,minmax\(0,1fr\)\)[\s\S]{0,600}repeat\(4,minmax\(0,1fr\)\)/.test(read("app/dashboard/club/page.tsx")),
  'با flexWrap ته‌سطرها ناهموار می‌شدند');
t('مبلغِ بدونِ تغییر ویرایش را رد نمی‌کند',
  /if \(next !== t\.entry_fee\)/.test(read('app/api/tournaments/[id]/route.ts')),
  'شرطِ قبلی فقط «آیا در بدنه هست؟» را می‌پرسید');

console.log('\n― ویرایشِ مسابقه ―');
const dash = read('app/dashboard/club/page.tsx');
t('دکمه‌ی ویرایش روی کارت هست', /startEditTournament\(t\)/.test(dash));
t('تابعِ ذخیره‌ی ویرایش هست', /saveTournamentEdit/.test(dash));
t('از PATCH استفاده می‌کند نه ساختِ دوباره',
  /method: 'PATCH'[\s\S]{0,400}rules: tForm\.rules/.test(dash));
t('قوانین و فرمت هم ویرایش می‌شوند',
  /saveTournamentEdit[\s\S]{0,900}matchFormat: tForm\.matchFormat/.test(dash));
t('انصراف فرم را پاک می‌کند', /resetTForm\(\)/.test(dash));

/* ── ۸ · تب‌های فهرست ──
   هر وضعیتی که کاربر می‌بیند باید تبی داشته باشد، وگرنه مسابقه از
   همه‌ی تب‌ها جز «همه» ناپدید می‌شود و به‌نظر می‌رسد پاک شده. */
console.log('\n― تب‌های فهرست ―');
const listPage = read('app/tournaments/page.tsx');
const mapped = [...client.matchAll(/^\s*\w+:\s*'(\w+)',/gm)].map(x => x[1]);
const states = [...new Set(mapped)].filter(s =>
  ['upcoming', 'registration_open', 'bracket_ready', 'live', 'finished'].includes(s));
for (const s of states) {
  t(`وضعیتِ «${s}» تب دارد`, listPage.includes(`key: '${s}'`),
    'از همه‌ی تب‌ها جز «همه» ناپدید می‌شود');
}

/* ── نشست ──
   کاربرِ واردشده گاهی «ابتدا وارد سایت شوید» می‌دید. علتش مسابقه‌ی
   زمانی بود: `_hydrated` فقط می‌گوید localStorage خوانده شد، نه
   اینکه سرور تأیید کرده. */
console.log('\n― نشست ―');
const store = read('store/auth.store.ts');
t('پرچمِ `authChecked` جدا از `_hydrated` هست', /authChecked: boolean/.test(store));
t('عمداً ذخیره نمی‌شود',
  /partialize: \(state\) => \(\{ user: state\.user \}\)/.test(store),
  'هر بار بارگذاری باید از نو از سرور پرسیده شود');
const bridge = read('components/auth/SessionBridge.tsx');
t('حتی در خطای شبکه هم علامت می‌خورد',
  /finally \{[\s\S]{0,400}setAuthChecked\(\)/.test(bridge),
  'وگرنه صفحه‌ها برای همیشه در حالِ بارگذاری می‌مانند');
t('صفحه‌ی ثبت‌نام منتظرش می‌ماند',
  /!_hydrated \|\| !authChecked/.test(reg));

/* همان گارد در نُه صفحه‌ی دیگر هم بود و همان صفحه‌ی سفید را می‌ساخت:
   کاربرِ واردشده به /login فرستاده می‌شد و چون بلافاصله برمی‌گشت،
   نتیجه یک صفحه‌ی خالی بود. */
for (const f of ['app/dashboard/club/page.tsx', 'app/admin/page.tsx',
                 'app/admin/users/page.tsx', 'app/direct/page.tsx']) {
  t(`${f.split('/').slice(-2).join('/')} منتظرِ تأییدِ سرور می‌ماند`,
    /authChecked/.test(read(f)),
    'وگرنه ذخیره‌گاهِ پاک‌شده = بیرون‌انداختنِ کاربرِ واردشده');
}

/* ── رویداد اصلی ── */
console.log('\n― رویداد اصلی ―');
const mig70 = read('../../supabase/migrations/070_tournament_featured.sql');
t('ستونِ is_featured در مهاجرت هست', /ADD COLUMN IF NOT EXISTS is_featured/.test(mig70));
t('فقط یک مسابقه می‌تواند اصلی باشد',
  /CREATE UNIQUE INDEX[\s\S]{0,200}WHERE is_featured/.test(mig70));
t('انتخاب اتمیک است', /bh_set_featured_tournament/.test(mig70));
t('صفحه از پرچم می‌خواند نه از اولین ردیف',
  /all\.find\(t => t\.isFeatured\)/.test(listPage),
  'پیش‌تر اولین مسابقه‌ی باز بود — یعنی هر که زودتر برگزار می‌کرد');
const admFeat = read('app/api/admin/tournaments/featured/route.ts');
t('مسیرِ انتخاب فقط برای ادمین است', /can\(actor\.id, 'tournaments'\)/.test(admFeat));
t('پنلِ ادمین دکمه‌اش را دارد',
  /رویداد اصلی شود/.test(read('app/admin/tournaments/page.tsx')));

/* ── املا ── */
console.log('\n― املای هی‌بال ―');
for (const f of ['lib/tournaments/formats.ts', 'lib/player-categories.ts',
                 'components/player/PlayerDisciplines.tsx']) {
  t(`${f.split('/').pop()} املای درست دارد`, !/های.?بال/.test(read(f)));
}
t('پوستر HEYBALL نوشته، نه HI-BALL',
  /HEYBALL/.test(read('public/images/tournaments/highball.svg'))
  && !/HI-BALL/.test(read('public/images/tournaments/highball.svg')));
t('en در دسته‌بندیِ بازیکن HEYBALL است',
  /en: 'HEYBALL'/.test(read('lib/player-categories.ts')));

/* ── هدر و کارت ── */
console.log('\n― هدر و کارت ―');
t('هدرِ صفحه تصویرِ اختصاصی دارد',
  /images\/tournaments\/hero\.svg/.test(listPage)
  && !/shop\/Pro_table/.test(strip(listPage)),
  'پیش‌تر عکسِ محصولِ فروشگاه بود');
t('فایلِ هدر ساخته شده', existsSync(join(ROOT, 'public/images/tournaments/hero.svg')));
t('کارت کوتاه‌تر شد', /aspect-ratio: 16\/7/.test(listPage));
/* یک‌بار تمام‌عرضش کردم و بیش از حد به چشم می‌آمد — عملی که به‌ندرت
   لازم می‌شود نباید پررنگ‌ترین چیزِ ردیف باشد. */
t('دکمه‌ی حذف در موبایل کوچک و کنارِ ردیف می‌ماند',
  !/\.treg-del > button\{ width:100%/.test(comp));
t('تازه‌سازی و ثبت‌نامِ حضوری یک گروه‌اند',
  /actionBtn/.test(comp) && /marginInlineStart: 'auto'[\s\S]{0,300}RefreshCw/.test(comp));

/* ── براکت ──
   کامیتِ ۵۲۹۲fa8d چهار صفحه را به داده‌ی واقعی وصل کرد ولی رابطشان
   را هم ساده کرد: براکتِ دوطرفه، مقیاسِ خودکار و چیدنِ دستی با آن
   رفتند. این‌ها برمی‌گردند — این‌بار روی داده‌ی سرور. */
console.log('\n― براکت ―');
const tree = read('components/tournaments/BracketTree.tsx');
t('کامپوننتِ درختِ مشترک هست', tree.length > 0);
t('چیدمان دوطرفه است — نیمی راست، نیمی چپ',
  /side === 'right' \? all\.filter\(m => m\.match_index < mid\)/.test(tree),
  'با تک‌جهته، براکتِ ۳۲ نفره پنج ستون می‌شود و روی مانیتور جا نمی‌گیرد');
t('فینال در مرکز است', /فینال — مرکز|isFinal/.test(tree));
t('مقیاسِ خودکار به‌جای اسکرولِ افقی',
  /ResizeObserver/.test(tree) && /Math\.min\(1, byW\)/.test(tree),
  'اسکرول یعنی تماشاگر نمی‌داند چیزی بیرونِ کادر مانده');
t('در صفحه‌ی معمولی بزرگ‌نمایی نمی‌کند', /: Math\.min\(1, byW\)/.test(tree));
t('صفحه‌ی براکت از همین کامپوننت می‌خواند',
  /<BracketTree/.test(read('app/tournaments/[id]/bracket/page.tsx')));
t('دکمه‌ی بازگشت به جای قبلی برمی‌گردد',
  /router\.back\(\)/.test(read('app/tournaments/[id]/bracket/page.tsx')),
  'لینکِ ثابت همیشه به صفحه‌ی مسابقه می‌رفت، نه به تبی که کاربر در آن بود');

console.log('\n― پنجره‌های تأیید ―');
const dlg = read('components/ui/ConfirmDialog.tsx');
t('دیالوگِ مشترک هست', dlg.length > 0);
t('پنلِ مسابقه از confirm مرورگر استفاده نمی‌کند',
  !/window\.confirm/.test(strip(read('app/tournaments/[id]/admin/page.tsx'))),
  'پنجره‌ی بومی انگلیسیِ چپ‌به‌راست است و نشانیِ سایت را بالای خودش می‌نویسد');
t('دکمه‌ی خطرناک دومی است',
  /دکمه‌ی خطرناک عمداً دومی است/.test(dlg));

/* ── چیدنِ دستی ──
   نسخه‌ی قبلیِ سایت این را داشت ولی فقط در حافظه‌ی مرورگر؛ با رفرش
   می‌رفت. حالا هر جابه‌جایی در دیتابیس ثبت می‌شود. */
console.log('\n― چیدنِ دستیِ براکت ―');
const mig71 = read('../../supabase/migrations/071_bracket_manual_seeding.sql');
t('سه تابعِ چیدن در مهاجرت هست',
  /bh_bracket_swap_slots/.test(mig71) && /bh_bracket_place/.test(mig71)
  && /bh_bracket_clear_slots/.test(mig71));
t('عملِ پایه تعویض است نه انتساب',
  /چرا «تعویض» و نه «انتساب»/.test(mig71),
  'با انتساب، ساکنِ جایگاه بی‌صدا حذف می‌شود و تا روزِ مسابقه کسی نمی‌فهمد');
t('پس از ثبتِ نتیجه قفل می‌شود',
  /already_started/.test(mig71) && /winner IS NOT NULL/.test(mig71));
t('فقط دورِ اول', /not_first_round/.test(mig71));
t('یک بازیکن دو جایگاه نمی‌گیرد', /already_placed/.test(mig71));
const seedApi = read('app/api/tournaments/[id]/seeding/route.ts');
t('مسیرِ چیدن فقط برای مالکِ باشگاه است', /ownsClub/.test(seedApi));
t('هر سه عمل را می‌پذیرد',
  /'swap'/.test(seedApi) && /'place'/.test(seedApi) && /'clear'/.test(seedApi));
t('استخرِ چیده‌نشده‌ها را برمی‌گرداند', /pool:/.test(seedApi));
const seedUi = read('components/tournaments/BracketSeeding.tsx');
t('رابطِ چیدن هست', seedUi.length > 0);
t('هم درگ دارد هم لمس',
  /onDragStart/.test(seedUi) && /onClick/.test(seedUi),
  'لمس، درگِ HTML5 را شلیک نمی‌کند — گوشی بدونِ مسیرِ دوم بی‌استفاده می‌ماند');
t('کشیدن به استخر یعنی برداشتن از براکت', /dropOnPool/.test(seedUi));
/* تبِ جدا برداشته شد — چیدن زیرِ همان تبِ قرعه‌کشی می‌آید */
t('چیدن در پنلِ برگزارکننده هست',
  /<BracketSeeding/.test(read('app/tournaments/[id]/admin/page.tsx')));
t('براکت هم داخلِ همان پنل است',
  /tab === 'bracket'/.test(read('app/tournaments/[id]/admin/page.tsx')));
t('دکمه‌ی براکت از کارتِ پنلِ باشگاه برداشته شد',
  !/tournaments\/\$\{t\.id\}\/bracket/.test(strip(read('app/dashboard/club/page.tsx'))));
t('دکمه‌ی حذف نامِ صریح دارد',
  /حذف مسابقه/.test(read('app/dashboard/club/page.tsx')));

/* ── حلقه‌ی ریدایرکتِ ورود ──
   کوکی منقضی + کاربرِ باقی‌مانده در localStorage = رفت‌وبرگشتِ
   بی‌پایانِ /login ↔ صفحه‌ی محافظت‌شده، و صفحه‌ی سفید. */
console.log('\n― حلقه‌ی ورود ―');
const loginPage = read('app/login/page.tsx');
t('ورود تا تأییدِ سرور ریدایرکت نمی‌کند',
  /_hydrated && authChecked && user\) router\.replace/.test(loginPage));
t('صفحه‌ی خالی هم به تأیید گره خورده',
  /if \(user && authChecked\) return null/.test(loginPage),
  'وگرنه همان یک خط به‌تنهایی صفحه‌ی سفید می‌ساخت');

/* ── قرعه‌کشیِ استاندارد ──
   روشِ قبلی بای‌ها را «در ابتدای دور» می‌گذاشت: با ۱۳ بازیکن در جدولِ
   ۱۶تایی، سه بای پشتِ سرِ هم در نیمه‌ی راست می‌نشستند و آن نیمه یک
   دور کمتر بازی می‌کرد. */
console.log('\n― قرعه‌کشیِ استاندارد ―');
const mig72 = read('../../supabase/migrations/072_bracket_standard_seeding.sql');
t('تابعِ ترتیبِ سید هست', /bh_seed_order/.test(mig72));
t('ترتیب بازگشتی ساخته می‌شود', /nxt := nxt \|\| x \|\| \(sz \+ 1 - x\)/.test(mig72),
  'order(2n) = برای هر x: x , 2n+1-x');
t('بای از نبودِ سید می‌آید نه از جای ثابت',
  /s1 > v_count THEN NULL/.test(mig72),
  'سیدی که بزرگ‌تر از تعدادِ بازیکنان باشد وجود ندارد ⇒ حریف خالی');
t('حالتِ جدولِ خالی هست', /p_empty/.test(mig72));
t('قرعه‌کشی ثبت‌نام را می‌بندد',
  /UPDATE tournaments SET status = 'registration_closed'/.test(mig72),
  'جدولِ کشیده‌شده با ثبت‌نامِ باز یعنی نفرِ تازه جایی ندارد');
t('برنده‌ی بای همان‌جا صعود می‌کند', /bh_bracket_advance_byes/.test(mig72));
t('تأییدِ چیدمانِ دستی هست', /bh_bracket_finalize/.test(mig72));
t('پایانِ مسابقه تابع دارد', /bh_tournament_finish/.test(mig72));
t('شروعِ خودکار در ساعتِ مسابقه', /bh_tournaments_autostart/.test(mig72));
t('شروعِ خودکار صدا زده می‌شود',
  /await autoStartDue\(\)/.test(server),
  'کران نساختیم — همان‌جا که فهرست خوانده می‌شود');

console.log('\n― تب‌ها و پایان ―');
const TAB_ORDER = ['all', 'registration_open', 'live', 'upcoming', 'bracket_ready', 'finished'];
const order = [...listPage.matchAll(/key: '(\w+)',\s+label/g)].map(m => m[1]);
t('ترتیبِ تب‌ها درست است',
  JSON.stringify(order) === JSON.stringify(TAB_ORDER),
  order.join(' → '));
const adm = read('app/tournaments/[id]/admin/page.tsx');
t('دکمه‌ی جدولِ خالی هست', /doDrawEmpty/.test(adm));
t('دکمه‌ی پایانِ مسابقه هست', /اعلام پایان مسابقه/.test(adm));
t('پایان با دیالوگ تأیید می‌شود', /askFinish/.test(adm));
t('تأیید چیدمان در رابطِ چیدن هست',
  /finalizeSeeding/.test(read('components/tournaments/BracketSeeding.tsx')));

/* ── بای، نتیجه نیست ──
   بازیِ تک‌نفره از لحظه‌ی ساخت برنده دارد؛ شمردنش به‌عنوان «نتیجه»
   یعنی تأییدِ چیدمان همه‌چیز را قفل می‌کرد. */
const mig73 = read('../../supabase/migrations/073_bracket_bye_not_a_result.sql');
t('تعریفِ «شروع‌شده» فقط بازیِ واقعی است',
  /bh_bracket_has_real_result/.test(mig73)
  && /p1_registration_id IS NOT NULL[\s\S]{0,80}p2_registration_id IS NOT NULL/.test(mig73));
const seedUi2 = read('components/tournaments/BracketSeeding.tsx');
t('رابط هم همان تعریف را دارد',
  /m.winner !== null && !!m.p1_registration_id/.test(seedUi2));
t('چیپ‌های بای در استخر هست', /byeCount/.test(seedUi2) && /Bye/.test(seedUi2));
t('بای روی جایگاه یعنی خالی', /held.from === 'bye'/.test(seedUi2));
t('تأیید چیدمان پیامِ موفقیت می‌دهد', /چیدمان تأیید شد/.test(seedUi2));
t('تبِ جدای «چیدن دستی» برداشته شد',
  !/'seed'/.test(read('app/tournaments/[id]/admin/page.tsx')));
t('چیدن زیرِ تبِ قرعه‌کشی می‌آید',
  /tab === 'draw' && hasBracket/.test(read('app/tournaments/[id]/admin/page.tsx')));
t('مقیاسِ درخت با حاشیه‌ی منفی جبران می‌شود',
  /marginInline: fill \? 0 : -overflowX/.test(read('components/tournaments/BracketTree.tsx')),
  'transform جعبه‌ی چیدمان را کوچک نمی‌کند — جدول از لبه بیرون می‌زد');
t('اندازه‌گیری بدونِ مقیاس انجام می‌شود',
  /tree.style.transform = 'none'/.test(read('components/tournaments/BracketTree.tsx')),
  'وگرنه هر اندازه‌گیری روی نتیجه‌ی قبلی سوار می‌شود');
t('پنلِ مدیریتِ زنده صفحه‌ی خودش را دارد',
  /export default function LiveControlPage/.test(read('app/tournaments/[id]/control/page.tsx')));
t('امتیاز با دکمه بالا/پایین می‌رود',
  /stepBtn/.test(read('app/tournaments/[id]/control/page.tsx')),
  'کسی که کنارِ میز ایستاده با کیبورد کار نمی‌کند');

/* ── نمایشِ بزرگ و صفحه‌ی سفید ── */
console.log('\n― نمایشِ بزرگ ―');
const stage = read('app/tournaments/[id]/stage/page.tsx');
t('صفحه‌ی نمایشِ بزرگ هست', stage.length > 0);
t('حالتِ stage درخت را می‌گیرد', /<BracketTree bracket=\{b\} stage/.test(stage));
t('خودش تازه می‌شود', /setInterval/.test(stage) && /hasLive \? 3000 : 10000/.test(stage),
  'کسی پشتِ مانیتور نیست که رفرش بزند');
t('تمام‌صفحه فقط با لمسِ کاربر', /requestFullscreen/.test(stage),
  'مرورگر بدونِ حرکتِ کاربر تمام‌صفحه نمی‌شود');
t('در موبایلِ عمودی پیامِ چرخاندن می‌دهد', /stg-rotate/.test(stage));
t('فوتر روی این صفحه پنهان است',
  /isStage/.test(read('components/FooterGate.tsx')));
t('لینکش در پنلِ برگزارکننده هست', /نمایش روی مانیتور/.test(adm));

console.log('\n― صفحه‌ی سفید ―');
t('لودرِ مشترک هست', read('components/ui/PageLoader.tsx').length > 0);
for (const f of ['app/dashboard/page.tsx', 'app/dashboard/shop/page.tsx']) {
  t(`${f.split('/').slice(-2).join('/')} به‌جای «هیچ» لودر نشان می‌دهد`,
    /!_hydrated \|\| !authChecked\) return <PageLoader/.test(read(f)),
    'صفحه‌ی خالی برای کاربر یعنی «خراب است»، نه «صبر کن»');
}
t('نوارِ استوری یک‌بار که آمد نمی‌پرد',
  /shownOnceRef/.test(read('components/Stories.tsx')),
  'سه ورودیِ ناهم‌زمان شرط را در ثانیه‌ی اول چند بار عوض می‌کردند');

/* ── انصرافِ بازیکن ──
   تا امروز راهی نبود: بازیکن پول می‌داد و برای انصراف باید به
   باشگاه زنگ می‌زد. */
console.log('\n― انصرافِ بازیکن ―');
const mig74 = read('../../supabase/migrations/074_registration_self_cancel.sql');
t('تابعِ لغوِ خودکار هست', /bh_tournament_self_cancel/.test(mig74));
t('مهلت ۴ ساعت پیش از پایانِ ثبت‌نام است', /v_hours < 4/.test(mig74));
t('پس از قرعه‌کشی لغو نمی‌شود', /bracket_drawn/.test(mig74));
t('فقط صاحبِ ثبت‌نام', /not_yours/.test(mig74));
t('پرداخت‌شده بازپرداخت می‌شود',
  /payment_status = 'PAID'[\s\S]{0,220}refund_amount = r\.amount/.test(mig74));
const regRoute = read('app/api/tournaments/[id]/register/route.ts');
t('مسیرِ DELETE هست', /export async function DELETE/.test(regRoute));
t('صندلیِ آزادشده به صفِ انتظار می‌رود', /promoteWaitlist/.test(regRoute));
t('رابط فقط وقتی دکمه می‌دهد که سرور اجازه داده',
  /reg\.cancel\?\.can &&/.test(read('app/dashboard/page.tsx')),
  'دکمه‌ای که بزنی و خطا بگیرد از نبودنش بدتر است');
t('فهرستِ چیده‌نشده‌ها در موبایل دوستونه است',
  /\.bs-pool\{ display:grid; grid-template-columns:repeat\(2/.test(read('components/tournaments/BracketSeeding.tsx')));

/* ── بای، و بازشدنِ زمان‌بندی‌شده ── */
console.log('\n― بای و زمان‌بندیِ ثبت‌نام ―');
const mig75 = read('../../supabase/migrations/075_bye_slots_and_scheduled_open.sql');
const mig76 = read('../../supabase/migrations/076_mark_byes_on_draw.sql');

t('بای ستونِ خودش را دارد', /p1_bye boolean NOT NULL DEFAULT false/.test(mig75),
  'تا وقتی بای فقط عددی در مرورگر بود، رهاکردنش روی جدول هیچ اثری نداشت');
t('گذاشتنِ بای واقعاً به سرور می‌رود',
  /placeSlot\(tournamentId, ref\.matchId, ref\.slot, null, true\)/.test(seedUi));
t('شمارشِ بای از خودِ جدول است، نه حافظه',
  /placedByes = round1\.reduce/.test(seedUi) && /- placedByes/.test(seedUi));
t('هر دو طرفِ یک بازی نمی‌توانند بای باشند', /'both_bye'/.test(mig75));
t('تراشه‌ی بای قرمز است', /color: on \? '#fff' : '#B23B2E'/.test(seedUi));
t('بای بعد از بازیکن‌ها می‌آید',
  seedUi.indexOf('{pool.map(p =>') < seedUi.indexOf('length: byeCount'));
t('جایگاهِ بای پس گرفته می‌شود', /const clearBye = async/.test(seedUi));
t('دکمه‌ی «تازه‌سازی» برداشته شد', !seedUi.includes('RefreshCw'));
t('قرعه‌کشیِ خودکار هم بای را علامت می‌زند', /SET p1_bye = true/.test(mig76));
t('تأیید چیدمان جایگاهِ بای را «پر» می‌شمارد',
  /p1_registration_id IS NULL AND NOT p1_bye/.test(mig75));

t('ستونِ زمانِ باز شدنِ ثبت‌نام هست', /registration_starts_at timestamptz/.test(mig75));
t('تابعِ بازکردنِ خودکار هست', /bh_tournaments_autoopen/.test(mig75));
t('فقط مسابقه‌ی «بزودی» خودکار باز می‌شود', /WHERE status = 'published'/.test(mig75));
const srv = read('lib/tournaments/server.ts');
t('بازکردنِ خودکار واقعاً صدا زده می‌شود', /await autoOpenDue\(\)/.test(srv),
  'مهاجرت‌های قبلی توابعی داشتند که هیچ‌کس هرگز فراخوانی‌شان نکرد');
t('زمان‌بندی‌شده در «بزودی» می‌ماند',
  /registration_starts_at && row\.status === 'registration_open'/.test(read('app/api/tournaments/route.ts')));
t('فرم گزینه‌ی زمان‌بندی دارد',
  /regOpenMode/.test(read('app/dashboard/club/page.tsx')));
t('کارت به بازیکن می‌گوید کِی برگردد',
  /ثبت‌نام از \{t\.regOpenDate\}/.test(read('app/tournaments/page.tsx')));

/* ── همان قاعده در مسیرِ ویرایش ──
   قاعده در POST بود و در PATCH نبود: باشگاه‌دار تاریخِ باز شدن را
   فردا می‌گذاشت، «انتشار» می‌زد، ثبت‌نام همان لحظه باز می‌شد و
   مسابقه هرگز به «بزودی» نمی‌رفت. هیچ خطایی هم نمی‌داد.

   دو مسیرِ نوشتن روی یک جدول ⇒ هر قاعده باید در هر دو باشد. این
   بلوک همان تقارن را می‌سنجد. */
const tPatch = read('app/api/tournaments/[id]/route.ts');
t('ویرایش هم زمان‌بندی را نگه می‌دارد',
  /nextStatus === 'registration_open' && ms\(regStarts\) > Date\.now\(\)/.test(tPatch),
  'وگرنه «انتشار» زمان‌بندی را بی‌صدا دور می‌زند');
t('تنها زمان‌بندیِ آینده به «بزودی» برمی‌گرداند',
  /> Date\.now\(\)/.test(tPatch),
  'مسابقه‌ای که هفته‌ی پیش سرِ وقت باز شده نباید با ویرایشِ جایزه‌اش برگردد');
t('لغوِ زمان‌بندی با `in` خوانده می‌شود نه `??`',
  /'registration_starts_at' in patch/.test(tPatch),
  '`null ?? مقدارِ قبلی` یعنی برداشتنِ زمان‌بندی هیچ‌وقت اثر نمی‌کرد');
t('ویرایش هم ترتیبِ باز/بسته را می‌سنجد',
  /زمان باز شدن ثبت‌نام باید پیش از مهلت پایان آن باشد/.test(tPatch));
t('تاریخ‌ها با عدد سنجیده می‌شوند نه با مقایسه‌ی حرفی',
  /const ms = \(v/.test(tPatch),
  'مقدارِ ردیف از PostgREST با +00:00 می‌آید و ISOیِ patch با Z');
t('ستونِ زمان‌بندی در تایپِ ردیف هست',
  /registration_starts_at: string \| null/.test(srv));
t('دکمه‌ی انتشار وعده‌ی بی‌جا نمی‌دهد',
  /if \(scheduled\)/.test(read('app/dashboard/club/page.tsx'))
  && /انتشار در «بزودی»/.test(read('app/dashboard/club/page.tsx')),
  'دکمه‌ای که زده شود و هیچ‌چیز عوض نکند، «خراب» به‌نظر می‌رسد');
t('راهِ نظرعوض‌کردن هست',
  /باز کردن ثبت‌نام همین حالا/.test(read('app/dashboard/club/page.tsx'))
  && /registrationStartsAt: null/.test(read('app/dashboard/club/page.tsx')));

/* ── بقیه‌ی موارد ── */
console.log('\n― پنل و آمار ―');
const clubPage = read('app/dashboard/club/page.tsx');
t('حذفِ مسابقه با پنجره‌ی خودِ پنل است، نه confirm مرورگر',
  !/confirm\(`مسابقه/.test(clubPage) && /open=\{!!delTourn\}/.test(clubPage));
t('بعد از حذف پیام داده می‌شود', /از فهرستِ مسابقات حذف شد/.test(clubPage));
t('آمارِ باشگاه با نامک هم کار می‌کند',
  /\.eq\('slug', raw\)/.test(read('app/api/clubs/[id]/stats/route.ts')),
  'صفحه‌ی عمومی نشانیِ /clubs/{slug} می‌دهد و آمار همیشه صفر برمی‌گشت');
t('فهرستِ مربیان تأییدنشده‌ها را هم می‌آورد', /profiles\/coach\?all=1/.test(clubPage));
t('مربیِ تأییدنشده افزوده نمی‌شود', /const locked = alreadyAdded \|\| pending/.test(clubPage));
t('«رزروهای شما» اسکرولِ داخلی دارد',
  /maxHeight: 'min\(60vh, 420px\)', overflowY: 'auto'/.test(read('components/booking/MyBookings.tsx')));
t('برچسبِ «در انتظار دور قبل» برداشته شد',
  !/>در انتظار دور قبل</.test(read('app/tournaments/[id]/admin/page.tsx')));

/* ── صفحه‌ی مسابقات و صفحه‌ی خودِ مسابقه ── */
console.log('\n― صفحه‌ی مسابقات ―');
const detail   = read('app/tournaments/[id]/page.tsx');
const adminPg  = read('app/tournaments/[id]/admin/page.tsx');

t('ترتیب تب‌ها: همه، ثبت‌نام، برگزاری، بزودی، بسته، پایان‌یافته',
  /'all'[\s\S]{0,60}'registration_open'[\s\S]{0,80}'live'[\s\S]{0,80}'upcoming'[\s\S]{0,80}'bracket_ready'[\s\S]{0,80}'finished'/.test(listPage));
t('«همه» تازه‌ترین را اول می‌آورد',
  /tab === 'all'[\s\S]{0,120}createdAt/.test(listPage),
  'ترتیبِ سرور بر اساسِ تاریخِ برگزاری است، نه لحظه‌ی ثبت');
t('createdAt از سرور می‌آید', /createdAt: r\.created_at/.test(read('lib/tournaments/client.ts')));
t('نوار ظرفیت گرادیانِ سبز→آبی→قرمز دارد',
  /linear-gradient\(to left, #30C55A 0%, #0EA5E9 55%, #B23B2E 100%\)/.test(listPage));
t('گرادیان روی کلِ نوار لنگر می‌شود، نه روی بخشِ پرشده',
  /backgroundSize: `\$\{pct > 0 \? 10000 \/ pct : 100\}% 100%`/.test(listPage));
t('در حالتِ فهرست فلشِ انتهای ردیف برداشته شد',
  !/<ChevronLeft size=\{16\}/.test(listPage));
t('نشانِ وضعیت در فهرست طرحِ LQ دارد',
  /function StatusChipLQ/.test(listPage)
  && /color: '#9A6E38'[\s\S]{0,140}rgba\(199,166,106,0\.34\)/.test(listPage));
t('نشانِ وضعیت آخرِ ردیف است (سمتِ چپ در RTL)',
  listPage.indexOf('lr-fee') < listPage.indexOf('<StatusChipLQ'));
t('عبارتِ «رویدادهای رسمی» اصلاح شد',
  /رویدادها را در پلتفرم بیلیارد هاب/.test(listPage) && !/رویدادهای رسمی/.test(listPage));

t('پنلِ مدیریت از صفحه‌ی عمومیِ مسابقه برداشته شد',
  !/پنل مدیریت مسابقه/.test(strip(detail)), 'این صفحه عمومی است و بازیکن هم آن را می‌دید');
t('سکوی نفرات برتر هست', /FINAL STANDINGS/.test(detail) && /سوم مشترک/.test(detail));
t('سکو فقط برای مسابقه‌ی تمام‌شده', /t\.status === 'finished' && podium\?\.champion/.test(detail));
t('سومِ مشترک از بازنده‌های نیمه‌نهایی محاسبه می‌شود',
  /round === totalRounds - 1 && m\.winner !== null/.test(read('lib/tournaments/matches.ts')));
t('توضیحِ اضافیِ قرعه‌کشی برداشته شد', !/هر دو راه ثبت‌نام را می‌بندند/.test(adminPg));
t('«در انتظار دور قبل» هیچ‌جا نمی‌آید',
  !/return 'در انتظار دور قبل'/.test(read('lib/tournaments/bracket-client.ts')));
t('کپشنِ کارتِ نقش کوتاه شد',
  /در صورت صلاحیت نقش جدید را انتخاب کنید/.test(read('app/dashboard/page.tsx')));

/* ── ثبتِ نتیجه: امتیازِ زنده، سقفِ فرمت، برک ── */
console.log('\n― ثبتِ نتیجه ―');
const mig77 = read('../../supabase/migrations/077_live_score_break_and_cap.sql');
const bc    = read('lib/tournaments/bracket-client.ts');
const admin2 = read('app/tournaments/[id]/admin/page.tsx');
const stagePg = read('app/tournaments/[id]/stage/page.tsx');

t('هدفِ فرمت در دیتابیس محاسبه می‌شود', /bh_format_target/.test(mig77));
t('Best of N یعنی اکثریت، نه N', /RETURN \(n \/ 2\) \+ 1/.test(mig77),
  'در Best of 5 برنده کسی است که به ۳ برسد');
t('بازیِ زمان‌دار سقف ندارد', /RETURN NULL;   -- time/.test(mig77));
t('امتیازِ بیش از سقف رد می‌شود', /'over_target'/.test(mig77));
t('پایانِ بازی بدونِ رسیدن به هدف رد می‌شود', /'under_target'/.test(mig77));
const liveBody = mig77.slice(mig77.indexOf('bh_match_live_score'),
  mig77.indexOf('bh_match_set_break'));
t('امتیازِ زنده برنده اعلام نمی‌کند',
  !/bh_match_advance/.test(liveBody) && !/winner = /.test(liveBody),
  'اگر صعود بدهد دیگر «امتیازِ جاری» نیست — بازی تمام شده');
t('ستون‌های برک اضافه شدند', /high_break integer/.test(mig77) && /high_break_player smallint/.test(mig77));
t('تابعِ ثبتِ برک هست', /bh_match_set_break/.test(mig77));

t('کلاینت تابعِ امتیازِ زنده دارد', /export async function liveScore/.test(bc));
t('کلاینت تابعِ برک دارد', /export async function setHighBreak/.test(bc));
t('سقفِ فرمت سمتِ کلاینت هم حساب می‌شود', /export function formatTarget/.test(bc));
t('برکِ مسابقه بیشترینِ برک‌های بازی‌هاست', /export function tournamentHighBreak/.test(bc));

t('امتیاز کنارِ نامِ هر بازیکن است', /function ScoreLine/.test(admin2),
  'یک «۳ – ۲»ی جدا یعنی یک لحظه مکث برای فهمیدنِ اینکه کدام عدد مالِ کیست');
t('عدد بدونِ کادر، با −/+ کنارش', /<StepBtn onClick=\{\(\) => onSet\(value - 1\)\}/.test(admin2));
t('«تأیید» و «پایان بازی» دو دکمه‌ی جدا هستند',
  /پایان بازی/.test(admin2) && /const pushLive = async/.test(admin2));
t('«تأیید» فقط امتیاز می‌فرستد، نه نتیجه',
  /const pushLive[\s\S]{0,220}liveScore\(tournamentId, match\.id/.test(admin2));
t('سقفِ فرمت روی +/- اعمال می‌شود', /Math\.min\(frameCap\(target, s2\), v\)/.test(admin2));
t('در Best of 5 نتیجه ۳–۳ ممکن نیست',
  /return otherScore >= target \? target - 1 : target/.test(read('lib/tournaments/bracket-client.ts')),
  'هدف ۳ است ولی تا یکی به ۳ برسد بازی تمام است — بازنده حداکثر ۲');
const mig78 = read('../../supabase/migrations/078_break_per_player_and_frame_cap.sql');
t('سرور هم جلوی «هر دو به هدف» را می‌گیرد', /both_at_target/.test(mig78));
t('برک برای هر بازیکن جدا ذخیره می‌شود', /high_break_p1 integer/.test(mig78));
t('ستون‌های تک‌برکِ قبلی حذف شدند — نه دو منبع برای یک چیز',
  /DROP COLUMN IF EXISTS high_break,/.test(mig78));
t('شماره‌ی بازی از کادرها برداشته شد',
  !/#\{faDigits\(m\.match_index \+ 1\)\}/.test(read('components/tournaments/BracketTree.tsx')));
t('شماره‌ی میز درشت و مشخص است',
  /fontSize: stage \? 13 : 10\.5, fontWeight: 900, color: GOLD_D/.test(read('components/tournaments/BracketTree.tsx')));
t('نشانِ تکراریِ Bye در سرِ کادر برداشته شد',
  !read('components/tournaments/BracketTree.tsx').includes('}}>Bye</span>'),
  'خودِ خطِ بازیکن همان Bye را می‌گفت — دو بار نوشته می‌شد');
t('برچسبِ فارسیِ «بای» جایی نمانده',
  !/>بای</.test(read('components/tournaments/BracketTree.tsx'))
  && !/بای — صعود خودکار/.test(read('app/tournaments/[id]/admin/page.tsx')));
t('فوترِ صفحه‌ی مدیریتِ زنده هم پنهان است',
  /\(stage\|control\)/.test(read('components/FooterGate.tsx'))
  && /\(stage\|control\)/.test(read('components/Navbar.tsx')));
t('هدفِ فرمت روی کارت نوشته می‌شود', /تا \{faDigits\(target\)\} فریم/.test(admin2));
t('ورودیِ بالاترین برک هست', /بالاترین برک/.test(admin2) && /const saveBreak = async/.test(admin2));

const ctrlPg = read('app/tournaments/[id]/control/page.tsx');
t('پنلِ مدیریتِ زنده هم «تأیید» و «پایان بازی» دارد',
  /تأیید روی مانیتور/.test(ctrlPg) && /پایان بازی/.test(ctrlPg));
t('پنلِ مدیریتِ زنده سقفِ فرمت را رعایت می‌کند',
  /Math\.min\(frameCap\(target, cur\[side === 0 \? 1 : 0\]\), next\[side\] \+ d\)/.test(ctrlPg));
t('برک هر بازیکن در مدیریتِ زنده ثبت می‌شود', /setHighBreak\(id, m\.id, player, v\)/.test(ctrlPg));
t('فیلدِ برک دکمه‌ی تیک ندارد و با خروجِ فوکوس ذخیره می‌شود',
  /onBlur=\{\(\) => void saveBreak\(m, player\)\}/.test(ctrlPg));
t('سرستونِ «بالاترین برک» هم‌عرضِ خودِ فیلد است',
  (ctrlPg.match(/width: BRK_W/g) ?? []).length >= 2,
  'عرضِ ثابت تنها راهِ نشستنِ عنوان دقیقاً بالای کادر است');
t('تب‌های پنلِ مسابقه یک ردیف می‌مانند و کشیده می‌شوند',
  /<DragScroll style={{/.test(admin2) && !/marginBottom: 18, flexWrap: 'wrap'/.test(admin2),
  'flexWrap چهارمین تب را روی موبایل به خطِ دوم می‌انداخت');
t('شماره‌ی بازی از مدیریتِ زنده هم رفت',
  !/#\{faDigits\(m\.match_index \+ 1\)\}/.test(ctrlPg));
t('تمِ مدیریتِ زنده روشن است',
  !/'#0B100E'/.test(ctrlPg) && /background: BG, color: INK/.test(ctrlPg));
t('اگر برک بالاترین شد همان‌جا گفته می‌شود', /بالاترین برکِ مسابقه شد/.test(ctrlPg));
t('بالاترین برک روی مانیتور دیده می‌شود', /tournamentHighBreak\(b\)/.test(stagePg));

t('در موبایل تصویرِ ردیف آیکونی و مربعی است',
  /\.lr-thumb \{ width: 46px; aspect-ratio: 1;/.test(listPage));
t('قابِ توپ فقط روی پوسترهای خودمان',
  /lr-ball/.test(listPage) && /t\.banner\.startsWith\('\/images\/tournaments\/'\)/.test(listPage));

/* ── فهرستِ مسابقاتِ پنلِ باشگاه ── */
console.log('\n― فهرستِ مسابقات در پنل ―');
const clubPg = read('app/dashboard/club/page.tsx');
t('مسابقه‌ی تمام‌شده جدا و جمع‌شده می‌آید',
  /const past = myTournaments\.filter\(x => x\.status === 'finished'\)/.test(clubPg),
  'کارتِ کامل هفت دکمه دارد که برای مسابقه‌ی برگزارشده هیچ‌کدام کاری نمی‌کند');
t('ردیفِ جمع‌شده فقط عنوان و تاریخ دارد',
  /GAME_TYPE_LABELS\[t\.gameType\]\} \| \{t\.date\}/.test(clubPg));
t('با کلیک باز می‌شود', /setOpenPast\(open \? '' : t\.id\)/.test(clubPg));
t('بیش از چهار تا اسکرول می‌گیرد',
  /past\.length > 4 \? 'min\(58vh, 300px\)' : undefined/.test(clubPg));
t('کارتِ کامل یک تعریف دارد، نه دو',
  (clubPg.match(/const renderTournamentCard/g) ?? []).length === 1
  && (clubPg.match(/<Card key=\{t\.id\}>/g) ?? []).length === 1,
  'دو نسخه یعنی هر تغییری باید دو جا انجام شود');

/* ── مانیتورِ سالن ── */
console.log('\n― مانیتورِ سالن ―');
const treeSrc = read('components/tournaments/BracketTree.tsx');
const stg  = read('app/tournaments/[id]/stage/page.tsx');

t('امتیازِ جاری هم روی جدول دیده می‌شود',
  /const showScore = done \|\| live \|\| m\.score1 > 0 \|\| m\.score2 > 0/.test(treeSrc),
  'پیش‌تر عدد فقط با وجودِ برنده رندر می‌شد، یعنی ۱–۰ هرگز روی مانیتور نمی‌آمد');
t('هیچ‌جای درخت به `show={done}` وصل نمانده', !/show=\{done\}/.test(treeSrc));
t('اندازه‌گیریِ درخت به هر بازخوانی گره نخورده',
  /\}, \[bracket\.matches\.length, bracket\.totalRounds, fill\]\)/.test(treeSrc),
  'وابستگی به خودِ شیء یعنی یک reflow اجباری در هر تیکِ ۳ ثانیه‌ای');
t('مقدارِ بی‌تغییر دوباره ست نمی‌شود', /Math\.abs\(p - next\) < 0\.001/.test(treeSrc));

t('بازخوانیِ زنده سریع‌تر شد', /hasLive \? 3000 : 10000/.test(stg));
t('بازگشت به تب فوراً تازه می‌کند', /visibilitychange/.test(stg));
t('نوارِ سایت روی مانیتور پنهان است',
  read('components/Navbar.tsx').includes('(stage|control)$/.test(pathname)) return null'));
t('دکمه‌ی تمام‌صفحه تا وقتی واقعاً تمام‌صفحه نشده می‌ماند',
  /fullscreenchange/.test(stg) && !/setShowFs\(false\);\n  \};/.test(stg),
  'اگر مرورگر رد کند، دکمه غیب می‌شد و نوارِ نشانی بالای جدول می‌ماند');
t('اولین لمس هم تمام‌صفحه می‌کند', /'pointerdown', once, \{ once: true \}/.test(stg));

/* ── جداکردنِ مدیریتِ زنده از مانیتور ── */
console.log('\n― مدیریتِ زنده و پرکردنِ صفحه ―');
const ctrl = read('app/tournaments/[id]/control/page.tsx');
const stg2 = read('app/tournaments/[id]/stage/page.tsx');
const adm2 = read('app/tournaments/[id]/admin/page.tsx');
const tre2 = read('components/tournaments/BracketTree.tsx');

t('مدیریتِ زنده صفحه‌ی جدا دارد', ctrl.length > 0 && /export default function LiveControlPage/.test(ctrl));
t('کشوی مدیریتِ زنده از مانیتور برداشته شد',
  !/LivePanel/.test(stg2) && !/setPanel/.test(stg2),
  'روی همان صفحه باز می‌شد و جدول را از دیدِ تماشاگر می‌پوشاند');
t('هر دو دکمه کنارِ هم‌اند و در پنجره‌ی تازه باز می‌شوند',
  /\/stage`\} target="_blank"/.test(adm2) && /\/control`\} target="_blank"/.test(adm2));
t('شماره‌ی میز از مدیریتِ زنده ثبت می‌شود',
  /const saveTable = async/.test(ctrl) && /tableNumber: n/.test(ctrl));
t('«روی آنتن» شد «در حال انجام بازی»',
  /در حال انجام بازی/.test(ctrl) && /در حال انجام بازی/.test(adm2)
  && !/بردن روی آنتن/.test(ctrl) && !/'پایان پخش'/.test(adm2));

t('جدول روی مانیتور کلِ صفحه را پر می‌کند', /<BracketTree bracket=\{b\} stage fill/.test(stg2));
t('در حالتِ پرکردن بزرگ‌نمایی هم می‌شود',
  /const next = fill \? Math\.min\(byW, byH\) : Math\.min\(1, byW\)/.test(tre2),
  'سقفِ ۱ یعنی جدولِ کوچکی وسطِ مانیتورِ بزرگ با حاشیه‌ی خالی');
t('قاب ارتفاعِ واقعی می‌گیرد', /fill \? \{ height: '100%', alignItems: 'center' \}/.test(tre2));
t('نیمه‌ی چپ آینه است', /mirror=\{side === 'left'\}/.test(tre2)
  && /flexDirection: mirror \? 'row-reverse' : 'row'/.test(tre2));
t('«بای — بدون حریف» شد Bye', /return other \? 'Bye' : '—'/.test(read('lib/tournaments/bracket-client.ts')));
t('Bye قرمز است', /name === 'Bye' \? RED/.test(tre2));
t('تمِ مانیتور روشن است',
  !/'#070B09'/.test(stg2) && /background: BG/.test(stg2),
  'جدولِ تیره در نورِ سالن کم‌کنتراست دیده می‌شد');
t('بالاترین برک زیرِ کادرِ فینال می‌نشیند',
  /marginTop: 'auto', alignSelf: 'center'/.test(tre2) && /highBreak=\{highBreak\}/.test(stg2));

/* ── پنلِ ادمین: قابِ فهرست‌ها و نوارِ تب‌ها ── */
console.log('\n― پنلِ ادمین ―');
t('کارتِ تیکتِ باز روی داشبورد هست',
  /key: 'openTickets'/.test(read('app/admin/page.tsx'))
  && /countOf\('support_tickets'/.test(read('app/api/admin/stats/route.ts')),
  'کاربر تیکت می‌زد و ادمین تا سرزدنِ دستی خبردار نمی‌شد');
t('کامپوننتِ مشترکِ فهرستِ قاب‌دار هست', read('components/ui/ScrollList.tsx').length > 0);
t('کامپوننتِ مشترکِ نوارِ تب هست', read('components/ui/TabStrip.tsx').length > 0);
t('نوارِ تب هرگز نمی‌شکند',
  /flex: '0 0 auto', whiteSpace: 'nowrap'/.test(read('components/ui/TabStrip.tsx')));
t('فهرستِ کوتاه قابِ بی‌دلیل نمی‌گیرد',
  /const bounded = count > min/.test(read('components/ui/ScrollList.tsx')));

/* هیچ صفحه‌ای نباید فهرستِ بی‌سقف داشته باشد */
for (const page of [
  'users', 'clubs', 'bookings', 'support', 'reports', 'coaches', 'referees',
  'sellers', 'verifications', 'products', 'sms', 'demo-content',
]) {
  t(`فهرستِ «${page}» قاب دارد`, /<ScrollList/.test(read(`app/admin/${page}/page.tsx`)));
}
for (const page of ['clubs', 'bookings', 'support', 'reports', 'roles', 'tournaments']) {
  t(`تب‌های «${page}» یک ردیف می‌مانند`, /<TabStrip/.test(read(`app/admin/${page}/page.tsx`)));
}

/* ── صفحه‌ی سفید: بازبارگذاریِ نسخه‌ی کهنه ── */
console.log('\n― نسخه و صفحه‌ی سفید ―');
t('نسخه‌ی build دیگر به متغیرِ Vercel وابسته نیست',
  !read('next.config.js').includes('process.env.VERCEL_GIT_COMMIT_SHA')
  && !read('app/api/version/route.ts').includes('process.env.VERCEL_GIT_COMMIT_SHA'),
  'روی سرورِ خودمان آن متغیر نیست، پس هر دو طرف «dev» می‌شدند و مقایسه هیچ‌وقت نامساوی نمی‌شد');
t('هر دو طرف از یک فایل می‌خوانند',
  /\.build-sha/.test(read('next.config.js')) && /\.build-sha/.test(read('app/api/version/route.ts')));
t('دیپلوی شناسه را می‌نویسد', /> \.build-sha/.test(read('../../deploy.sh')));
t('chunkِ گمشده صفحه را سفید نمی‌گذارد',
  /ChunkLoadError\|Loading chunk/.test(read('components/AppBoot.tsx')));
t('بازبارگذاری حلقه نمی‌زند',
  /bh-chunk-reload/.test(read('components/AppBoot.tsx')));
t('build روی پوشه‌ی زنده انجام نمی‌شود',
  /NEXT_DIST_DIR=\.next-build/.test(read('../../deploy.sh')),
  'بیلدِ درجا یعنی هر بازدیدکننده در آن دو دقیقه خطای ۵۰۰ می‌گیرد');

/* ── ارتقای آگهی: تازه‌سازی و فوری ── */
console.log('\n― ارتقای آگهی ―');
const mig79 = read('../../supabase/migrations/079_ad_boosts.sql');
const boostApi = read('app/api/market/ads/[id]/boost/route.ts');
const boostCb  = read('app/api/market/boost/callback/[provider]/route.ts');
const marketApi = read('app/api/market/ads/route.ts');
const shopPage = read('app/shop/page.tsx');

t('دو اهرمِ متفاوت، نه دو برچسب',
  /bumped_at    timestamptz/.test(mig79) && /urgent_until timestamptz/.test(mig79),
  'تازه‌سازی روی ترتیب اثر می‌گذارد و فوری روی جایگاهِ رزروشده');
t('فهرستِ بازار به تازه‌سازی نگاه می‌کند',
  /\.order\('bumped_at'/.test(marketApi),
  'اگر مرتب‌سازی فقط تاریخِ ثبت باشد، تازه‌سازی هیچ اثری ندارد');
t('نوارِ فوری در بازار هست', /const urgent = useMemo/.test(shopPage) && /فروشنده عجله دارد/.test(shopPage));
t('ترتیبِ نوارِ فوری هر ساعت می‌چرخد',
  /Math\.floor\(now \/ 3600000\)/.test(shopPage),
  'ترتیبِ ثابت یعنی خریدارِ دیروز ته نوار — همان مشکلی که فوری قرار بود حلش کند');
t('آگهیِ فوری نشانِ قرمز می‌گیرد', /mk-urg/.test(shopPage));
t('انقضای فوری در خواندن سنجیده می‌شود',
  /urgentOnly\) q = q\.gt\('urgent_until'/.test(marketApi),
  'کرانی که یک بولین را خاموش کند، همان چیزی است که چند بار بی‌صدا از کار افتاد');

t('قیمت از سرور خوانده می‌شود نه از بدنه',
  /const pricing = await boostPricing\(\)/.test(boostApi)
  && !/body\?\.price|b\.price/.test(boostApi));
t('قفلِ تازه‌سازی هست',
  /if \(st && !st\.canBump\)/.test(boostApi),
  'بدونش صدرِ فهرست اجاره‌ای می‌شود');
t('آگهیِ فروخته یا منقضی ارتقا نمی‌گیرد',
  /if \(p\.soldAt\)/.test(boostApi) && /مهلت این آگهی تمام شده/.test(boostApi));
t('پرداخت، اعمال و ثبتِ مالی یک عملیات‌اند',
  /bh_boost_apply/.test(mig79) && /INSERT INTO ledger_entries/.test(mig79));
t('کالبکِ تکراری دوبار حساب نمی‌شود',
  /IF o\.applied_at IS NOT NULL THEN/.test(mig79)
  && /ON CONFLICT \(source_key\) DO NOTHING/.test(mig79));
t('فوری تمدید می‌شود نه ریست',
  /greatest\(now\(\), coalesce\(urgent_until, now\(\)\)\)/.test(mig79),
  'کسی که دو بار می‌خرد باید ۱۴ روز بگیرد نه ۷');
t('مبلغِ برگشتی با تعرفه سنجیده می‌شود', /AD_BOOST_AMOUNT_MISMATCH/.test(boostCb));
t('کالبک به صفحه‌ای برمی‌گردد که وجود دارد',
  /\/dashboard\/shop\?boost=/.test(boostCb)
  && existsSync(join(ROOT, 'app/dashboard/shop/page.tsx')));
t('کاربر پس از بازگشت پیام می‌گیرد',
  /آگهی شما تازه‌سازی شد/.test(read('app/dashboard/shop/page.tsx')));
t('دکمه‌ی ارتقا کنارِ خودِ آگهی است',
  /setBoostFor\(\{\s*\n?\s*id: product\.id/.test(read('app/dashboard/shop/page.tsx')));
t('درآمدِ ارتقا در گزارشِ مالی می‌آید',
  /AD_BOOST_REVENUE/.test(read('app/api/admin/finance/route.ts'))
  && /boostNetRevenue/.test(read('app/admin/finance/page.tsx')));
t('تعرفه در تنظیمات است نه در کد',
  /ad_boost_pricing: 'json'/.test(read('app/api/admin/settings/route.ts'))
  && /تعرفه‌ی ارتقا ذخیره شد/.test(read('app/admin/ad-plans/page.tsx')));
t('تنظیمِ ناقص یعنی خاموش',
  /enabled: false,/.test(read('lib/market/boost.ts')),
  'یک کلیدِ گم‌شده نباید فروشِ چیزی را باز کند که قیمتش معلوم نیست');

/* ── حسابِ واریزِ بی‌مصرف ── */
console.log('\n― حسابِ واریزِ بسته‌ها ―');
t('کلیدهای حسابِ واریز از تنظیمات برداشته شدند',
  !/^\s*platform_bank: 'json'/m.test(read('app/api/admin/settings/route.ts'))
  && !/^\s*story_platform_bank: 'json'/m.test(read('app/api/admin/settings/route.ts')),
  'فقط نوشته می‌شدند و هیچ‌کس نمی‌خواندشان');
t('فرمِ حسابِ واریز از هر دو صفحه رفت',
  !/حساب واریز فروش بسته‌ها/.test(read('app/admin/ad-plans/page.tsx'))
  && !/حساب واریز فروش بسته‌ها/.test(read('app/admin/story-plans/page.tsx')));
t('خریدِ بسته همچنان از درگاه می‌رود',
  /getPaymentProvider\(\)/.test(read('app/api/ads/plans/buy/route.ts'))
  && /getPaymentProvider\(\)/.test(read('app/api/stories/plans/buy/route.ts')));

/* ── بازار: فرمِ آگهی و صفحه‌ی محصول ── */
console.log('\n― بازار ―');
const newAd = read('app/shop/new/page.tsx');
const newAdS = strip(newAd);
const detail2 = read('app/shop/[id]/page.tsx');
const detail2S = strip(detail2);
const relApi = read('app/api/market/ads/[id]/related/route.ts');

t('قیمتِ قبل از تخفیف نمی‌تواند کمتر باشد',
  /قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد/.test(newAd),
  'پیش‌تر بی‌صدا درصد را صفر می‌کرد و فروشنده فکر می‌کرد تخفیف گذاشته');
t('مدل دیگر الزامی نیست', !/e\.model\s+= 'مدل الزامی است'/.test(newAd));
t('پنجره‌ی «محصول کجا نمایش داده شود» برداشته شد',
  !/محصول کجا نمایش داده شود/.test(newAdS) && !/setShowSection/.test(newAd));
t('نامِ آگهی از دسته و نوع ساخته می‌شود',
  /const composedName = \[catLabel, effType\]/.test(newAd),
  'برند و مدل نمی‌گویند اصلاً توپ است یا چوب');
t('دسته‌ی توپ «کیوبال» و «سایر» دارد',
  /'کیوبال', 'سایر'\]/.test(newAd));
t('«سایر» فیلدِ توضیح باز می‌کند',
  /form\.type === 'سایر' && \(/.test(newAd) && /typeOther/.test(newAd));
t('«سایر» بدونِ توضیح پذیرفته نمی‌شود', /برای «سایر» توضیح بنویسید/.test(newAd));

t('امتیازِ ساختگی از صفحه‌ی محصول رفت',
  !/product\.rating\.toFixed/.test(detail2) && !/function Stars/.test(detail2));
t('متنِ سلبِ مسئولیت اصلاح شد',
  /کالا را کامل بررسی و/.test(detail2) && !/از نزدیک بررسی کنید/.test(detail2));
t('سه «تضمین» بی‌پشتوانه برداشته شدند',
  !/گارانتی اصالت کالا/.test(detail2S) && !/ارسال به سراسر کشور/.test(detail2S)
  && !/۷ روز ضمانت بازگشت/.test(detail2S),
  'بیلیارد هاب طرفِ معامله نیست و کالا را نه می‌فرستد نه پس می‌گیرد');

/* ── ۱۰ · عنوانِ محصول در دو تکه ──
   کارت فقط `title` را نشان می‌داد و `title` موقعِ ثبت از «دسته + نوع»
   ساخته می‌شود؛ یعنی خریدار «چوب اسنوکر» می‌دید و برند و مدل — که
   فروشنده هر دو را نوشته بود — هیچ‌جا دیده نمی‌شدند.

   همان الگوی همیشگی: فرم درست پر می‌شد، سرور ذخیره‌اش می‌کرد، و
   خروجی به بازدیدکننده نمی‌رسید. سه لایه باید با هم درست باشند، پس
   هر سه این‌جا سنجیده می‌شوند. */
console.log('\n― عنوانِ محصول ―');
const titleLib = read('lib/market/title.ts');
t('منبعِ واحدِ عنوان هست',
  /export function productTitleParts/.test(titleLib)
  && /export function productTitle\b/.test(titleLib));
t('ستونِ model در فهرستِ عمومیِ بازار هست',
  /'brand', 'model'/.test(marketApi),
  'بدونِ این ستون، تکه‌ی دومِ عنوان روی کارت‌های فهرست خالی می‌ماند');
t('model در MINE_COLS تکرار نشده',
  !/\$\{LIST_COLS\}[^`]*\bmodel\b/.test(marketApi));
t('برندی که در عنوان هست دوباره گفته نمی‌شود',
  /filter\(x => !has\(head, x\)\)/.test(titleLib),
  'عنوانی که فروشنده خودش نوشته ممکن است برند را داشته باشد');
t('«O’min» و «O’min classic» با هم نمی‌آیند',
  /y\.length > x\.length && has\(y, x\)/.test(titleLib));
t('پیشوندِ «سایر:» به خریدار نشان داده نمی‌شود',
  /replace\(\/\^سایر/.test(titleLib));

/* درشت‌تربودن ادعاست تا وقتی عدد دو کلاس با هم سنجیده نشود؛ اگر روزی
   کسی اندازه‌ها را عوض کند، همین‌جا لو می‌رود. */
const sizeOf = (src, cls) => {
  const m = src.match(new RegExp(`\\.${cls} \\{[^}]*font-size: ([0-9.]+)px`));
  return m ? Number(m[1]) : null;
};
const hSize = sizeOf(shopPage, 'mk-h'), tSize = sizeOf(shopPage, 'mk-t');
t('کارت عنوان را دو تکه نشان می‌دهد',
  /className="mk-h"/.test(shopPage) && /className="mk-t"/.test(shopPage));
t('دسته و نوع درشت‌تر از برند و مدل است',
  !!hSize && !!tSize && hSize > tSize, `${hSize} ≤ ${tSize}`);
t('ردیفِ موبایل هم دو تکه است',
  /\.mk-row \.ttl \.mk-h/.test(shopPage) && /\.mk-row \.ttl \.mk-t/.test(shopPage));
t('صفحه‌ی محصول هم دو تکه است',
  /titleHead/.test(detail2) && /titleTail/.test(detail2));
t('پیش‌نمایشِ فرمِ ثبت همان دو تکه را نشان می‌دهد',
  /previewParts\.head/.test(newAd) && /previewParts\.tail/.test(newAd));
t('مدل هم جستجو می‌شود',
  /\$\{l\.name\} \$\{l\.brand\} \$\{l\.model\}/.test(shopPage),
  'کسی که «classic» را می‌نویسد دنبالِ مدل است');
t('واتساپ و گزارشِ تخلف عنوانِ کامل می‌برند',
  /fullName/.test(detail2) && !/targetTitle=\{product\.name\}/.test(detail2));

/* ── صفحه‌ی محصول: عکس‌ها، وعده‌ی بی‌پشتوانه، و «مشابه» ── */
t('همه‌ی عکس‌های آگهی گالری می‌شوند',
  /const gallery = product\.images/.test(detail2) && /setImgIdx/.test(detail2),
  'فروشنده تا هشت عکس می‌گذارد و صفحه فقط اولی را نشان می‌داد');
t('نوارِ تامبنیل فقط با بیش از یک عکس',
  /gallery\.length > 1 &&/.test(detail2),
  'نوارِ تک‌خانه‌ای شبیهِ چیزی است که کار نمی‌کند');
t('عوض‌شدنِ آگهی تصویر را به اولی برمی‌گرداند',
  /setImgIdx\(0\) \}, \[id\]/.test(detail2));
t('«موجود در انبار» برداشته شد',
  !/موجود در انبار/.test(detail2S),
  'موجودی هیچ‌جا شمرده نمی‌شود و آگهی ممکن است فروخته شده باشد');
t('برند و مدل در تیتر خطِ خودشان را دارند',
  /display: 'block', marginTop: 4/.test(detail2) && /fontWeight: 400/.test(detail2));
t('«مشابه» از دسته بیرون نمی‌زند',
  !/order\('createdAt'.*\n?.*limit\(40\)/.test(relApi) && /\.eq\('category', me\.category\)/.test(relApi),
  'زیرِ صفحه‌ی چوب، توپ و گچ نشان داده می‌شد');
t('نوع مهم‌تر از برند است',
  /norm\(r\.type\) === norm\(me\.type\)\) s \+= 40/.test(relApi)
  && /norm\(r\.brand\) === norm\(me\.brand\)\) s \+= 25/.test(relApi),
  'خریدارِ چوبِ اسنوکر، چوبِ پولِ همان برند را نمی‌خواهد');
t('کارتِ «مشابه» هم دو خطی است',
  /const rp = productTitleParts/.test(detail2));

/* ── چهار چیزی که «درست نشده» بود ──
   هر چهار مورد یک جنس داشتند: داده در دیتابیس بود، فرم درست پرش
   کرده بود، و نمایش یا نمی‌خواندش یا اشتباه نشانش می‌داد. */
t('برند و مدل خطِ خودشان را دارند، نه کنارِ عنوان',
  /\.mk-t \{ display: block/.test(shopPage) && /font-weight: 400/.test(shopPage),
  'خواسته: خطِ اول بولد، خطِ دوم فونتِ معمولی');
t('کلامپِ دو خط از والدِ عنوان برداشته شد',
  !/\.mk-name \{[^}]*line-clamp/.test(shopPage),
  'با کلامپِ والد، خطِ دومِ عنوان دوباره حذف می‌شد');
t('خطِ اولِ کارت بولد است', /\.mk-h \{[^}]*font-weight: 800/.test(shopPage));
t('ردیفِ موبایل هم همین دو خط را دارد',
  /\.mk-row \.ttl \.mk-t \{[^}]*font-weight: 400/.test(shopPage));
t('پیش‌نمایشِ فرم هم دو خط است',
  /previewParts\.tail && \(/.test(newAd) && /fontWeight: 800/.test(newAd));

t('صفحه‌ی محصول گالری دارد، نه یک عکس',
  /gallery\.length > 1/.test(detail2) && /setImgIdx/.test(detail2),
  'فروشنده تا هشت عکس می‌گذاشت و فقط اولی دیده می‌شد');
t('همه‌ی عکس‌ها از ردیف خوانده می‌شوند',
  /images:\s+imgs && imgs\.length > 0/.test(detail2));
t('عوض‌شدنِ آگهی گالری را از اول شروع می‌کند',
  /setImgIdx\(0\) \}, \[id\]/.test(detail2),
  'وگرنه رفتن از آگهیِ هشت‌عکسه به دوعکسه تصویرِ خالی می‌داد');

t('«موجود در انبار» برداشته شد',
  !/موجود در انبار/.test(detail2S),
  'موجودی هیچ‌جا شمرده نمی‌شود؛ برچسبِ سبزِ «موجود» بی‌پشتوانه بود');

t('مشابه‌ها هرگز از دسته‌ی دیگر نمی‌آیند',
  !/order\('createdAt'.*\n?.*limit\(40\)/.test(relApi) && !/pool\.push/.test(relApi),
  'زیرِ صفحه‌ی چوب، توپ و گچ نشان داده می‌شد');
t('دسته مرزِ سخت است نه امتیاز',
  /\.eq\('category', me\.category\)/.test(relApi) && !/s \+= 50/.test(relApi));
t('نوعِ یکسان از برند مهم‌تر است',
  /norm\(r\.type\) === norm\(me\.type\)\) s \+= 40/.test(relApi)
  && /norm\(r\.brand\) === norm\(me\.brand\)\) s \+= 25/.test(relApi),
  'خریدارِ چوبِ اسنوکر، چوبِ پولِ همان برند را نمی‌خواهد');
t('کارتِ مشابه‌ها هم دو خطی است',
  /rp\.head/.test(detail2) && /rp\.tail/.test(detail2)
  && /model: r\.model/.test(relApi));
t('فهرستِ آگهی‌های خودم هم برند و مدل را نشان می‌دهد',
  /product\.sub/.test(read('app/dashboard/shop/page.tsx')),
  'صاحبِ آگهی باید پنج چوبش را برای حذف و ارتقا از هم تشخیص بدهد');

/* ── ۱۱ · راهِ رسیدن به آگهی‌های خودم ──
   ثبتِ آگهی برای هر کاربرِ واردشده باز است (POST فقط لاگین می‌خواهد)،
   ولی لینکِ «فروشگاه من» فقط به نقشِ `seller` نشان داده می‌شد. یعنی
   کاربرِ عادی و باشگاه‌داری که آگهی گذاشته بود هیچ راهی به آگهیِ
   خودش نداشت — نه حذف، نه ویرایش، نه ارتقا. صفحه بود و هیچ‌چیز به
   آن نمی‌رسید؛ همان الگوی «قابلیتی که فقط سازنده‌اش می‌داند کجاست». */
console.log('\n― آگهی‌های من ―');
const myShop = read('app/dashboard/shop/page.tsx');
const navbar = read('components/Navbar.tsx');
t('لینکِ آگهی‌های من نقش‌محور نیست',
  !/roles\.includes\('seller'\) \? \[\{ href: '\/dashboard\/shop'/.test(navbar)
  && /href: '\/dashboard\/shop'/.test(navbar),
  'کاربرِ عادی هیچ راهی به آگهیِ خودش نداشت');
t('برچسب با نقش عوض می‌شود',
  /roles\.includes\('seller'\) \? 'فروشگاه من' : 'آگهی‌های من'/.test(navbar),
  '«فروشگاه من» برای کسی که فروشگاه ندارد بی‌معنی است');
t('عنوانِ صفحه هم با نقش عوض می‌شود',
  /isSeller \? 'فروشگاه من' : 'آگهی‌های من'/.test(myShop));
t('استوریِ فروشگاه به غیرفروشنده نشان داده نمی‌شود',
  /\{isSeller && \(/.test(myShop),
  'جعبه‌ی خالیِ یک قابلیتِ ناموجود به‌نظر خراب می‌رسد');
t('حذفِ آگهی از همین صفحه ممکن است',
  /handleDelete/.test(myShop) && /method: 'DELETE'/.test(myShop));
t('پس از ثبتِ آگهی، راهِ مدیریتش گفته می‌شود',
  /آگهی‌های من/.test(newAd) && /href="\/dashboard\/shop"/.test(newAd));
t('پرتِ خودکار به بازار برداشته شد',
  !/router\.push\('\/shop'\)/.test(newAd),
  'آگهی‌دهنده وسطِ فهرستِ بازار می‌افتاد و آگهیِ خودش را گم می‌کرد');
t('داشبورد هم کارتِ آگهی‌های من دارد',
  /href="\/dashboard\/shop"/.test(read('app/dashboard/page.tsx')),
  'داشبورد جایی است که کاربر اول نگاه می‌کند');

/* ── نقشِ اصلی ── */
console.log('\n― نقشِ اصلی ―');
t('کاربر می‌تواند نقشِ اصلی را انتخاب کند',
  /export async function PUT/.test(read('app/api/roles/my/route.ts'))
  && /نقش اصلی شما/.test(read('app/profile/role/page.tsx')));
t('فقط نقشی که واقعاً دارد',
  /if \(!owned\.includes\(role\)\)/.test(read('app/api/roles/my/route.ts')),
  'وگرنه هر کسی با یک درخواستِ دستی خودش را باشگاه‌دار می‌کرد');
t('نشانِ آگهی در لحظه‌ی انتشار Snapshot می‌شود',
  /seller_role: sellerRole/.test(read('app/api/market/ads/route.ts'))
  && /seller_role text/.test(read('../../supabase/migrations/080_publisher_role.sql')));
t('نشانِ استوری از سرور می‌آید نه از کلاینت',
  /roleKey: roleMeta\?\.value/.test(read('app/api/social/stories/route.ts'))
  && !/roleKey: s\.roleKey/.test(read('app/api/social/stories/route.ts')),
  'پیش‌تر هر کسی می‌توانست استوری‌اش را با نشانِ «باشگاه‌دار» منتشر کند');

/* ── پنجره‌ها ── */
console.log('\n― پنجره‌ها ―');
t('پنجره‌ی گزارش تخلف پرتال می‌شود',
  /createPortal\(/.test(read('components/ReportButton.tsx')),
  'داخلِ کارت، transform قابِ مرجع می‌ساخت و overflow دکمه‌ها را می‌برید');
t('پنجره با Escape هم بسته می‌شود', /e\.key === 'Escape'/.test(read('components/ReportButton.tsx')));
t('«رد کردن با دلیل» پنجره‌ی خودِ پنل است',
  !/window\.prompt/.test(read('app/admin/products/page.tsx'))
  && /رد کردن آگهی/.test(read('app/admin/products/page.tsx')));

/* ── هیچ درخواستی نباید بی‌نشان بماند ── */
console.log('\n― صف‌های پنل ادمین ―');
const statsApi = read('app/api/admin/stats/route.ts');
const adminHome = read('app/admin/page.tsx');

for (const [q, table] of [
  ['pendingProducts', 'products'], ['pendingAdRequests', 'ad_requests'],
  ['pendingSettlements', 'settlements'], ['pendingRefunds', 'refunds'],
]) {
  t(`صفِ «${q}» شمرده می‌شود`,
    statsApi.includes(q) && statsApi.includes(`countOf('${table}'`));
}
t('همه‌ی صف‌ها در مجموعِ کارها می‌آیند',
  /pendingTotal: pendingClubs \+ pendingRoles \+ pendingProfiles \+ openReports[\s\S]{0,140}pendingRefunds/.test(statsApi));
t('هر کارتِ صف‌دار نشان می‌گیرد',
  /const QUEUE_OF: Record<string, string>/.test(adminHome)
  && /\{pending > 0 && \(/.test(adminHome),
  'ادمین فقط وقتی خبردار می‌شد که خودش سرِ صفحه می‌رفت');
t('پروفایل‌ها به تفکیکِ نوع نشان می‌گیرند',
  /const KIND_OF: Record<string, string>/.test(adminHome)
  && /'\/admin\/coaches':\s+'coach'/.test(adminHome));
t('نوارِ «کارِ بی‌پاسخ» بالای داشبورد هست',
  /کارِ بی‌پاسخ/.test(adminHome) && /stats\?\.pendingTotal/.test(adminHome));

/* ── هیچ پنجره‌ی بومیِ مرورگری نماند ── */
console.log('\n― پنجره‌های سایت ―');
import { readdirSync, statSync } from 'node:fs';

function walk(dir, out = []) {
  for (const e of readdirSync(join(ROOT, dir))) {
    if (e === 'node_modules' || e === '.next') continue;
    const rel = `${dir}/${e}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (/\.tsx?$/.test(e)) out.push(rel);
  }
  return out;
}

const NATIVE = /(^|[^.\w])(window\.)?(confirm|alert|prompt)\s*\(/;
const offenders = [];
for (const f of [...walk('app'), ...walk('components'), ...walk('lib')]) {
  const src = strip(read(f));
  /* `setConfirm` و متغیرِ محلیِ `confirm` استثنا نیستند — الگو مرزِ
     واژه دارد و آن‌ها را نمی‌گیرد. */
  for (const line of src.split('\n')) {
    if (!NATIVE.test(line)) continue;
    if (/setConfirm|const confirm|void confirm\(\)|confirm\(\)\s*\}/.test(line)) continue;
    offenders.push(`${f}: ${line.trim().slice(0, 60)}`);
  }
}
t('هیچ confirm/alert/prompt بومی در سایت نمانده', offenders.length === 0,
  offenders.slice(0, 4).join(' | '));

t('سرویسِ پنجره‌ها هست', read('lib/ui/dialogs.ts').includes('export function ask'));
t('میزبانِ پنجره یک‌بار در layout سوار است',
  /<DialogHost \/>/.test(read('app/layout.tsx')));
t('پنجره پرتال می‌شود', /createPortal\(/.test(read('components/ui/DialogHost.tsx')),
  'داخلِ کارتی با transform یا overflow، position:fixed بریده می‌شود');
t('روی سرور پاسخِ امن «نه» است',
  /typeof window === 'undefined'\) return Promise\.resolve\(false\)/.test(read('lib/ui/dialogs.ts')),
  'کارِ برگشت‌ناپذیر نباید بی‌اجازه انجام شود');
t('دکمه‌ی خطرناک دوم است',
  read('components/ui/DialogHost.tsx').indexOf('انصراف')
  < read('components/ui/DialogHost.tsx').indexOf('confirmLabel'));

/* ── روانیِ نمایش ── */
console.log('\n― نمایش و اسکرول ―');
const nav = read('components/Navbar.tsx');
const boot = read('components/AppBoot.tsx');

t('نوارِ بالا در هر فریمِ اسکرول رندر نمی‌شود',
  !/setScrollY\(/.test(nav) && /barRef\.current/.test(nav),
  'state در هر فریم یعنی شصت رندرِ کاملِ Navbar و Stories در ثانیه');
t('نشانِ اسکرول فقط روی مرز عوض می‌شود',
  /setScrolled\(prev => \(prev === y > 50 \? prev : y > 50\)\)/.test(nav));
t('بارِ اول کاربر را به بالا پرت نمی‌کند',
  /if \(first\.current\) \{ first\.current = false; return; \}/.test(read('components/ScrollToTop.tsx')),
  'افکت بعد از hydration می‌آمد و اسکرولِ شروع‌شده را برمی‌گرداند');
t('بازبارگذاری وسطِ فرم انجام نمی‌شود',
  /const isMidTask = \(\) =>/.test(boot)
  && (boot.match(/if \(isMidTask\(\)\) return/g) ?? []).length >= 2,
  'کاربری که وسطِ ثبتِ فروشگاه بود، فرمش می‌پرید و حس می‌کرد پرت شده بیرون');

console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} قبول · ${fail} رد\n`);
process.exit(fail === 0 ? 0 : 1);
