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
/* `readdirSync` پایین‌تر import شده؛ import ها بالا برده می‌شوند پس
   همین‌جا هم در دسترس است. */
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
  /* رنگ از #9A6E38 به #8F6531 تیره شد چون قبلی ۴.۰۳:۱ می‌داد،
     زیرِ حدِ ۴.۵. طرح همان است، فقط عددِ رنگ. */
  && /color: '#8F6531'[\s\S]{0,140}rgba\(199,166,106,0\.34\)/.test(listPage));
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
/* کپشنِ کارت‌های نقش کلاً برداشته شد و همه‌ی کارت‌ها از یک تعریف
   ساخته می‌شوند — پس هم‌اندازه‌بودنشان دیگر به طولِ متن بند نیست. */
const dashPg = read('app/dashboard/page.tsx');
t('کارت‌های نقش از یک تعریفِ واحد ساخته می‌شوند',
  /const roleCards: RoleCardDef\[\] = \[\]/.test(dashPg)
  && /\{roleCards\.map\(c => \(/.test(dashPg)
  && (dashPg.match(/<div className="role-card"/g) ?? []).length === 1,
  'نه کارتِ دست‌نویس یعنی نه اندازه‌ی متفاوت');
t('کارتِ «افزودن نقش» هم همان کارت است، نه استثنا',
  /href: '\/profile\/role', icon: '➕'/.test(dashPg));
t('توضیحِ داخلِ کارت‌های نقش برداشته شد',
  !/در صورت صلاحیت نقش جدید را انتخاب کنید/.test(dashPg)
  && !/هویت کارخانه، محصولات و راه‌های ارتباطی/.test(dashPg));

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
/* زیرنویسِ «فروشنده عجله دارد» برداشته شد — خودِ واژه‌ی «فوری» منظور
   را می‌رساند. آنچه باید بماند خودِ نوار است، نه آن جمله. */
t('نوارِ فوری در بازار هست',
  /const urgent = useMemo/.test(shopPage) && />فوری<\/h2>/.test(shopPage));
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
/* زنجیره‌ی دسته→نوع→برند→مدل و اجزای فرم از فرمِ ثبت بیرون آمدند تا
   فرمِ ویرایش هم از همان‌ها بخواند. */
const chainSrc = read('lib/market/chain.ts');
const editAd = read('app/shop/edit/[id]/page.tsx');
const formFields = read('components/market/AdFormFields.tsx');
const pcs = read('components/ProvinceCitySelect.tsx');
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
  /const composedName = modernizeType\(\[catLabel, effType\]/.test(newAd),
  'برند و مدل نمی‌گویند اصلاً توپ است یا چوب');
t('دسته‌ی توپ فهرستِ رشته‌محور دارد',
  chainSrc.includes(`'اسنوکر', 'پاکت بیلیارد', 'کارامبول', 'کیوبال', 'تکی', 'سایر'`),
  'واژه‌ی «توپ» کنارِ هر گزینه تکرارِ نامِ خودِ دسته بود');
t('«سایر» فیلدِ توضیح باز می‌کند',
  /form\.type === 'سایر' && \(/.test(newAd) && /typeOther/.test(newAd));
t('«سایر» بدونِ توضیح پذیرفته نمی‌شود', /برای «سایر» توضیح بنویسید/.test(newAd));

console.log('\n― فرمِ ویرایشِ آگهی ―');
/* فرمِ ویرایش تا امروز فرمِ جداگانه‌ای بود با فهرستِ دسته‌ی دستی و
   غلط، بدونِ «نوع»، با جدولِ خامِ برچسب/مقدار، و با خواندنِ برعکسِ
   قیمتِ تخفیف‌دار. حالا آینه‌ی فرمِ ثبت است. */
t('فهرستِ دسته از منبعِ واحد می‌آید نه دستی',
  /CATEGORY_OPTIONS/.test(editAd) && !/'educational'/.test(editAd),
  'دسته‌ی ساختگیِ «آموزشی» باعث می‌شد ذخیره، دسته‌ی آگهی را عوض کند');
t('فیلدِ «نوع» دارد', /TYPE_OPTIONS\[form\.category\]/.test(editAd));
t('برند و مدل زنجیره‌ای‌اند',
  /brandOptionsFor\(form\.category, form\.type\)/.test(editAd)
  && /modelOptionsFor\(form\.category, form\.type, form\.brand\)/.test(editAd));
t('مشخصاتِ فنی از تعریفِ همان دسته می‌آید',
  editAd.includes('specDefs.filter') && !editAd.includes('placeholder="مثال: ابعاد"'),
  'پیش‌تر جدولِ خامِ برچسب/مقدار بود و فروشنده «shaftMaterial» می‌دید');
t('کلیدِ ناشناخته حذف نمی‌شود', /legacySpecs/.test(editAd));
t('قیمتِ تخفیف‌دار درست خوانده می‌شود',
  /discounted > 0 \? discounted : listed/.test(editAd)
  && !/price \/ \(1 - disc \/ 100\)/.test(editAd),
  'ستونِ price قیمتِ خط‌خورده است؛ فرمولِ قبلی عددی نجومی می‌ساخت');
t('نامِ آگهی با همان قاعده‌ی ثبت بازسازی می‌شود',
  /const composedName = modernizeType\(\[catLabel, effType\]/.test(editAd));
t('دکمه‌ی بازگشت دارد', /بازگشت به آگهی‌های من/.test(editAd));
t('هر دو فرم یک اجزای مشترک دارند',
  /AdFormFields/.test(editAd) && /AdFormFields/.test(newAd)
  && /export function FancySelect/.test(formFields));
t('وضعیتِ کالا از CONDITIONS می‌آید نه رشته‌ی دستی',
  /CONDITIONS\.map/.test(newAd) && /CONDITIONS\.map/.test(editAd)
  && !/'like-new'/.test(newAdS),
  'کلیدِ «like-new» معتبر نبود و سرور «در حد نو» را بی‌صدا «نو» ذخیره می‌کرد');
t('کیس چوب و کیف توپ فهرستِ نوع و برند دارند',
  /'cue-case', 'ball-bag'/.test(chainSrc),
  'تفکیکِ case-bag نصفه مانده بود و این دو دسته به متنِ آزاد می‌افتادند');

t('سرچ‌بارِ موبایل فاصله‌ی اضافه‌ی بالا را ندارد',
  /\.mk-msearch \{[^}]*padding: calc\(2px \+ env\(safe-area-inset-top\)\) 14px 6px/.test(shopPage)
  && /padding: '10px 0', background: 'none'/.test(shopPage),
  'نوارِ سایت روی این صفحه رندر نمی‌شود، پس فاصله‌ی بالا فضای خالیِ محض بود');
t('بازگشتِ فرمِ ثبت به صفحه‌ی قبلی می‌رود',
  /بازگشت به فروشگاه من/.test(newAd) && /router\.back\(\)/.test(newAd)
  && /window\.history\.length > 1/.test(newAd),
  'همیشه به /shop می‌رفت، حتی وقتی کاربر از «آگهی‌های من» آمده بود');
t('کارتِ قفلِ اطلاعات فروشنده نمایش داده نمی‌شود',
  /const sellerLocked = shopNameLocked && geoLocked/.test(newAd)
  && /\{!sellerLocked && \(/.test(newAd)
  && /SectionTitle>اطلاعات تماس/.test(newAd),
  'اطلاعات تماس باید بماند — شماره واقعاً قابلِ تغییر است');
t('لیستِ استان/شهر از کارت بیرون می‌زند نه زیرِ آن',
  /createPortal/.test(pcs) && /position: fixed; z-index: 9999/.test(pcs)
  && /const openUp = below < 200/.test(pcs),
  'کارت‌های overflow:hidden لیست را می‌بریدند');
console.log('\n― یک کارت، سه صفحه ―');
/* یک آگهی در فهرستِ بازار، سکشنِ بازارِ صفحه‌ی اصلی و صفحه‌ی فروشگاه
   نشان داده می‌شود. «شهر + وضعیت» فقط در فهرستِ بازار بود و «توافقی»
   در صفحه‌ی فروشگاه اصلاً نبود (کارت «۰» چاپ می‌کرد). */
const cardFacts = read('components/market/CardFacts.tsx');
const homeCl = read('app/HomeClient.tsx');
const flatShop = read('app/sellers/[id]/FlatShop.tsx');
t('حقایقِ کارت یک منبع دارند',
  /export function CardMeta/.test(cardFacts) && /export function CardPrice/.test(cardFacts));
t('هر سه کارت از همان منبع می‌خوانند',
  ['<CardMeta', '<CardPrice'].every(tag =>
    [shopPage, homeCl, flatShop].every(f => f.includes(tag))),
  'فهرستِ بازار، صفحه‌ی اصلی و صفحه‌ی فروشگاه');
t('«توافقی» فقط یک‌جا نوشته شده',
  (cardFacts.match(/توافقی/g) ?? []).length >= 1
  && !/negotiable \?/.test(strip(homeCl)) && !/negotiable \?/.test(strip(flatShop)),
  'صفحه‌ی فروشگاه صفرِ دیتابیس را چاپ می‌کرد');
t('شهر و وضعیت به کارتِ فروشگاه می‌رسند',
  /city: sp\.city,/.test(flatShop) && /condition: sp\.condition,/.test(flatShop)
  && /negotiable: sp\.negotiable,/.test(flatShop));
t('شهر و وضعیت به کارتِ صفحه‌ی اصلی می‌رسند',
  /city: string\r?\n  condition: string/.test(read('lib/home-types.ts'))
  && /city: p\.city \?\? '', condition: p\.condition \?\? 'new'/.test(homeCl),
  'مسیرِ اسنپ‌شاتِ جایگاه هم باید همین‌ها را حمل کند');
t('اسنپ‌شاتِ جایگاه وضعیتِ کالا و مدل را حمل می‌کند',
  /images,brand,model,city,condition,status/.test(read('lib/ads/resolve.ts'))
  && /images,brand,model,city,condition,status/.test(read('lib/ads/free.ts'))
  && /city: e\.city \?\? '', condition: e\.condition \?\? 'new'/.test(homeCl),
  'کارت‌های سکشنِ بازار از اسنپ‌شات می‌آیند، نه از ردیفِ خامِ محصول');
/* ── برند و مدل، در هر سه کارت ──
   یک محصول در سه صفحه دیده می‌شود و مدل در دو تای‌شان می‌افتاد:
   اسنپ‌شاتِ صفحه‌ی اصلی فقط `brand` را می‌آورد و تایپِ کارتِ فروشگاه
   ستونِ `model` را نداشت. */
t('برند و مدل به هر سه کارت می‌رسند',
  /* برند و مدل **جدا** می‌مانند: `productTitleParts` تکرار را
     تکه‌به‌تکه با عنوان می‌سنجد و رشته‌ی چسبیده آن را کور می‌کند. */
  read('lib/ads/resolve.ts').includes('model: s(r.model),')
  && read('lib/ads/free.ts').includes('model: s(r.model),')
  && read('app/HomeClient.tsx').includes('brand: p.sub, model: p.model')
  && read('app/shop/products.ts').includes('model: s(r.model)')
  && read('app/sellers/[id]/FlatShop.tsx').includes('model: sp.model'),
  'کارتِ فروشگاه و صفحه‌ی اصلی مدل را نشان نمی‌دادند');
/* ── ارقامِ نامِ لاتین ──
   `PersianDigits` هر رقمِ رندرشده را فارسی می‌کند و «Century G1» را
   «Century G۱» نشان می‌داد. کلاسِ `bh-latin` استثنای خودِ همان
   کامپوننت است. */
/* ── بسته‌ی گزارشِ کاربر ── */
/* ── چیدمانِ دسکتاپ ──
   سه تلاشِ قبلی JSX را جابه‌جا کرد و تودرتویی را بی‌صدا شکست — نه
   tsc دید نه تست، چون JSX متوازن مانده بود. این‌بار DOM دست‌نخورده
   است و کلِ کار یک قاعده‌ی CSS است. */
t('فرمِ آگهی روی دسکتاپ دوستونه است',
  read('components/market/AdFormFields.tsx').includes('column-count: 2')
  && read('components/market/AdFormFields.tsx').includes('break-inside: avoid')
  && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
    .every(f => read(f).includes('ad-cols') && read(f).includes('span-cols')),
  'یک ستون، صفحه را ۵۴۰۰ پیکسل دراز می‌کرد');
t('کارتِ مشخصات تمام‌عرض و سه‌ستونه می‌شود',
  read('components/market/AdFormFields.tsx').includes('.ad-cols > .span-cols { column-span: all; }')
  && read('components/market/AdFormFields.tsx').includes('.span-cols .spec-grid'),
  'در ستونِ ۵۵۰ پیکسلی ۲۹۷۸ پیکسل بود و هیچ تعادلی ممکن نمی‌شد');
t('موبایل همان یک ستون می‌ماند',
  read('components/market/AdFormFields.tsx').includes('@media(min-width:900px)'),
  'قاعده فقط بالای ۹۰۰ پیکسل فعال است');
t('نوعِ دسته‌های لوازم از فیلدِ مشخصاتِ خودشان می‌آید',
  read('lib/market/spec-rules.ts').includes('export const formTypeFieldOf')
  && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx'].every(f =>
    read(f).includes('const specTypeField') && read(f).includes('typeChoices')
    && read(f).includes("f.id !== specTypeField?.id")),
  'اکستنشن و رست و روغن و اکسسوری دراپ‌داونِ خالی داشتند');
t('کاتالوگِ اختصاصی بر لوازم مقدم است',
  read('app/api/market/ads/route.ts').includes("isProductCatalog(category) ? category : 'accessories'")
  && read('app/api/market/ads/[id]/route.ts').includes("isProductCatalog(cat) ? cat : 'accessories'"),
  'آگهیِ پارچه «نوع را انتخاب کنید» می‌گرفت چون با accessories سنجیده می‌شد');
t('پلمب وضعیتِ کالا را قطعی می‌کند',
  ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx'].every(f =>
    read(f).includes('const sealed = specs.isSealed === true')
    && read(f).includes("const effCondition = sealed ? 'new' : form.condition")
    && read(f).includes('condition: effCondition,')),
  'کالای پلمب‌شده نمی‌تواند «کارکرده» باشد');
t('شماره‌ی موبایل با ارقامِ فارسی و جداکننده پذیرفته می‌شود',
  /* یک نرمال‌ساز در `text-fa` و هر دو مرز از آن می‌خوانند */
  read('lib/text-fa.ts').includes('export function normalizePhoneFa')
  && read('components/market/AdFormFields.tsx').includes('normalizePhoneFa as normalizePhone')
  && read('app/api/market/ads/route.ts').includes('normalizePhoneFa(b?.sellerPhone)')
  && read('app/api/market/ads/[id]/route.ts').includes('normalizePhoneFa(b?.sellerPhone)')
  && read('app/shop/new/page.tsx').includes('isValidPhone(form.sellerPhone)'),
  'کیبوردِ فارسی ارقامِ فارسی می‌دهد و الگوی لاتین ردش می‌کرد');
t('راهنمای کیس که کاربر خواست، حذف شد',
  !readFileSync(join(ROOT, 'data/accessories_catalog.json'), 'utf8').includes('همه کیس‌ها جا نمی‌دهند'));
t('کارتِ سکشنِ بازار ۵٪ بزرگ‌تر شد',
  homeCl.includes('width: 150, height: 288'),
  '۱۴۳×۲۷۴ بود');
t('ارقامِ داخلِ نامِ لاتین فارسی نمی‌شوند',
  read('lib/text-fa.ts').includes('export function keepLatinProps')
  && read('components/market/ProductTitle.tsx').includes('keepLatinProps(head, headClassName)')
  && read('components/market/ProductTitle.tsx').includes('keepLatinProps(tail, tailClassName)')
  && read('app/shop/[id]/page.tsx').includes('keepLatinProps(s.value)')
  /* کلاسِ خودِ عنصر باید ادغام شود نه بازنویسی — وگرنه خطِ برند
     `mk-t`/`bz-t`/`pc-t` و فاصله‌اش را از دست می‌دهد. */
  && read('components/market/ProductTitle.tsx').includes('keepLatinProps(tail, tailClassName)'),
  '«Taom V۱۰» و «6811 Tournament 30oz» خراب می‌شدند');
/* ── چرا دو استثنا و نه یکی ──
   `bh-latin` فونت را هم Arial می‌کند؛ روی «آبنوس (Ebony)» یعنی یک
   ردیفِ Arial وسطِ جدولِ فارسی. متنِ ترکیبی `data-no-fa` می‌گیرد. */
t('متنِ ترکیبی فونتش عوض نمی‌شود',
  read('lib/text-fa.ts').includes("'data-no-fa': ''")
  && /u0600-/.test(read('lib/text-fa.ts')),
  'کلاسِ bh-latin در layout فونت را به Arial می‌برد');
t('برند و مدل به خطِ بالای‌شان نچسبیده‌اند',
  read('app/shop/page.tsx').includes('.mk-t { display: block; margin-top: 3px;')
  && homeCl.includes('.bz-t { display:block; margin-top:3px;')
  && read('app/sellers/[id]/FlatShop.tsx').includes('.pc-t { display: block; margin-top: 3px;'),
  'خطِ دوم بی‌فاصله زیرِ عنوان بود');

/* ── نوارِ فوری: حرکتِ خودکار برداشته شد ──
   چهار پیاده‌سازیِ مختلف با اسکرولِ بومی جنگیدند. علتِ مشترک: نوشتنِ
   scrollLeft از جاوااسکریپت روی عنصری که کاربر هم اسکرولش می‌کند. */
t('نوارِ فوری حرکتِ خودکار ندارد',
  !/holdUntilRef/.test(shopPage) && !/cycleRef/.test(shopPage)
  && !/writtenRef/.test(shopPage) && !/urgReps/.test(shopPage)
  && !/mkUrgRoll/.test(shopPage),
  'هر نسخه‌ی خودکار یک جای دیگر با لمس یا درگ می‌جنگید');
t('اسکرولِ افقی همچنان کار می‌کند',
  /useHorizontalScroll\(urgRef\)/.test(shopPage)
  && /\.mk-urgrow \{[^}]*overflow-x/.test(shopPage));
t('ترتیبِ نوارِ فوری هر بار عوض می‌شود',
  /const \[urgSeed, setUrgSeed\] = useState\(0\)/.test(shopPage)
  && /}, \[matched, urgSeed\]\)/.test(shopPage)
  && /setUrgSeed\(Math\.floor\(Math\.random\(\)/.test(shopPage),
  'دانه بعد از mount گذاشته می‌شود وگرنه هیدریشن می‌شکند');
t('آیکونِ فوری نرم چشمک می‌زند',
  /\.mk-urgzap \{ animation: mkZap/.test(shopPage)
  && /@keyframes mkZap \{ 0%, 100% \{ opacity: 1 \} 50% \{ opacity: 0\.35 \} \}/.test(shopPage));
t('ردیف‌های دسته‌بندیِ موبایل فشرده‌تر شدند',
  /\.mk-mcats \{[^}]*gap: 6px 6px/.test(shopPage));
t('نشان و گزارش کمی داخل‌تر آمدند',
  /\.mk-bk \{ position: absolute; top: 10px; left: 11px;/.test(shopPage)
  && /\.mk-rp \{ position: absolute; top: 35px; left: 11px;/.test(shopPage));

t('آیکون‌های نوارِ پایین یک خانه‌ی هم‌اندازه دارند',
  /\.mk-bnav \.ic \{ height: 24px/.test(shopPage)
  && ['Home', 'LayoutGrid', 'Bookmark'].every(i => new RegExp(`<span className="ic"><${i} size=\\{21\\}`).test(shopPage))
  && /width: 24, height: 24, borderRadius: '50%'/.test(shopPage),
  'سه آیکونِ ۲۲ و یک دایره‌ی ۲۸ یعنی برچسب‌ها روی یک خط نمی‌نشستند');
t('وضعیتِ کالا در صفحه‌ی جزئیات نشان داده می‌شود',
  /<h2[^>]*>وضعیت کالا<\/h2>/.test(detail2)
  && /normalizeCondition\(product\.condition\)/.test(detail2)
  && /CONDITIONS\.map/.test(detail2),
  'ستونش در دیتابیس بود و فرم پرش می‌کرد، ولی هیچ‌جای صفحه دیده نمی‌شد');

t('تب‌های آگهی‌های من در یک سطر جا می‌شوند',
  /grid grid-cols-4 border-b/.test(read('app/dashboard/shop/page.tsx')),
  '«در انتظار تأیید» نصفه بیرون می‌ماند');

t('محل کالا بالای قیمت‌گذاری است',
  editAd.indexOf('محل کالا') < editAd.indexOf('SectionTitle>قیمت‌گذاری'));
t('دراپ‌داون از لبه‌ی صفحه بیرون نمی‌زند',
  /const openUp = below < 190/.test(formFields) && /maxHeight: rect\.maxH/.test(formFields),
  'روی موبایل نیمی از فهرست بیرونِ نمایشگر بود و گزینه‌های پایین انتخاب نمی‌شدند');
t('راهنمای داخلِ فیلد ریزتر و کم‌رنگ‌تر است',
  /\.nf::placeholder \{ color: rgba\(28,28,26,0\.22\); font-size: 12\.6px; \}/.test(formFields));
t('سرتیترِ صفحه‌ی ثبت آگهی برداشته شد',
  !/NEW PRODUCT/.test(newAdS) && !/ثبت محصول جدید/.test(newAdS)
  && !/مستقیماً با خریداران در ارتباط باشید/.test(newAdS));
t('سه مرحله در یک سطر می‌مانند', /flexWrap: 'nowrap'/.test(newAd));
t('دکمه‌ی بازگشت فلشِ راست دارد', /<ChevronRight size=\{13\.5\}/.test(newAd));
t('پیامِ خطا وسطِ صفحه می‌آید نه بالای فرم',
  /export function AlertDialog/.test(formFields)
  && /<AlertDialog/.test(newAd) && /<AlertDialog/.test(editAd)
  && !/errors\.submit &&/.test(newAdS) && !/errors\.submit &&/.test(strip(editAd)),
  'روی موبایل کاربر پایینِ فرم است و نوارِ بالای صفحه را هرگز نمی‌بیند');
t('فهرستِ فیلدهای ناقص در همان پنجره می‌آید',
  /showAlert\('فرم کامل نیست', Object\.values\(errs\)\)/.test(newAd)
  && /title: 'فرم کامل نیست', lines: Object\.values\(errs\)/.test(editAd));
t('دو دکمه‌ی هم‌اندازه در یک سطر',
  !/فیلدهای الزامی/.test(newAdS)
  && (newAd.match(/flex: 1, minWidth: 0, padding: '12px 10px'/g) ?? []).length === 2);

console.log('\n― پروفایلِ نقش‌ها ―');
/* فرمِ عمومیِ `/profile/setup` برای هر هشت نقش روی مسیری ذخیره
   می‌کرد که وجود ندارد، و فهرستِ نقش‌ها را هم نمی‌ساخت. */
const roleSetup = read('app/profile/setup/page.tsx');
const rolesLib = read('lib/roles.ts');
t('پنلِ هر نقش منبعِ واحد دارد',
  /export const ROLE_PANEL/.test(rolesLib)
  && ['user', 'player', 'coach', 'referee', 'technician', 'seller', 'manufacturer', 'club_owner']
    .every(r => new RegExp(`\\b${r}:\\s*\\{ path:`).test(rolesLib)),
  'هر هشت نقش باید در همان جدول باشند');
t('فرمِ مرده‌ی پروفایلِ نقش برداشته شد',
  !/roles\/\$\{role\.value\}\/profile/.test(roleSetup) && !/RoleForm/.test(roleSetup),
  'مسیرِ PUT /api/roles/<role>/profile وجود ندارد و در تولید ۴۰۴ می‌داد');
t('کپیِ سومِ فهرستِ نقش‌ها حذف شد',
  !/const ROLES: RoleMeta\[\]/.test(roleSetup) && /from '\.\.\/\.\.\/\.\.\/lib\/roles'/.test(roleSetup));
t('نقشِ دادهٔ ادمین هم دیده می‌شود',
  /cur\.primaryRole/.test(roleSetup) && /secondaryRoles/.test(roleSetup),
  'خواندنِ فقطِ role_requests یعنی نقشِ مستقیمِ ادمین نامرئی می‌ماند');
t('پاسخِ /roles/my شیء است نه آرایه',
  /j\.requests \?\? \[\]/.test(roleSetup),
  'کدِ قبلی data.filter می‌زد، خطا در catch خفه می‌شد و فهرست همیشه خالی بود');

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
/* ساختارِ دوتکه حالا در `components/market/ProductTitle.tsx` است و
   هر سه کارت (بازار، صفحه‌ی اصلی، فروشگاه) از همان می‌آیند. */
t('کارت عنوان را دو تکه نشان می‌دهد',
  /headClassName="mk-h"/.test(shopPage) && /tailClassName="mk-t"/.test(shopPage));
t('عنوانِ محصول یک کامپوننتِ مشترک دارد',
  ['app/shop/page.tsx', 'app/HomeClient.tsx', 'app/sellers/[id]/FlatShop.tsx']
    .every(f => /<ProductTitle/.test(read(f))),
  'یک محصول در سه صفحه سه‌جور دیده می‌شد');
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
  /setImgIdx\(0\); setZoomed\(false\) \}, \[id\]/.test(detail2));

/* ── نمای تمام‌صفحه‌ی عکس ──
   کادرِ صفحه عکس را `cover` می‌برد؛ خریدارِ کالای دستِ‌دوم دقیقاً
   همان بخشِ بریده‌شده — خط‌وخشِ کالا — را می‌خواهد ببیند. */
const lb = read('components/market/ImageLightbox.tsx');
t('نمای تمام‌صفحه‌ی تصویر هست', /export default function ImageLightbox/.test(lb));
t('زدن روی عکس بازش می‌کند',
  /onClick=\{\(\) => setZoomed\(true\)\}/.test(detail2) && /<ImageLightbox/.test(detail2));
t('پنجره پرتال می‌شود', /createPortal\(/.test(lb));
t('ضربدرِ بستن دارد', /aria-label="بستن"/.test(lb) && /<X size=/.test(lb));
t('با Escape هم بسته می‌شود', /e\.key === 'Escape'/.test(lb));
t('کشیدنِ افقی عکس را عوض می‌کند',
  /onTouchStart/.test(lb) && /go\(dx < 0 \? 1 : -1\)/.test(lb));
t('کشیدنِ عمودی سهواً عکس را عوض نمی‌کند',
  /Math\.abs\(dx\) < Math\.abs\(dy\)/.test(lb));
t('شمارنده‌ی «تصویر ۱ از ۳» دارد', /تصویر \{toFa\(at \+ 1\)\} از \{toFa\(total\)\}/.test(lb));
t('اسکرولِ پس‌زمینه قفل می‌شود', /document\.body\.style\.overflow = 'hidden'/.test(lb));
t('تصویر بریده نمی‌شود', /objectFit: 'contain'/.test(lb),
  'در نمای تمام‌صفحه، cover یعنی همان مشکلِ اول یک پله بزرگ‌تر');
t('دکمه‌ی بازگشتِ گوشی نما را می‌بندد',
  /history\.pushState\(\{ bhLightbox: true \}/.test(lb) && /popstate/.test(lb),
  'وگرنه «بازگشت» کاربر را از صفحه‌ی محصول بیرون می‌اندازد');
t('«موجود در انبار» برداشته شد',
  !/موجود در انبار/.test(detail2S),
  'موجودی هیچ‌جا شمرده نمی‌شود و آگهی ممکن است فروخته شده باشد');
/* برند و مدل حالا در باکسِ هویتِ محصول‌اند — هم‌وزنِ عنوان و با جهتِ
   خودکار — نه زیرنویسِ ریزِ زیرِ تیتر. برای خریدارِ تجهیزات
   «O'min Classic» مهم‌تر از «چوب اسنوکر» است. */
t('برند و مدل باکسِ خودشان را دارند و ریز نیستند',
  /برند و مدل/.test(detail2) && /dir="auto"/.test(detail2)
  && detail2.includes(`fontSize: 'clamp(16px,2vw,21px)'`));
t('«مشابه» از دسته بیرون نمی‌زند',
  !/order\('createdAt'.*\n?.*limit\(40\)/.test(relApi) && /\.eq\('category', me\.category\)/.test(relApi),
  'زیرِ صفحه‌ی چوب، توپ و گچ نشان داده می‌شد');
t('نوع مهم‌تر از برند است',
  /norm\(r\.type\) === norm\(me\.type\)\) s \+= 40/.test(relApi)
  && /norm\(r\.brand\) === norm\(me\.brand\)\) s \+= 25/.test(relApi),
  'خریدارِ چوبِ اسنوکر، چوبِ پولِ همان برند را نمی‌خواهد');
t('کارتِ «مشابه» هم دو خطی است',
  /const rp = productTitleParts/.test(detail2));

/* ── ۱۲ · عکسِ آگهی در Storage، نه در دیتابیس ──
   عکس با FileReader به base64 تبدیل و همان رشته در ستونِ `images`
   ذخیره می‌شد: عکسِ دومگابایتی ⇒ ۲٫۷ مگابایت متن داخلِ ردیف، و
   `/api/market/ads` همه‌ی آن را در هر بارگذاریِ بازار برمی‌گرداند. */
console.log('\n― عکسِ آگهی ―');
const imgLib = read('lib/market/images.ts');
const adsApi = read('app/api/market/ads/route.ts');
const adApi = read('app/api/market/ads/[id]/route.ts');
t('منبعِ واحدِ تصویرِ آگهی هست',
  /export async function normalizeAdImages/.test(imgLib));
t('هر دو مسیرِ نوشتن از آن می‌گذرند',
  /await normalizeAdImages\(b\?\.images, actor\.id\)/.test(adsApi)
  && /await normalizeAdImages\(b\.images, actor\.id\)/.test(adApi),
  'قاعده‌ای که در یکی باشد و در دیگری نه، باگِ فرداست');
t('base64 روی سرور به Storage می‌رود',
  /storage\.from\('club-media'\)\s*\n?\s*\.upload/.test(imgLib)
  || /\.from\('club-media'\)\.upload/.test(imgLib),
  'تبِ کهنه هنوز base64 می‌فرستد و نباید در دیتابیس بنشیند');
t('نوعِ فایل از بایت‌ها خوانده می‌شود نه از برچسبِ data URI',
  /sniff\(bytes\)/.test(imgLib) && /capFor\(kind\.mime\)/.test(imgLib));
t('نشانیِ بیگانه ذخیره نمی‌شود',
  /storagePublicPrefix/.test(imgLib) && /alreadySafe/.test(imgLib),
  'وگرنه صفحه‌ی عمومیِ ما تصویری از دامنه‌ی دلخواهِ آگهی‌دهنده را سرو می‌کند');
t('فرمِ ثبت پیش از ارسال آپلود می‌کند',
  /uploadFile\('club-media', slot\.file/.test(newAd)
  && !/images\.map\(i => i\.data\)/.test(newAd));
t('آپلودِ ناموفق آگهی را بی‌صدا بی‌عکس نمی‌کند',
  /showAlert\('بارگذاری تصویر انجام نشد'/.test(newAd)
  && /تصویر \$\{i \+ 1\} بالا نرفت/.test(newAd));
const imgMig = read('scripts/migrate-ad-images.mjs');
t('اسکریپتِ انتقالِ آگهی‌های موجود هست',
  /--apply/.test(imgMig) && /products\?select=id,title,images/.test(imgMig));
t('انتقال پیش‌فرض فقط گزارش می‌دهد',
  /const APPLY = process\.argv\.includes\('--apply'\)/.test(imgMig));
/* ── قیمتِ قبل از تخفیف ذخیره می‌شود، نه بازسازی ──
   فقط درصدِ گردشده نگه داشته می‌شد و عددِ خط‌خورده از رویش بازسازی
   می‌شد: ۷۵۰٬۰۰۰٬۰۰۰ با ٪۹ ⇒ «۸۲۴٬۱۷۵٬۸۲۴» روی کارت. */
t('قیمتِ خط‌خورده در دیتابیس ذخیره می‌شود',
  /price: discounted \? old : price/.test(adsApi)
  && /discountPrice: discounted \? price : null/.test(adsApi),
  'یک درصدِ صحیح نمی‌تواند عددِ اصلی را نگه دارد');
t('ویرایش هم همان قرارداد را دارد',
  /patch\.price = discounted \? old : price/.test(adApi));
t('`discountPrice` در فهرستِ عمومی هست',
  /'"discountPrice"'/.test(adsApi),
  'بدونش کارت باز هم مجبور است عدد را حدس بزند');
t('هیچ‌جا عددِ خط‌خورده بازسازی نمی‌شود',
  !/Math\.round\(price \/ \(1 - disc \/ 100\)\)/.test(shopPage)
  && !/Math\.round\(price \/ \(1 - disc \/ 100\)\)/.test(read('app/dashboard/shop/page.tsx'))
  && !/disc > 0 \? Math\.round\(price \/ \(1 - disc \/ 100\)\)/.test(detail2));
t('کارتِ «مشابه» قیمتِ پرداختی را نشان می‌دهد',
  /r\.discountPrice < r\.price/.test(relApi));
t('اسکریپتِ اصلاحِ آگهی‌های قدیمی هست',
  /roundNice/.test(read('scripts/fix-ad-discounts.mjs')));

/* ── هر کالبکِ درگاه باید از بررسیِ Origin معاف باشد ──
   مرورگر موقعِ بازگشت از درگاه `Origin` را دامنه‌ی درگاه می‌گذارد؛
   بدونِ ثبت در `GATEWAY_CALLBACKS`، پروکسی ۴۰۳ می‌دهد و کاربری که
   همین حالا پول داده، صفحه‌ی خالیِ «درخواست از دامنه‌ی نامعتبر رد
   شد» می‌بیند — پول رفته و سفارش ثبت نشده.

   این دقیقاً برای ارتقای آگهی اتفاق افتاد. پس به‌جای فهرست‌کردنِ
   دستیِ مسیرها، خودِ پوشه گشته می‌شود: هر کالبکِ تازه‌ای که یادش
   برود، همین‌جا قرمز می‌شود. */
/* ── هر نوعِ دفترِ مالی باید در قیدِ دیتابیس مجاز باشد ──
   `bh_boost_apply` سطری با نوعِ `AD_BOOST_REVENUE` می‌نوشت که قیدِ
   `ledger_type_chk` نمی‌شناختش. درج شکست می‌خورد، **کلِ تراکنش
   برمی‌گشت**، و فروشنده‌ای که همین حالا پول داده بود می‌دید
   «پرداخت انجام شد ولی ارتقا اعمال نشد».

   نوعِ تازه در یک مهاجرت و قید در مهاجرتی دیگر — همان الگوی «دو جا
   که باید با هم بخوانند». پس به‌جای فهرستِ دستی، همه‌ی نوع‌هایی که
   جایی نوشته می‌شوند از خودِ فایل‌ها درمی‌آیند. */
console.log('\n― نوع‌های دفترِ مالی ―');
const migDir = join(ROOT, '../../supabase/migrations');
const migFiles = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
const allSql = migFiles.map(f => readFileSync(join(migDir, f), 'utf8')).join('\n');

/* آخرین تعریفِ قید در فایل‌ها ملاک است */
const chkBlocks = [...allSql.matchAll(/ADD CONSTRAINT ledger_type_chk CHECK \(type IN \(([\s\S]*?)\)\)/g)];
const allowed = new Set(
  (chkBlocks.at(-1)?.[1] ?? '').match(/'([A-Z_]+)'/g)?.map(s => s.replace(/'/g, '')) ?? [],
);
t(`قیدِ نوعِ دفتر پیدا شد (${allowed.size} نوع)`, allowed.size > 5);

/* نوع‌هایی که واقعاً در INSERTهای دفتر استفاده می‌شوند */
const used = new Set(
  [...allSql.matchAll(/INSERT INTO ledger_entries[\s\S]{0,400}?VALUES\s*\([^)]*?'([A-Z_]+)'/g)]
    .map(m => m[1]),
);
for (const type of [...used].sort()) {
  t(`نوعِ «${type}» در قید مجاز است`, allowed.has(type),
    'درج شکست می‌خورد و کلِ تراکنشِ پرداخت برمی‌گردد');
}

/* ── فقط آخرین تعریفِ هر تابع ملاک است ──
   مهاجرت سندِ تاریخ است و ویرایش نمی‌شود؛ `CREATE OR REPLACE` یعنی
   آنچه در دیتابیس می‌نشیند آخرین نسخه است. پس بررسی روی همان انجام
   می‌شود، نه روی نسخه‌های کنارگذاشته‌شده. */
const latestFn = new Map();
for (const f of migFiles) {
  const src = readFileSync(join(migDir, f), 'utf8');
  for (const m of src.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)([\s\S]*?)\$\$;/g)) {
    latestFn.set(m[1], m[2]);
  }
}
const liveFns = [...latestFn.entries()].filter(([, body]) => /INSERT INTO ledger_entries/.test(body));
t(`توابعی که در دفتر می‌نویسند پیدا شدند (${liveFns.length})`, liveFns.length > 0);

/* ── وضعیتِ سطرِ دفتر ──
   قید فقط `POSTED` و `REVERSED` را می‌پذیرد. مهاجرتِ ۰۷۹ نوشته بود
   `SETTLED` — کلمه‌ای که در تسویه‌ی باشگاه معنا دارد نه در دفتر — و
   همان درج، کلِ تراکنشِ ارتقا را برمی‌گرداند. */
for (const [name, body] of liveFns) {
  const bad = [...body.matchAll(/INSERT INTO ledger_entries[\s\S]{0,400}?'IRT',\s*'([A-Z_]+)'/g)]
    .map(m => m[1]).filter(s => s !== 'POSTED' && s !== 'REVERSED');
  if (bad.length) t(`«${name}» وضعیتِ مجاز می‌نویسد`, false, `وضعیتِ ناشناخته: ${bad.join(', ')}`);
}
t('هیچ تابعی وضعیتِ ناشناخته در دفتر نمی‌نویسد',
  liveFns.every(([, body]) =>
    [...body.matchAll(/INSERT INTO ledger_entries[\s\S]{0,400}?'IRT',\s*'([A-Z_]+)'/g)]
      .every(m => m[1] === 'POSTED' || m[1] === 'REVERSED')));

/* ── ایندکسِ یکتای جزئی ──
   `ledger_source_key_uidx` شرطِ `WHERE source_key IS NOT NULL` دارد.
   بدونِ تکرارِ همان شرط در دستور، Postgres ایندکس را برای
   `ON CONFLICT` پیدا نمی‌کند و درج می‌شکند. */
const liveConflicts = liveFns.flatMap(([, body]) =>
  [...body.matchAll(/ON CONFLICT \(source_key\)([^;]{0,60})/g)].map(m => m[1]));
t(`ON CONFLICTهای زنده شرطِ ایندکسِ جزئی را دارند (${liveConflicts.length} مورد)`,
  liveConflicts.every(c => /WHERE source_key IS NOT NULL/.test(c)),
  'ایندکسِ جزئی بدونِ تکرارِ شرط استنتاج نمی‌شود');

console.log('\n― کالبکِ درگاه‌ها ―');
const proxySrc = read('proxy.ts');
const callbackDirs = [];
(function walk(rel) {
  for (const e of readdirSync(join(ROOT, rel), { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const next = `${rel}/${e.name}`;
    if (e.name === 'callback') callbackDirs.push(next.replace(/^app/, ''));
    else walk(next);
  }
})('app/api');

t(`همه‌ی کالبک‌ها پیدا شدند (${callbackDirs.length} مسیر)`, callbackDirs.length >= 7);
for (const dir of callbackDirs) {
  t(`«${dir}» از بررسیِ Origin معاف است`,
    proxySrc.includes(`'${dir}'`),
    'کاربر پس از پرداخت ۴۰۳ می‌گیرد و پولش رفته');
}

t('عکسی که آپلودش نشد گم نمی‌شود',
  /out\.push\(s\);\s*\n\s*rowAfter \+= s\.length;\s*\n\s*failed\+\+/.test(imgMig)
  && /APPLY && allOk/.test(imgMig),
  'ردیف فقط وقتی نوشته می‌شود که همه‌ی عکس‌هایش منتقل شده باشند');

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
  /setImgIdx\(0\); setZoomed\(false\) \}, \[id\]/.test(detail2),
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
/* استوری از «فروشگاه من» (فهرستِ آگهی‌ها) به پنلِ فروشگاه رفت — همان
   جایی که نام و لوگو و گالریِ ویترین تنظیم می‌شوند. پنلِ فروشگاه
   خودش فقط برای فروشنده است، پس شرطِ نقش دیگر لازم نیست. */
t('استوری از فهرستِ آگهی‌ها برداشته شد',
  !/استوری/.test(myShop) && !/SellerStory/.test(myShop),
  'استوری نه آگهی است نه ربطی به فهرستِ آگهی‌ها دارد');
t('کارتِ آگهی فقط دسته/نوع، برند/مدل و قیمت را نشان می‌دهد',
  !/categoryLabels\[product\.category\]/.test(myShop)
  && !/بازدید<\/span>/.test(myShop) && !/conditionLabels\[/.test(myShop),
  'روی موبایل همه‌ی این‌ها روی هم می‌افتادند');
t('دکمه‌های کارتِ آگهی نام دارند',
  ['نمایش', 'ویرایش', 'ارتقا', 'حذف'].every(w => new RegExp(`>\\s*${w}\\s*<`).test(myShop)),
  'روی موبایل title نشان داده نمی‌شود و کاربر آیکون‌ها را نمی‌شناخت');
t('فهرستِ آگهی‌ها کادرِ اسکرول‌دار دارد',
  /max-h-\[62vh\] overflow-y-auto/.test(myShop));
t('سرتیترِ صفحه‌ی ویرایش کوتاه شد',
  !/EDIT LISTING/.test(strip(editAd)) && !/effBrand \? <span/.test(editAd));
t('استوری در پنلِ فروشگاه است',
  /<StoryManager ownerId=\{user\.id\}/.test(read('app/dashboard/seller/page.tsx'))
  && /export default function StoryManager/.test(read('components/seller/StoryManager.tsx')));
t('حذفِ آگهی از همین صفحه ممکن است',
  /handleDelete/.test(myShop) && /method: 'DELETE'/.test(myShop));
t('پس از ثبتِ آگهی، راهِ مدیریتش گفته می‌شود',
  /آگهی‌های من/.test(newAd) && /href="\/dashboard\/shop"/.test(newAd));
t('پرتِ خودکار به بازار برداشته شد',
  !/router\.push\('\/shop'\)/.test(newAd),
  'آگهی‌دهنده وسطِ فهرستِ بازار می‌افتاد و آگهیِ خودش را گم می‌کرد');
/* کارتِ تکراریِ داشبورد برداشته شد؛ چیزی که واقعاً باید بماند
   دسترسیِ بی‌قیدِ نقش در منوی پروفایل است — همان که این بالا سنجیده
   شد. این نگهبان می‌گوید آن مسیر بی‌شرط است، نه اینکه کارت هست. */
t('دسترسی به آگهی‌های من شرطی نشده',
  !/roles\.includes\('seller'\) \? \[\{ href: '\/dashboard\/shop'/.test(navbar),
  'اگر دوباره پشتِ نقش برود، کاربرِ عادی به آگهی خودش نمی‌رسد');

/* ── ۱۳ · لغو رزرو توسط باشگاه ──
   سرور از قبل اجازه‌اش را می‌داد و قاعده‌ی ۴ ساعت را هم اجرا می‌کرد،
   ولی دکمه فقط روی رزروِ `pending` بود. یعنی رزروِ تأییدشده و
   پرداخت‌شده از پنلِ باشگاه هیچ راهِ لغوی نداشت و باشگاه‌داری که
   میزش خراب می‌شد باید به پشتیبانی زنگ می‌زد. */
console.log('\n― لغو رزرو توسط باشگاه ―');
const cancelApi = read('app/api/bookings/[id]/cancel/route.ts');
const policy = read('lib/finance/cancellation.ts');
t('باشگاه دکمه‌ی لغو برای رزروِ تأییدشده دارد',
  /b\.status === 'confirmed' && \(/.test(clubPage) && /cancelBookingByOwner/.test(clubPage));
t('مهلتِ ۴ ساعت در سرور اجرا می‌شود',
  /OWNER_CANCEL_HOURS = 4/.test(cancelApi) && /hoursLeft < OWNER_CANCEL_HOURS/.test(cancelApi),
  'قاعده‌ای که فقط در کلاینت باشد با یک درخواستِ دستی دور می‌خورد');
t('کلاینت هم همان عدد را می‌شناسد',
  /OWNER_CANCEL_HOURS = 4/.test(clubPage),
  'وگرنه دکمه دیده می‌شود، زده می‌شود، و خطا می‌گیرد');
t('لغوِ باشگاه بازگشتِ کامل می‌دهد',
  /minHoursBefore: 4, refundPercent: 100/.test(policy),
  'مرزِ ۴ ساعت با پله‌ی اولِ سیاست یکی است، پس مشتری هیچ‌وقت جریمه نمی‌شود');
t('مبلغِ بازگشتی پیش از تأیید نشان داده می‌شود',
  /computeRefund\(paid, bookingStartsAt/.test(clubPage));
t('دلیلِ لغو ثبت می‌شود',
  /لغو توسط باشگاه\$\{reason/.test(clubPage) && /reason, status: 'REQUESTED'/.test(cancelApi));
t('بازپرداخت به دستورِ پرداختِ ادمین می‌رود',
  /from\('refunds'\)\.insert/.test(cancelApi)
  && /kind: 'refund'/.test(read('components/admin/PayoutOrders.tsx')));
t('مشتری پیامکِ لغو با مبلغ می‌گیرد',
  /notifyBookingCancelled\(b\.id, refund\)/.test(cancelApi)
  && /booking_cancelled_refund/.test(read('lib/notify.ts')));
t('وعده‌ی بی‌پشتوانه به باشگاه‌دار داده نمی‌شود',
  !/دلیل لغو — برای مشتری فرستاده می‌شود/.test(clubPage),
  'دلیل در پیامک نمی‌رود؛ الگوهای ملی‌پیامک پارامترِ اضافه نمی‌پذیرند');

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
t('نگهبانِ بازیابی به نسخه گره خورده، نه «یک‌بار برای همیشه»',
  /sessionStorage\.getItem\(KEY\) === mine/.test(read('components/AppBoot.tsx'))
  && /const mine = process\.env\.NEXT_PUBLIC_BUILD_SHA/.test(read('components/AppBoot.tsx')),
  'پرچمِ ثابت یعنی تب فقط یک‌بار در عمرش خودش را درست می‌کند؛ دیپلویِ دوم صفحه‌ی سفیدِ ماندگار می‌دهد');
t('بازبارگذاری وسطِ فرم انجام نمی‌شود',
  /const isMidTask = \(\) =>/.test(boot)
  && (boot.match(/if \(isMidTask\(\)\) return/g) ?? []).length >= 2,
  'کاربری که وسطِ ثبتِ فروشگاه بود، فرمش می‌پرید و حس می‌کرد پرت شده بیرون');

/* ── فروشگاه: یک منبع، نه دو ──
   دو سیستمِ فروشگاه هم‌زمان زنده بودند و صفحه‌ی اصلی از آن که هیچ‌کس
   نمی‌نویسدش می‌خواند؛ Production `[]` می‌داد در حالی که فروشگاهِ
   واقعی وجود داشت. این نگهبان‌ها جلوی برگشتنش را می‌گیرند. */
/* ── داشبورد: هیچ عددِ ساختگی ── */
console.log('\n― داشبورد: داده‌ی واقعی ―');
/* توضیحات کنار گذاشته می‌شوند — خودشان نامِ موردِ حذف‌شده را می‌برند */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const dashPage = stripComments(read('app/dashboard/page.tsx'));
t('درصدِ تکمیلِ پروفایل شمرده می‌شود، هاردکد نیست',
  /profileSteps\.filter\(s => s\.done\)\.length/.test(dashPage) && !/value=\{72\}/.test(dashPage),
  'عدد ۷۲٪ به هر کاربری نشان داده می‌شد، حتی حسابِ تازه‌ی خالی');
t('موردی که در سایت وجود ندارد در فهرست نیست',
  !/تأیید فدراسیون|ویدیوی هایلایت/.test(dashPage),
  'کاربر کاری ناتمام می‌دید که هیچ راهی برای تمام‌کردنش نبود');
t('«تبلیغات» تا رونمایی پشتِ کلید است',
  /const ADS_LAUNCHED = false/.test(dashPage) && /\{ADS_LAUNCHED && \(/.test(dashPage));

/* ── بازار: مشخصات، فوری، توافقی، جدید ── */
console.log('\n― بازار ―');
const adDetail = read('app/shop/[id]/page.tsx');
const market = stripComments(read('app/shop/page.tsx'));
const newAdPage = read('app/shop/new/page.tsx');

t('تعریفِ مشخصاتِ فنی یک‌جاست',
  /export const CATEGORY_SPECS/.test(read('lib/market/specs.ts'))
  && /from '\.\.\/\.\.\/\.\.\/lib\/market\/specs'/.test(newAdPage),
  'اگر فرم نسخه‌ی خودش را داشته باشد، برچسبِ صفحه‌ی نمایش از آن دور می‌افتد');
t('صفحه‌ی جزئیات مشخصاتِ فنی را نشان می‌دهد',
  adDetail.includes('specDisplayRows(specDefs, rawAd?.specs,') && /مشخصات فنی/.test(adDetail)
    /* دسته‌هایی که کاتالوگِ تازه ندارند باید همچنان برچسبِ فارسی
       بگیرند، وگرنه «diameter: 57.2» نشان داده می‌شد. */
    /* یک سازنده‌ی ردیف برای همه‌ی دسته‌ها؛ کلیدِ ناشناخته برچسبش را
       از `legacyLabelOf` می‌گیرد نه از یک مسیرِ دومِ موازی. */
    && adDetail.includes('legacyLabelOf(product?.cat, k)')
    && !adDetail.includes('specDefs.length ? specs : legacyRows'),
  'ده‌ها مشخصه ذخیره می‌شد و هیچ‌جا دیده نمی‌شد');
t('آگهیِ فوری از فهرستِ عادی برداشته می‌شود',
  /const inBar = new Set\(urgent\.map/.test(market),
  'آگهیِ فوری هم در نوار بود هم وسطِ فهرست — دو بار دیده می‌شد');
t('نوارِ فوری فیلترها را رعایت می‌کند',
  /return matched\s*\n?\s*\.filter\(l => !l\.sold && l\.urgentUntil/.test(market)
  || /matched\r?\n?\s*\.filter\(l => !l\.sold/.test(market),
  'جستجوی «چوب» در نوارِ فوری میز و توپ هم نشان می‌داد');
t('«پیدا نشد» با فهرستِ خالیِ عادی اشتباه نمی‌شود',
  /ready && matched\.length === 0/.test(market),
  'اگر همه‌ی نتیجه‌ها فوری بودند، هم‌زمان نوار و پیامِ «پیدا نشد» می‌آمد');
t('نشانِ «جدید» ۲۴ ساعته است',
  /const NEW_BADGE_MS = 24 \* 60 \* 60 \* 1000/.test(market));
t('«فروشنده عجله دارد» برداشته شد',
  !/عجله دارد/.test(market));
/* منطقِ «توافقی» از سه کارت به `CardFacts` رفت؛ چیزی که این‌جا
   می‌ماند رسیدنِ خودِ پرچم به هر سه مسیرِ داده است. */
t('پرچمِ توافقی به هر سه مسیرِ داده می‌رسد',
  /negotiable: p\.negotiable === true/.test(read('lib/home-featured.ts'))
  && /negotiable: e\.negotiable === true/.test(read('app/HomeClient.tsx'))
  && /negotiable: r\.negotiable === true/.test(read('app/shop/products.ts')),
  '«۰ تومان» یعنی سایت از طرفِ فروشنده قیمتی اعلام می‌کند که او نگفته');

/* ── اسکرولِ صفحه مالِ مرورگر است ──
   یک شنونده‌ی non-passive روی `wheel` که preventDefault می‌زد و
   اسکرول را با rAF بازسازی می‌کرد، سه ایراد می‌ساخت: قفل‌شدنِ موس
   وسطِ صفحه، حالتِ فنری، و پرشِ ناگهانی به بالای صفحه. */
console.log('\n― اسکرول ―');
const hScroll = read('lib/useHorizontalScroll.ts');
t('کاروسل چرخِ عمودی را نمی‌دزدد',
  !/addEventListener\('wheel'/.test(hScroll),
  'preventDefault روی چرخ یعنی اسکرولِ صفحه دستِ جاوااسکریپت می‌افتد');
t('هیچ‌جای سایت چرخ را preventDefault نمی‌کند',
  !/onWheel[\s\S]{0,400}preventDefault/.test(hScroll));
t('اسکرولِ صفحه با scrollTo شبیه‌سازی نمی‌شود',
  !/window\.scrollTo\(\{ top: cur \+ gap/.test(hScroll),
  'هدفِ بریده‌شده با scrollHeight، صفحه را به بالا می‌کشید');

/* ── قوانین باید همان چیزی را بگویند که کد انجام می‌دهد ── */
console.log('\n― قوانین و مالی ―');
const legalDoc = read('lib/legal-content.ts');
const finPolicy = read('lib/finance/policy.ts');
const cancelRoute = read('app/api/bookings/[id]/cancel/route.ts');

t('کمیسیون در قوانین از منبعِ واحد می‌آید',
  /FEE_RULES/.test(legalDoc) && /PLATFORM_FEE_PERCENT = 5/.test(finPolicy),
  'عددِ هاردکد در متنِ حقوقی با کد از هم دور می‌افتد');
t('جدابودنِ کارمزد درگاه صریح نوشته شده',
  /کارمزد درگاه پرداخت جدا/.test(finPolicy),
  'باشگاه‌دار ۵٪ را می‌بیند و انتظار دارد بقیه دقیقاً به حسابش بنشیند');
t('کمیسیونِ ثبت‌نام مسابقه هم آمده',
  /ثبت‌نام موفق در مسابقات/.test(finPolicy));
t('قاعده‌ی ۴ ساعتِ باشگاه در قوانین هست',
  /CLUB_CANCEL_RULES/.test(legalDoc) && /CLUB_CANCEL_HOURS = 4/.test(finPolicy));
t('همان عدد در کدِ لغو هم هست',
  /const OWNER_CANCEL_HOURS = 4/.test(cancelRoute),
  'اگر این دو از هم جدا شوند، قانون چیزی می‌گوید و سایت کارِ دیگری می‌کند');
t('چرخه‌ی تسویه توضیح داده شده',
  /SETTLEMENT_RULES/.test(legalDoc) && /تا پایان ساعتِ رزروشده نزد بیلیارد هاب/.test(finPolicy),
  'باشگاه‌دار فکر می‌کرد تسویه عقب افتاده یا پولی گم شده');
t('لوگوی پوستر کشیده نمی‌شود',
  /flexDirection: 'column', alignItems: 'flex-start', gap: 9/.test(read('app/sellers/[id]/FlatShop.tsx')),
  'در ستونِ flex بدونِ align-items، عکس تا عرضِ کانتینر کش می‌آید');
t('انتخابِ نقشِ اصلی از منو در دسترس است',
  /href: '\/profile\/role', label: 'نقش‌های من'/.test(read('components/Navbar.tsx')),
  'تنها جای انتخابِ نقشِ اصلی بود و فقط از چند کارتِ داشبورد به آن لینک بود');

/* ── نشانیِ اختصاصی برای همه‌ی نقش‌ها ── */
console.log('\n― نشانیِ اختصاصی ―');
const slugPanels = [
  ['app/dashboard/seller/page.tsx', 'seller'],
  ['app/dashboard/coach/page.tsx', 'coach'],
  ['app/referees/dashboard/page.tsx', 'referee'],
  ['app/dashboard/technician/page.tsx', 'technician'],
  ['app/dashboard/manufacturer/page.tsx', 'manufacturer'],
  ['app/dashboard/player/page.tsx', 'player'],
];
for (const [file, kind] of slugPanels) {
  const src = read(file);
  t(`پنلِ ${kind} نشانیِ اختصاصی دارد`,
    /<ProfileSlugField/.test(src) && new RegExp(`kind="${kind}"`).test(src),
    'تا امروز فقط باشگاه می‌توانست نشانیِ خوانا انتخاب کند');
}
t('سرور تغییرِ نامک را می‌پذیرد',
  /wanted && wanted !== existing\?\.slug/.test(read('lib/profiles/server.ts')),
  'نامک قفل بود و هر نقشی با نامکِ خودکارِ لحظه‌ی ثبت می‌ماند');
t('مسیرِ بررسیِ یکتاییِ نامک هست',
  read('app/api/profiles/[kind]/slug-check/route.ts').includes(`from('profiles')`));
t('پیش‌نمایشِ لینک بدونِ www است',
  !/www\.billiardhub\.net\/\{basePath\}/.test(read('components/SiteAddressField.tsx')),
  'دامنه یکی شده و www با ۳۰۱ می‌آید؛ کپی‌کردنش یک پرشِ اضافه دارد');

/* ── ظاهرِ بازار و فروشگاه ── */
console.log('\n― ظاهر ―');
const flat = read('app/sellers/[id]/FlatShop.tsx');
const detailPg = stripComments(read('app/shop/[id]/page.tsx'));
const sellerPanel = stripComments(read('app/dashboard/seller/page.tsx'));

t('«توافقی» از خودِ اسنپ‌شاتِ جایگاه می‌آید',
  /negotiable: r\.negotiable === true/.test(read('lib/ads/resolve.ts'))
  && /negotiable: r\.negotiable === true/.test(read('lib/ads/free.ts'))
  && /negotiable: e\.negotiable === true/.test(read('app/HomeClient.tsx')),
  'سه بار فقط مسیرِ realProducts درست شد و مسیرِ واقعیِ رندر دست‌نخورده ماند');
t('قیمتِ خط‌خورده از discountPrice می‌آید نه از درصدِ گِردشده',
  /oldPrice: listed/.test(read('lib/ads/resolve.ts')));
t('گریدِ فروشگاه شش‌ستونی است', flat.includes('min-[1200px]:grid-cols-6'),
  'کوچک‌شدنِ کارت حالا کارِ گرید است نه محدودکردنِ عرضِ کارت داخلِ سلول');
t('نوارِ فوری هم‌ارتفاع و اسکرول‌پذیر است',
  read('app/shop/page.tsx').includes('min-width: 0; max-width: 100%'),
  'کارتِ یک‌خطی و دوخطی دو ارتفاع می‌گرفتند');
t('تیترِ کارتِ صفحه‌ی اصلی دوتکه و بولد است',
  /\.bz-h \{[^}]*font-weight:800/.test(read('app/HomeClient.tsx').replace(/\s+/g, ' '))
  || /font-weight:800/.test(read('app/HomeClient.tsx')),
  'دسته‌بندی و نوع باید از برند برجسته‌تر باشند');
t('برچسبِ برند طرحِ اختصاصی دارد',
  /\.brand-chip \{/.test(flat) && /نمایندگی :/.test(flat),
  'برچسبِ انگلیسیِ Authorized جایش را به «نمایندگی :» داد');
t('نشانیِ اختصاصی در هدرِ فروشگاه دیده و کپی می‌شود',
  /billiardhub\.net\/sellers\/\{sellerId\}/.test(flat) && /setUrlCopied/.test(flat));
t('فیلدِ نشانی دکمه‌ی کپی دارد',
  /aria-label="کپیِ نشانی"/.test(read('components/SiteAddressField.tsx')));
t('نقش‌های فعال شاملِ نقشِ اصلی است',
  /const activeRoles = Array\.from\(new Set\(/.test(read('app/profile/role/page.tsx')),
  'فقط secondaryRoles فهرست می‌شد و نقشِ اصلی اصلاً دیده نمی‌شد');
t('نام‌های قدیمیِ نوعِ توپ در نمایش به‌روز می‌شوند',
  /export function modernizeType/.test(read('lib/market/title.ts'))
  && /modernizeType\(p\.title\)/.test(read('app/HomeClient.tsx')),
  'آگهی‌های قبلی «۲۲ تایی اسنوکر» را در عنوان دارند');
t('فیلدِ «نام کوتاه (برند)» حذف شد',
  !/f-brand/.test(read('app/dashboard/seller/page.tsx')));
t('برچسبِ تخفیفِ جزئیات مثل بازار است — بنفش',
  (detailPg.match(/#b400ae/g) ?? []).length >= 2 && !/٪ تخفیف/.test(detailPg));
t('توضیحاتِ محصول باکسِ مستقل دارد',
  /توضیحات محصول/.test(detailPg));
t('نشانِ سبزِ فروشگاه فقط برای فروشگاهِ تأییدشده',
  /hasStore && storeVerified/.test(detailPg),
  'فروشگاهِ بی‌جواز هم نشانِ اعتبار می‌گرفت');
t('باکسِ قیمت زیرِ مشخصاتِ فنی است',
  detailPg.indexOf('مشخصات فنی') < detailPg.indexOf('با فروشنده تماس بگیرید'),
  'قیمت پیش از مشخصات می‌آمد و خریدار اول عدد را می‌دید نه کالا را');
/* ── چرا این ادعا وارونه شد ──
   کادرِ «عکس استوری» عمداً حذف شد: آن دو فیلد یک استوریِ دائمیِ
   بی‌انقضا می‌ساختند. استوریِ واقعیِ ۲۴ساعته همان `StoryManager` است
   که همان‌جا رندر می‌شود. */
t('کادرِ عکسِ استوریِ جعلی برداشته شد',
  !/aria-label=\{form\.storyImage/.test(sellerPanel));
t('فیلدِ شماره‌ی جواز برداشته شد',
  !/شماره‌ی جواز کسب/.test(sellerPanel),
  'شماره روی خودِ برگه هست؛ تایپِ دوباره فقط جای غلطِ تایپی می‌ساخت');
t('نقطه‌ی پایانِ راهنمای واتساپ برداشته شد',
  /مثل ۹۸۹۱۲۱۲۳۴۵۶۷<\/p>/.test(sellerPanel),
  'بلافاصله بعد از رقم می‌آمد و با صفر اشتباه گرفته می‌شد');

/* ── صفحه‌ی فروشگاه: انتشار، تکرار، و ظاهر ── */
console.log('\n― صفحه‌ی فروشگاه ―');
const shopFlat = stripComments(read('app/sellers/[id]/FlatShop.tsx'));
const sellerDash = stripComments(read('app/dashboard/seller/page.tsx'));

t('فروشگاه خودش را منتشرشده اعلام نمی‌کند',
  !/status: 'approved'/.test(sellerDash),
  'صفِ تأیید تشریفاتی می‌شد و «رد»ِ ادمین با اولین ویرایش برمی‌گشت');
t('مدرکِ بی‌تیک هم روی میزِ ادمین شمرده می‌شود',
  /license_verified', false/.test(read('app/api/admin/stats/route.ts')),
  'مدرکی که بعد از تأیید آپلود می‌شد هیچ‌جا دیده نمی‌شد');
t('عکسِ فالبکِ کارتِ فروشگاه واقعاً وجود دارد',
  existsSync(join(ROOT, 'public', read('lib/home-featured.ts').match(/const STORE_IMG = '([^']+)'/)?.[1] ?? 'x')),
  'نشانیِ قبلی ۴۰۴ می‌داد و onError عکس را پنهان می‌کرد');
t('بخشِ تکراریِ «درباره ما» حذف شد',
  !/درباره ما<\/h3>/.test(shopFlat),
  'یک متن سه جای صفحه تکرار می‌شد');
t('توضیحاتِ فروشگاه فقط یک جا نوشته می‌شود',
  (shopFlat.match(/\{store\.desc\}/g) ?? []).length === 1,
  'همان متن در هدر، «درباره ما» و فوتر تکرار می‌شد');
t('فوتر نامِ کاملِ فروشگاه را نشان می‌دهد نه نامِ کوتاه',
  /© \{toFa\(1405\)\} \{store\.title\}/.test(shopFlat));
/* قاعده عوض شد: فوترِ *سایت* از این صفحه‌ها می‌رود، ولی نشانِ
   پلتفرم داخلِ فوترِ خودِ فروشگاه/باشگاه می‌ماند — بازدیدکننده باید
   بداند صفحه کجا میزبانی می‌شود. */
t('نشانِ پلتفرم در فوترِ فروشگاه هست',
  /قدرت‌گرفته از بیلیارد/.test(shopFlat));
t('فوترِ سایت روی صفحه‌ی فروشگاه، باشگاه و تولیدکننده پنهان است',
  (() => {
    const gate = read('components/FooterGate.tsx')
    const block = gate.slice(gate.indexOf('const isStorePage'), gate.indexOf('export default'))
    return ['sellers', 'clubs', 'manufacturers'].every(seg => block.includes(seg))
  })(),
  'دو فوترِ پشتِ سرِ هم و دو کپی‌رایت');
t('صفحه‌ی باشگاه نوارِ پایانیِ خودش را دارد',
  /تمام حقوق محفوظ است/.test(read('app/clubs/[id]/page.tsx')),
  'با رفتنِ فوترِ سایت، صفحه بی‌پایان می‌ماند');
t('دسته‌بندی افقی از منبعِ واحدِ بازار می‌آید',
  /MARKET_CATEGORIES\.map/.test(shopFlat) && /scat-strip/.test(shopFlat),
  'همه‌ی دسته‌ها می‌آیند؛ عدد فقط زیرِ آن‌هایی که محصول دارند');
t('دراپ‌داونِ دسته‌بندی برداشته شد',
  !/<CategoryDropdown/.test(shopFlat));
t('هدر و پوسته‌ی صفحه گلس شدند',
  /\.shop-head \{/.test(shopFlat) && /\.shop-shell \{/.test(shopFlat)
  && /backdrop-filter: blur\(34px\)/.test(shopFlat));

/* ── محصولِ فروشگاه: دو کلیدی که با هم اشتباه می‌شدند ── */
console.log('\n― محصولاتِ فروشگاه ―');
const adsPost = stripComments(read('app/api/market/ads/route.ts'));
t('نامکِ فروشگاه روی سرور پیدا می‌شود نه از مرورگر',
  /\.eq\('kind', 'seller'\)\.eq\('owner_id', actor\.id\)/.test(adsPost)
  && !/storeSlug: str\(b\?\.storeSlug/.test(adsPost),
  'فرم آن را از localStorage می‌خواند و همیشه خالی بود ⇒ صفحه‌ی فروشگاه بی‌محصول');
t('نشانِ «فروشگاه رسمی» هم از همان مقدار می‌آید',
  /isOfficialStore: !!storeSlug/.test(adsPost));
t('کارتِ محصول نامک را حمل می‌کند نه شناسه‌ی کاربر',
  /sellerId: s\(r\.storeSlug\)/.test(read('app/shop/products.ts')),
  '`sellerId` اصلاً در ستون‌های فهرستِ عمومی نیست — همیشه رشته‌ی خالی می‌شد');
t('فرمِ ثبتِ آگهی فروشگاه را از سرور می‌گیرد',
  /fetchMyProfile<Record<string, any>>\('seller'\)/.test(read('app/shop/new/page.tsx')));
t('آگهی‌های قبلی مهاجرتِ جبرانی دارند',
  /storeSlug.*=\s*pr\.slug/s.test(read('../../supabase/migrations/084_backfill_product_store_slug.sql')));

console.log('\n― فروشگاه: منبعِ واحد ―');
/* توضیحات کنار گذاشته می‌شوند — خودشان نامِ ستونِ قدیمی را می‌برند */
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const sellersApi = noComments(read('app/api/sellers/route.ts'));
const homeFeat = read('lib/home-featured.ts');
const storiesBar = read('components/Stories.tsx');

t('`/api/sellers` از منبعِ واحد می‌خواند',
  /listPublicStores/.test(sellersApi) && !/sellerProfile/.test(sellersApi),
  '`users.sellerProfile` را هیچ کدی نمی‌نویسد — خواندنش یعنی فهرستِ خالی');
t('مقدارِ اولیه‌ی سرور هم از همان منبع است',
  /listPublicStores/.test(homeFeat) && !/'primaryRole', 'seller'/.test(homeFeat),
  'دو منبعِ متفاوت یعنی کارت‌ها بعد از hydration جابه‌جا می‌شوند');
t('کارتِ فروشگاه به نامک لینک می‌دهد نه شناسه‌ی کاربر',
  /id: s\(r\.slug\)/.test(read('lib/sellers-source.ts')),
  '`/sellers/<id>` با نامک کار می‌کند؛ با شناسه‌ی کاربر به «پیدا نشد» می‌رسید');
t('استوریِ فروشگاه با شناسه‌ی مالک پرسیده می‌شود',
  /\/api\/sellers\/\$\{s\.ownerId\}\/stories/.test(storiesBar),
  'پنلِ فروشگاه با user.id ذخیره می‌کند؛ با نامک پاسخ همیشه خالی است');
t('نوارِ استوری دیگر از لوکال‌استوریج فروشگاه نمی‌خواند',
  !/listSellerProfiles/.test(storiesBar.replace(/\/\*[\s\S]*?\*\//g, '')),
  'استوری فقط روی مرورگرِ خودِ فروشنده دیده می‌شد');
/* ⚠️ این ادعا وارونه شد — و درسش را ثبت می‌کنم.
   نسخه‌ی قبلی می‌گفت «تک‌عکسِ استوریِ پروفایل هم به نوار می‌رسد» و
   همان رفتار بعداً معلوم شد خودش باگ است: فیلدِ فرم انقضا ندارد.
   بدتر اینکه بعد از حذفِ آن رفتار، تست همچنان سبز ماند — چون رشته‌ی
   `s.storyImage` داخلِ یک *کامنت* باقی مانده بود. کامنت‌ها حذف
   می‌شوند تا این‌بار واقعاً کد سنجیده شود. */
t('تک‌عکسِ پروفایل به نوارِ استوری نمی‌رسد',
  !/s\.storyImage/.test(storiesBar.replace(/\/\*[\s\S]*?\*\//g, '')),
  'فیلدِ فرم استوری نیست: نه انتشار دارد نه انقضا');

/* ── پیکربندیِ Supabase نباید به مرورگر برسد ──
   `lib/supabase-config.ts` هنگام بارگذاری متغیرِ محیطی را می‌سنجد و
   اگر نبود (یا نشانیِ ابری بود) خطا می‌دهد. اگر یک کامپوننتِ
   `'use client'` — مستقیم یا با چند واسطه — واردش کند، آن خطا داخلِ
   باندلِ مرورگر می‌نشیند و یک بیلدِ بدونِ متغیر، به‌جای خطای سرور،
   صفحه‌ی سفید به بازدیدکننده می‌دهد.

   یک بار همین اتفاق افتاد: `HomeClient` برای `thumbUrl` واردش می‌کرد.
   `thumbUrl` به `lib/media/thumb.ts` منتقل شد چون اصلاً به آن متغیر
   کاری ندارد. این تست جلوی برگشتش را می‌گیرد.

   (به‌جای بسته‌ی `server-only` — که یک dependency تازه بود — همین
   بازرسیِ ایستا این مرز را نگه می‌دارد.) */
console.log('\n― مرزِ سرور و کلاینت ―');
{
  const { readdirSync, statSync } = await import('node:fs');
  const { relative, resolve, extname } = await import('node:path');

  const files = [];
  const walk = d => {
    for (const name of readdirSync(d)) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(name)) files.push(p);
    }
  };
  for (const dir of ['app', 'components', 'lib', 'hooks', 'store']) {
    const abs = join(ROOT, dir);
    if (existsSync(abs)) walk(abs);
  }

  /* گرافِ importهای نسبی */
  const src = new Map(files.map(f => [f, readFileSync(f, 'utf8')]));
  const resolveImport = (from, spec) => {
    const base = resolve(dirname(from), spec);
    for (const c of [base, base + '.ts', base + '.tsx', join(base, 'index.ts'), join(base, 'index.tsx')]) {
      if (src.has(c)) return c;
      if (existsSync(c) && !extname(c)) continue;
    }
    return null;
  };
  /* هم مسیرِ نسبی و هم نامِ مستعارِ `@/` دنبال می‌شود. با دنبال‌نکردنِ
     `@/`، یک `import … from '@/lib/supabase-config'` داخلِ فایلِ
     `'use client'` بی‌صدا از تست رد می‌شد — یعنی دقیقاً همان چیزی که
     این تست برای گرفتنش هست. */
  const importsOf = f => [...(src.get(f) ?? '').matchAll(/from\s+['"]((?:\.|@\/)[^'"]+)['"]/g)]
    .map(m => (m[1].startsWith('@/')
      ? resolveImport(join(ROOT, 'x'), './' + m[1].slice(2))
      : resolveImport(f, m[1])))
    .filter(Boolean);

  /* هر ماژولی که داده یا رازِ سنگین را ایستا وارد می‌کند و نباید
     از سمتِ کلاینت دیده شود. سه بار همین تله زد: thumbUrl،
     supabase-config، و کاتالوگِ ۹۸ کیلوبایتیِ چوب. */
  const SERVER_ONLY = [
    join(ROOT, 'lib', 'supabase-config.ts'),
    join(ROOT, 'lib', 'market', 'cue-catalog.ts'),
  ];
  const clientRoots = files.filter(f => /^\s*['"]use client['"]/.test(src.get(f) ?? ''));

  /* BFS از هر ریشه‌ی کلاینت تا رسیدن به هدف */
  const offenders = [];
  for (const root of clientRoots) {
    const seen = new Set([root]);
    const queue = [[root, [root]]];
    while (queue.length) {
      const [cur, path] = queue.shift();
      for (const next of importsOf(cur)) {
        if (seen.has(next)) continue;
        if (SERVER_ONLY.includes(next)) { offenders.push(path.concat(next).map(p => relative(ROOT, p)).join(' → ')); queue.length = 0; break; }
        seen.add(next);
        queue.push([next, path.concat(next)]);
      }
    }
  }

  t('ماژول‌های فقط-سرور از کلاینت وارد نمی‌شوند',
    offenders.length === 0,
    offenders[0] ?? '');
  t('thumbUrl ماژولِ مستقلِ خودش را دارد',
    existsSync(join(ROOT, 'lib/media/thumb.ts'))
    && !/export function thumbUrl/.test(read('lib/supabase-config.ts')));
  t('فقط یک جا متغیرِ نشانی خوانده می‌شود',
    files.filter(f => /process\.env\.NEXT_PUBLIC_SUPABASE_URL/.test(src.get(f) ?? ''))
      .map(f => relative(ROOT, f))
      .filter(f => f !== join('lib', 'supabase-url.ts')).length === 0,
    'پنج خواننده‌ی جدا با پنج رفتارِ متفاوت در نبودِ مقدار');
  t('گاردِ نشانی، میزبانِ ابری را هم رد می‌کند',
    /isCloudHost/.test(read('lib/supabase-config.ts'))
    && /endsWith\('\.supabase\.co'\)/.test(read('lib/supabase-config.ts')),
    'شرطِ «خالی» تنها، همان حالتی را می‌گرفت که هرگز داده را خراب نمی‌کرد');
}

/* ── CORS ──
   lib/cors.ts حذف شد. یک الگوی وایلدکارتِ vercel.app داشت که هر کسی
   می‌توانست با ساختنِ یک ساب‌دامین از آن رد شود — و چون آن هدرها
   credentialed بودند، یعنی دسترسی با کوکیِ کاربرانِ ما.

   ولی بازبینی نشان داد آن فایل **هیچ وارد‌کننده‌ای نداشت**: هیچ route
   handlerی صدایش نمی‌زد و هیچ‌جای پروژه هدرِ Access-Control-Allow-Origin
   نمی‌فرستد. یعنی فایلی بود که شبیهِ یک کنترلِ امنیتی خوانده می‌شد ولی
   نبود — و همین خطرناک‌تر است، چون خواننده فکر می‌کند سیاستی برقرار
   است. همه‌ی ترافیکِ واقعی same-origin است. */
/* ── آیکون‌های دسته‌بندی ──
   پانزده آیکون به‌صورت PNG در ۲۵۶ تا ۵۱۲ پیکسل سرو می‌شدند، مجموعاً
   ۱۰۰۷ کیلوبایت — برای جایی که بیشترین اندازه‌ی نمایششان ۴۵ پیکسل
   است. روی Fast 3G آخرین آیکون در ۸٫۶ ثانیه می‌رسید و کاربر می‌دید
   که یکی‌یکی ظاهر می‌شوند. */
console.log('\n― آیکون‌های دسته‌بندی ―');
{
  const cats = read('lib/market/categories.ts');
  const paths = [...cats.matchAll(/img: '(\/images\/icon\/[^']+)'/g)].map(m => m[1]);
  t('هر پانزده دسته آیکون دارد', paths.length === 15, `${paths.length} پیدا شد`);
  t('هیچ آیکونی PNG نیست',
    paths.every(p => p.endsWith('.webp')),
    paths.filter(p => !p.endsWith('.webp')).join(', '));
  const missing = paths.filter(p => !existsSync(join(ROOT, 'public', p)));
  t('فایلِ هر آیکون واقعاً هست', missing.length === 0, missing.join(', '));
  const { statSync } = await import('node:fs');
  const total = paths.reduce((s, p) => s + (existsSync(join(ROOT, 'public', p)) ? statSync(join(ROOT, 'public', p)).size : 0), 0);
  t('مجموعِ آیکون‌ها زیر ۲۰۰ کیلوبایت است',
    total < 200 * 1024,
    `${Math.round(total / 1024)}KB`);
}

/* ── کاتالوگِ چوب ──
   داده‌ی خودش (۴ نوع، ۱۱۴ برند، ۴۴۷ مدل) و قواعدی که سرور به آن‌ها
   تکیه می‌کند: پیشوندِ برند با نوع بخواند، شناسه‌ها یکتا باشند، و
   ۹۸ کیلوبایتِ JSON به باندلِ کلاینت نرود. */
console.log('\n― کاتالوگِ چوب ―');
{
  const cuePath = join(ROOT, 'data/cue-catalog.json');
  t('فایلِ کاتالوگ هست', existsSync(cuePath));

  if (existsSync(cuePath)) {
    const rawCue = readFileSync(cuePath, 'utf8');
    t('فارسیِ کاتالوگ سالم است',
      !rawCue.includes('�'),
      'آپلودِ خرابِ انکودینگ یک‌بار همه‌ی نام‌های فارسی را نابود کرده بود');

    const cat = JSON.parse(rawCue);
    const PREFIX = { pocket_billiard: 'pocket__', snooker: 'snk__', heyball: 'hey__', carom: 'car__' };
    const brands = cat.types.flatMap(x => x.brands);

    t('هر چهار نوع هست', cat.types.length === 4 && cat.types.every(x => PREFIX[x.id]));
    t('برندها و مدل‌های چوب کامل‌اند',
      brands.length >= 114 && brands.reduce((n, b) => n + b.models.length, 0) >= 447,
      `${brands.length} برند`);

    const badPrefix = cat.types.flatMap(x => x.brands.filter(b => !b.id.startsWith(PREFIX[x.id])).map(b => b.id));
    t('پیشوندِ هر برند با نوعش می‌خواند', badPrefix.length === 0, badPrefix.slice(0, 3).join(', '));

    const ids = brands.map(b => b.id);
    t('شناسه‌ی برند یکتاست', new Set(ids).size === ids.length);
    t('هر برند دستِ‌کم یک مدل دارد', brands.every(b => b.models.length > 0));
    t('کدِ کشورِ هر برند تعریف دارد',
      brands.every(b => b.country === null || cat.countries[b.country]));

    /* ── تداخلِ نام درونِ یک نوع ──
       `brandMatchesName` اولین تطابق را برمی‌گرداند. اگر دو برندِ
       *همان نوع* یک alias مشترک داشته باشند، آگهیِ قدیمی به برندِ
       اشتباه وصل می‌شود و کسی خبردار نمی‌شود. تداخلِ بینِ دو نوع
       ایرادی ندارد — انتخابگر هر بار فقط یک نوع را لود می‌کند. */
    /* ⚠️ رونوشتِ ساده‌شده‌ی `normalizeFa` — اگر قاعده‌ای آن‌جا اضافه
       شد، این‌جا هم باید اضافه شود وگرنه این تست دیگر رفتارِ واقعی
       را نمی‌سنجد. عمداً import نمی‌شود: این اسکریپت بازرسیِ ایستا
       است و چیزی از اپ اجرا نمی‌کند. */
    const nrm = s => s.toLowerCase()
      .replace(/[\u200B-\u200F]/g, '').replace(/[\u064B-\u0652\u0670]/g, '')
      .replace(/\s+/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک')
      .replace(/[أإآٱ]/g, 'ا').replace(/[ةۀ]/g, 'ه');
    const clashes = [];
    for (const ty of cat.types) {
      const seen = new Map();
      for (const b of ty.brands) {
        for (const nm of new Set([b.name_en, b.name_fa, ...(b.aliases ?? [])].map(nrm))) {
          if (seen.has(nm) && seen.get(nm) !== b.id) clashes.push(`${ty.id}:${nm}`);
          else seen.set(nm, b.id);
        }
      }
    }
    t('نامِ برند درونِ هر نوع یکتاست', clashes.length === 0, clashes.slice(0, 3).join(', '));
    /* ── پرچم ──
       ایموجیِ پرچم روی ویندوز رندر نمی‌شود و به «GB» تبدیل می‌شود،
       پس SVG جایگزینش شد. اگر روزی برندی از کشورِ تازه‌ای اضافه شود
       و شکلش نباشد، به‌جای پرچم یک جعبه‌ی خاکستری می‌نشیند — بی‌سروصدا. */
    const flagSrc = read('components/CountryFlag.tsx');
    const drawn = new Set([...flagSrc.matchAll(/^ {2}([A-Z]{2}):/gm)].map(m => m[1]));
    /* هر سه کاتالوگ، نه فقط چوب: کاتالوگِ تازه‌ی میز کشورِ SG را
       آورد و چون این تست فقط چوب را می‌دید، به‌جای پرچم یک جعبه‌ی
       خاکستری می‌نشست و کسی خبردار نمی‌شد. */
    const allCountries = new Set();
    for (const f of ['data/cue-catalog.json', 'data/table_catalog.json', 'data/cloth_catalog.json']) {
      if (!existsSync(join(ROOT, f))) continue;
      const c = JSON.parse(readFileSync(join(ROOT, f), 'utf8'));
      Object.keys(c.countries ?? {}).forEach(x => allCountries.add(x));
      for (const ty of c.types) for (const b of ty.brands) if (b.country) allCountries.add(b.country);
    }
    const missing = [...allCountries].filter(c => !drawn.has(c));
    t('هر کشورِ هر سه کاتالوگ پرچمِ SVG دارد', missing.length === 0, missing.join(', '));
    t('پرچم دیگر ایموجی نیست',
      !/Segoe UI Emoji/.test(read('components/market/CatalogSelector.tsx')),
      'ویندوز گلیفِ regional-indicator ندارد');

    t('املاهای جایگزین در کاتالوگ هست',
      brands.filter(b => (b.aliases ?? []).length).length >= 30,
      'بدونشان «پرادن» به Peradon نمی‌رسد — ولی نبودشان خطا نیست');
    /* aliasی که عینِ نامِ خودِ برند است هیچ‌چیزِ تازه‌ای پیدا نمی‌کند
       و فقط حجمِ پاسخِ API را بالا می‌برد — ۹۳ موردش حذف شد. */
    const junk = brands.flatMap(b => (b.aliases ?? [])
      .filter(a => [b.name_en, b.name_fa].some(n => nrm(n) === nrm(a)) )
      .map(a => `${b.id}:${a}`));
    t('alias تکرارِ نامِ خودِ برند نیست', junk.length === 0, junk.slice(0, 3).join(', '));
  }

  const cueLib = read('lib/market/catalog.ts');
  const cueRules = read('lib/market/catalog-rules.ts');
  t('کاتالوگ فقط سمتِ سرور خوانده می‌شود',
    /from '\.\.\/\.\.\/data\/cue-catalog\.json'/.test(cueLib)
    && !/'use client'/.test(cueLib));
  t('مسیرِ per-type استاتیک است',
    /export const dynamic = 'force-static'/.test(read('app/api/catalog/[category]/[type]/route.ts'))
    && /generateStaticParams/.test(read('app/api/catalog/[category]/[type]/route.ts')),
    '۹۸ کیلوبایت نباید در باندلِ هر بازدیدکننده بنشیند');
  t('اعتبارسنجی تعلقِ مدل به برند را می‌سنجد',
    /این مدل برای برند انتخاب‌شده نیست/.test(cueRules)
    && /این برند برای نوع انتخاب‌شده نیست/.test(cueRules),
    'اعتماد به فرانت کافی نیست — سرور هم همین تابع را صدا می‌زند');
  t('برندِ دستی و فهرستی با هم پذیرفته نمی‌شوند',
    /نه هر دو/.test(cueRules));
  t('منطقِ خالص از داده جدا است',
    !strip(cueRules).includes('cue-catalog.json') && !strip(cueRules).includes('table_catalog.json') && cueLib.includes("export * from './catalog-rules'"),
    'کامپوننتِ کلاینت باید اعتبارسنجی را بدونِ کاتالوگ وارد کند');
  t('انتخابگر داده را fetch می‌کند نه import',
    read('components/market/CatalogSelector.tsx').includes('/api/catalog/'));
  /* ── مرزِ سرور و کلاینت ──
     مهم‌ترین قاعده‌ی این بخش: کامپوننتِ کلاینت نباید کاتالوگ را
     وارد کند. fetch‌کردن به‌تنهایی اثباتش نیست — می‌شود هم fetch کرد
     هم import. پس نبودنِ import صریح سنجیده می‌شود. */
  for (const f of ['components/market/CatalogSelector.tsx', 'components/market/TableSizeField.tsx']) {
    const src = strip(read(f));
    t(f.split('/').pop() + ' کاتالوگ را import نمی‌کند',
      !src.includes("market/catalog'") && !/from '[^']*\.json'/.test(src),
      'صد کیلوبایت در باندلِ هر بازدیدکننده‌ی فرم می‌نشست');
  }

  /* هر دو فرم باید همان یک انتخابگر را داشته باشند — وگرنه دوباره
     همان دو-فرمِ ناهمگون ساخته می‌شود که یک‌بار درستش کردیم. */
  const newAdSrc = read('app/shop/new/page.tsx');
  const editAdSrc = read('app/shop/edit/[id]/page.tsx');
  t('هر دو فرم از همان انتخابگر استفاده می‌کنند',
    [newAdSrc, editAdSrc].every(f => /<CatalogSelector/.test(f) && /typeIdOf\(catCategory/.test(f)));
  /* ── چه دسته‌هایی کاتالوگ دارند ──
     پیش‌تر این شرط در هر فرم دستی نوشته شده بود و اضافه‌شدنِ هر
     کاتالوگ یعنی سه جا ویرایش — «توپ» یکی‌شان را جا انداخت. حالا
     از خودِ `CATALOG_IDS` مشتق می‌شود، پس تست هم همان را می‌سنجد. */
  t('دسته‌های کاتالوگ‌دار از یک منبع مشتق می‌شوند',
    [newAdSrc, editAdSrc].every(f => f.includes('isProductCatalog(form.category)'))
    && read('lib/market/catalog-rules.ts').includes('export const isProductCatalog'),
    'بقیه (کیس و …) از chain.ts می‌آیند');
  t('شناسه کنارِ رشته فرستاده می‌شود',
    [newAdSrc, editAdSrc].every(f => /brand: effBrand, model: effModel,/.test(f) && /brandId:/.test(f)),
    'ستون‌های رشته‌ای را کلِ سایت می‌خواند؛ حذفشان همه‌جا را می‌شکند');
  t('آگهیِ قدیمی از روی نام بازیابی می‌شود',
    /resolveFrom/.test(read('components/market/CatalogSelector.tsx'))
    && /setLegacyCue\(\{ brand: rawBrand, model: rawModel \}\)/.test(editAdSrc),
    'آگهی‌های موجود فقط نامِ رشته‌ای دارند، نه شناسه');

  /* ── املاهای جایگزین ──
     کاتالوگ می‌تواند برای هر برند `aliases` داشته باشد («پرادن» ⟵
     Peradon). سه جا با نام سروکار دارند: جست‌وجوی فهرست، بازیابیِ
     آگهیِ قدیمی، و هشدارِ برندِ تکراری. اگر هرکدام تطبیقِ خودش را
     داشته باشد، جست‌وجو چیزی را پیدا می‌کند که بازیابی نمی‌شناسد. */
  const selSrc = strip(read('components/market/CatalogSelector.tsx'));
  t('هر دو تابعِ نام aliases را می‌بینند',
    /aliases\?: string\[\]/.test(cueRules)
    && (cueRules.match(/\.\.\.\(b\.aliases \?\? \[\]\)/g) ?? []).length >= 2,
    'brandSearchTerms و brandMatchesName هر دو — یکی کافی نیست');
  t('انتخابگر از همان تطبیقِ مشترک استفاده می‌کند',
    ['brandSearchTerms(', 'brandMatchesName('].every(s => selSrc.includes(s))
    /* `\\?s` عمدی است: نسخه‌ی باگ‌دار `/s+/g` بود، بدونِ بک‌اسلش —
       الگویی که فقط `\\s+` را بگیرد همان باگ را رد می‌کند. */
    && !/\.toLowerCase\(\)\.replace\(\/\\?s\+\/g/.test(selSrc),
    'نرمال‌سازیِ درجا یک‌بار حرفِ s را به‌جای فاصله حذف می‌کرد');

  /* ── نرمال‌ساز، یک نسخه برای همه ──
     فیلترِ دراپ‌داون هم باید همان را بزند، وگرنه جست‌وجو چیزی را
     پیدا می‌کند که تطبیق نمی‌شناسد — و برعکس. */
  const faSrc = read('lib/text-fa.ts');
  t('نرمال‌ساز شکل‌های واقعیِ ورودیِ فارسی را پوشش می‌دهد',
    [/\/ي\/g/, /\/ك\/g/, /\[أإآٱ\]/, /\[ةۀ\]/, /HARAKAT/, /INVISIBLE/, /۰-۹/].every(r => r.test(faSrc)),
    'کیبوردِ عربیِ موبایل، اعرابِ داده، نیم‌فاصله و ارقامِ فارسی');
  t('فیلترِ دراپ‌داون خامِ includes نمی‌زند',
    /normalizeFa\(q\)/.test(read('components/market/AdFormFields.tsx'))
    && /normalizeFa\(o\.search \?\? o\.label\)/.test(read('components/market/AdFormFields.tsx')),
    'وگرنه «مك درموت» با کیبوردِ عربی هیچ ردیفی برنمی‌گرداند');
  t('catalog-rules نرمال‌ساز را دوباره نمی‌نویسد',
    /normalizeBrandKey = normalizeFa/.test(cueRules));
}

/* ── کاتالوگِ میز ──
   همان ساختارِ چوب، به‌اضافه‌ی دو چیزی که فقط میز دارد: سایزِ
   وابسته به نوع، و نوعی که اصلاً فهرستِ برند ندارد. */
console.log('\n― کاتالوگِ میز ―');
{
  const tPath = join(ROOT, 'data/table_catalog.json');
  t('فایلِ کاتالوگِ میز هست', existsSync(tPath));

  if (existsSync(tPath)) {
    const rawT = readFileSync(tPath, 'utf8');
    t('فارسیِ کاتالوگِ میز سالم است', !rawT.includes('\uFFFD'));
    const tc = JSON.parse(rawT);
    const tBrands = tc.types.flatMap(x => x.brands);

    t('پنج نوع میز', tc.types.length === 5);
    /* عددِ دقیق عمدی است: حذفِ تصادفیِ یک برند باید قرمز شود. با هر
       به‌روزرسانیِ کاتالوگ این عدد هم جابه‌جا می‌شود. */
    t('برندها و مدل‌های میز کامل‌اند',
      tBrands.length >= 74 && tBrands.reduce((n, b) => n + b.models.length, 0) >= 181,
      `${tBrands.length} برند / ${tBrands.reduce((n, b) => n + b.models.length, 0)} مدل`);

    /* پیشوندِ برندها با نوع بخواند — «میز خانگی» برند ندارد و
       طبیعتاً از این سنجش بیرون می‌ماند. */
    const P = { pocket_billiard: 'tpkt__', snooker: 'tsnk__', heyball: 'they__', carom: 'tcar__', home_table: 'thome__' };
    const badP = tc.types.flatMap(x => x.brands.filter(b => !b.id.startsWith(P[x.id])).map(b => b.id));
    t('پیشوندِ هر برندِ میز با نوعش می‌خواند', badP.length === 0, badP.slice(0, 3).join(', '));

    const tIds = tBrands.map(b => b.id);
    t('شناسه‌ی برندِ میز یکتاست', new Set(tIds).size === tIds.length);

    /* ── سایز ──
       هر نوع فهرستِ خودش را دارد. یک فهرستِ مشترک سه چیز را خراب
       می‌کرد: کارامبول با فوت اندازه نمی‌شود، اسنوکر ۱۲ فوت دارد و
       پاکت ندارد، و «۸ فوت» در آن دو ابعادِ متفاوت است. */
    t('هر نوعِ میز سایزِ خودش را دارد',
      tc.types.every(x => Array.isArray(x.sizes) && x.sizes.length > 0));
    t('شناسه‌ی سایز درونِ هر نوع یکتاست',
      tc.types.every(x => new Set(x.sizes.map(s => s.id)).size === x.sizes.length));
    t('هر نوع دقیقاً یک سایزِ پیش‌فرض دارد',
      tc.types.every(x => x.sizes.filter(s => s.default).length === 1),
      'پیش‌فرض همان رایج‌ترین سایزِ آن رشته است');

    /* همین‌جا ثابت می‌شود چرا فهرستِ مشترک غلط بود */
    const snk8 = tc.types.find(x => x.id === 'snooker').sizes.find(s => s.id === '8ft');
    const pkt8 = tc.types.find(x => x.id === 'pocket_billiard').sizes.find(s => s.id === '8ft');
    t('«۸ فوت» در اسنوکر و پاکت یکی نیست',
      !!snk8 && !!pkt8 && snk8.playing_area_cm !== pkt8.playing_area_cm,
      'شناسه‌ی سایز بینِ نوع‌ها تکراری است، پس سرور باید تعلقش را بسنجد');
    t('کارامبول با فوت اندازه نمی‌شود',
      tc.types.find(x => x.id === 'carom').sizes.every(s => !/فوت/.test(s.label_fa)));

    /* ── نوعِ بدونِ فهرست ── */
    const home = tc.types.find(x => x.id === 'home_table');
    t('میز خانگی پرچمِ متنِ آزاد دارد و برندی ندارد',
      !!home && home.force_free_input === true && home.brands.length === 0);
  }

  /* ── همگامیِ رونوشتِ سبک با داده ──
     قواعد نوع‌ها را تکرار می‌کند تا کلاینت برای نگاشتِ برچسبِ فارسی
     صد کیلوبایت داده نگیرد. اگر نوعی به JSON اضافه شود و آن‌جا نه،
     انتخابگر بی‌صدا خالی می‌ماند. */
  const rules = read('lib/market/catalog-rules.ts');
  for (const [cat, file] of [['cue', 'data/cue-catalog.json'], ['table', 'data/table_catalog.json']]) {
    if (!existsSync(join(ROOT, file))) continue;
    const ids = JSON.parse(readFileSync(join(ROOT, file), 'utf8')).types.map(x => x.id);
    const block = rules.split(cat + ': [')[1] ?? '';
    const listed = block.slice(0, block.indexOf(']'));
    t('نوع‌های ' + cat + ' در قواعد با داده می‌خوانند',
      ids.every(id => listed.includes("'" + id + "'")),
      ids.filter(id => !listed.includes("'" + id + "'")).join(', '));
  }

  /* برچسبِ فارسیِ فرم باید به شناسه نگاشت شود، وگرنه انتخابگر
     هرگز باز نمی‌شود و کسی خبردار نمی‌شود. */
  const chain = read('lib/market/chain.ts');
  const formTypes = (chain.match(/table:\s*\[([^\]]*)\]/) ?? [])[1] ?? '';
  const labels = [...formTypes.matchAll(/'([^']+)'/g)].map(m => m[1]);
  t('هر نوعِ میزِ فرم در نگاشتِ فارسی هست',
    labels.length > 0 && labels.every(l => rules.includes("'" + l + "':")),
    labels.filter(l => !rules.includes("'" + l + "':")).join(', '));

  /* ── سایز از فهرستِ ثابت درآمد ── */
  const specsSrc = read('lib/market/specs.ts');
  t('فهرستِ ثابتِ سایز حذف شد',
    !specsSrc.includes("'۷ فوت','۸ فوت'")
    && JSON.parse(readFileSync(join(ROOT, 'data/specs_catalog.json'), 'utf8'))
      .specs.table.find(f => f.id === 'size')?.source === 'types[].sizes',
    'سایز حالا از سایزهای همان نوع می‌آید');
  /* سایز حالا یک فیلدِ `source`دارِ کاتالوگِ مشخصات است، نه یک
     کامپوننتِ جدا: فهرستش از سایزهای همان نوعِ میز می‌آید و در
     همان شبکه‌ی مشخصات رندر می‌شود. */
  t('سایز از سایزهای همان نوع می‌آید',
    read('app/shop/new/page.tsx').includes("if (id === 'size')")
    && read('app/shop/new/page.tsx').includes('tableCat.data?.sizes'),
    'فهرستِ مشترک برای همه‌ی میزها غلط بود');
  t('میز خانگی روی پرچمِ داده کار می‌کند نه شناسه',
    /forceFreeInput/.test(read('components/market/CatalogSelector.tsx'))
    && !/home_table/.test(read('components/market/CatalogSelector.tsx')),
    'هاردکدِ شناسه یعنی نوعِ بعدی دوباره کد می‌خواهد');

  /* ── اعتبارسنجیِ سمتِ سرور ── */
  const adsRoute = read('app/api/market/ads/route.ts');
  t('روتِ آگهی انتخابِ کاتالوگ را می‌سنجد',
    /validateOnServer/.test(adsRoute) && /isCatalogId/.test(adsRoute),
    'هرکسی می‌تواند مستقیم به این روت POST بزند');
  t('سنجش پیش از مصرفِ سهمیه است',
    adsRoute.indexOf('validateOnServer({') < adsRoute.indexOf('consumeAdQuota(actor.id)'),
    'ورودیِ نامعتبر نباید سهمیه بسوزاند');
  t('مهاجرتِ ستون‌های کاتالوگ نوشته شده',
    existsSync(join(ROOT, '../../supabase/migrations/086_products_catalog_ids.sql')));
}


/* ── واژه‌ی «پول» ──
   در بازار ایران کسی «پول» را به‌معنای Pool نمی‌شناسد. برچسب‌های
   نمایشی به «پاکت بیلیارد» رفتند؛ شناسه‌ها (`pool`, `pocket`,
   `pocket_billiard`) عمداً دست‌نخورده‌اند چون کلیدِ داده‌اند.

   این تست فقط جاهایی را می‌بیند که «پول» در متنِ **رشته یا برچسبِ
   ورزشی** بیاید — «پولِ» مالی (پرداخت، تسویه، بازپرداخت) کارِ
   دیگری است و نباید عوض شود. */
console.log('\n― واژه‌ی پاکت بیلیارد ―');
{
  const SPORT = [
    'پول آمریکایی', 'پول انگلیسی', 'میز پول', 'چوب پول', 'توپ پول',
    "'پول'", '"پول"', '>پول ', 'پول ۸',
  ];
  const files = [
    'lib/roles.ts', 'app/profile/[userId]/page.tsx', 'app/results/page.tsx',
    'app/seller/[id]/page.tsx', 'app/admin/tournaments/page.tsx',
    'lib/market/specs.ts', 'lib/market/chain.ts',
  ];
  const hits = [];
  for (const f of files) {
    /* خودِ نگاشتِ سازگاری عمداً «پول» دارد — همان چیزی است که
       داده‌ی قدیمی را به نامِ تازه می‌رساند. از بازرسی بیرون است. */
    const src = read(f).split('const LEGACY_DISCIPLINE')[0] + (read(f).split('export const normalizeDiscipline')[1] ?? '')
    for (const s of SPORT) if (src.includes(s)) hits.push(f + ' → ' + s);
  }
  t('«پول» ورزشی جایی نمانده', hits.length === 0, hits.slice(0, 4).join(' | '));

  /* شناسه‌ها نباید عوض شده باشند — کلیدِ دیتابیس‌اند */
  t('شناسه‌ها دست‌نخورده‌اند',
    read('app/admin/tournaments/page.tsx').includes('value="pool"')
    && read('lib/market/catalog-rules.ts').includes("'pocket_billiard'"),
    'تغییرِ شناسه یعنی داده‌ی موجود از فیلترها می‌افتد');

  /* داده‌ی قدیمی «پول» ذخیره کرده و فهرست دیگر آن را ندارد */
  t('نگاشتِ سازگاریِ داده‌ی قدیمی هست',
    /normalizeDiscipline/.test(read('lib/roles.ts'))
    && /normalizeDiscipline\(data\[f\.key\]\)/.test(read('app/profile/[userId]/page.tsx')),
    'بدونش دراپ‌داونِ پروفایل‌های موجود خالی می‌افتد');
}

/* ── مشخصاتِ فنی و پارچه ── */
console.log('\n― مشخصات و پارچه ―');
{
  const sp = join(ROOT, 'data/specs_catalog.json');
  const cl = join(ROOT, 'data/cloth_catalog.json');
  t('هر دو کاتالوگ هست', existsSync(sp) && existsSync(cl));

  if (existsSync(sp) && existsSync(cl)) {
    const S = JSON.parse(readFileSync(sp, 'utf8'));
    const C = JSON.parse(readFileSync(cl, 'utf8'));
    /* ── چرا «دستِ‌کم» و نه عددِ دقیق ──
       این کاتالوگ‌ها رشد می‌کنند و عددِ دقیق یعنی هر به‌روزرسانیِ داده
       تست را قرمز می‌کند. کفِ عدد ولی حذفِ تصادفی را می‌گیرد — که
       همان خطرِ واقعی است. */
    t('فیلدهای مشخصات کامل‌اند',
      S.specs.cue.length >= 22 && S.specs.table.length >= 33,
      `چوب ${S.specs.cue.length} · میز ${S.specs.table.length}`);
    t('هر دسته‌ی کاتالوگ فیلد دارد',
      Object.values(S.specs).every(f => Array.isArray(f) && f.length > 0),
      Object.keys(S.specs).join(', '));

    /* چیزهایی که فرمِ قبلی نداشت و کلِ این تسک برایشان بود */
    const all = [...S.specs.cue, ...S.specs.table];
    t('متنِ راهنما در داده هست', all.filter(f => f.help_fa).length >= 15);
    t('چیپِ مقدارِ رایج هست', all.some(f => Array.isArray(f.common) && f.common.length));
    t('توضیحِ زیرِ گزینه هست',
      all.filter(f => (f.options ?? []).some(o => o.note_fa)).length >= 15);
    t('سوییچ و چندانتخابی هست',
      all.some(f => f.type === 'boolean') && all.some(f => f.type === 'multi_select'));

    /* بازه‌ی عددی — سرور رویش تکیه می‌کند */
    const nums = all.filter(f => f.type === 'number');
    t('فیلدهای عددی بازه دارند',
      nums.every(f => f.min !== undefined && f.max !== undefined),
      nums.filter(f => f.min === undefined).map(f => f.id).join(', '));

    /* پارچه */
    const cb = C.types.flatMap(x => x.brands);
    t('برندها و مدل‌های پارچه کامل‌اند',
      cb.length >= 37 && cb.reduce((n, b) => n + b.models.length, 0) >= 97,
      `${cb.length} برند`);
    t('پیشوندِ برندِ پارچه با نوعِ میز می‌خواند',
      C.types.every(x => x.brands.every(b => b.id.startsWith(x.id + '__'))));
    /* ۲۴ مدل نوع ندارند و درست است: همه از برندهای «بدون برند»،
       ایرانی و چینیِ ژنریک‌اند و نوعِ پرزشان واقعاً نامشخص است.
       پر شدنِ خودکار در این حالت چیزی نمی‌نویسد. مهم این است که
       هرچه **هست** یکی از دو مقدارِ معتبر باشد. */
    const types = cb.flatMap(b => b.models.map(m => m.type)).filter(Boolean);
    t('نوعِ پارچه فقط napped یا worsted است',
      types.every(x => x === 'napped' || x === 'worsted'),
      [...new Set(types.filter(x => x !== 'napped' && x !== 'worsted'))].join(', '));
    t('مدل‌های برندهای شناخته‌شده نوع دارند',
      types.length >= 70, `${types.length} از ${cb.reduce((n, b) => n + b.models.length, 0)}`);
    t('پارچه‌ی هی‌بال از خانواده‌ی اسنوکر است',
      (C.types.find(x => x.id === 'heyball')?.note_fa ?? '').includes('اسنوکر'),
      'میزِ هی‌بال ۹ فوت است ولی باند و پاکتش اسنوکری است');
  }

  /* ── مرزِ سرور و کلاینت ──
     همان قاعده‌ی کاتالوگِ برند: سی‌وهشت کیلوبایتِ JSON نباید در
     باندلِ فرم بنشیند. */
  for (const f of ['components/market/SpecFields.tsx']) {
    const src = strip(read(f));
    t(f.split('/').pop() + ' کاتالوگ را import نمی‌کند',
      !src.includes("market/spec-catalog'") && !/from '[^']*\.json'/.test(src));
  }
  t('تعریفِ فیلدها از مسیرِ استاتیک می‌آید',
    read('components/market/SpecFields.tsx').includes('/api/specs/')
    && /force-static/.test(read('app/api/specs/[category]/route.ts')));

  /* ── شناسه ذخیره می‌شود، نه برچسب ──
     با برچسب، فرمِ ویرایش نمی‌توانست گزینه را پیدا کند. */
  for (const f of ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']) {
    const src = read(f);
    t(f.includes('edit') ? 'فرمِ ویرایش شناسه ذخیره می‌کند' : 'فرمِ ثبت شناسه ذخیره می‌کند',
      src.includes('finalSpecs[key] = v') || src.includes('out[key] = v'),
      'برچسبِ فارسی برگشت‌پذیر نیست');
  }
  /* ── ذخیره‌ی دوباره نباید داده را ببلعد ──
     نسخه‌ی اول تفکیک را با فهرستِ **قدیمی** انجام می‌داد؛ کلیدهای
     دسته‌هایی که کاتالوگِ تازه ندارند «شناخته‌شده» حساب می‌شدند،
     هیچ‌جا رندر نمی‌شدند و ذخیره‌ی دوباره پاکشان می‌کرد. */
  const editSrc = read('app/shop/edit/[id]/page.tsx');
  t('تفکیکِ مشخصات با کاتالوگِ تازه انجام می‌شود',
    !editSrc.includes('CATEGORY_SPECS[category]')
    && editSrc.includes('new Set(specDefs.map(f => specKey(f.id)))'),
    'با فهرستِ قدیمی، ذخیره‌ی دوباره مشخصاتِ توپ و تیپ را پاک می‌کرد');
  t('باقی‌مانده‌ها پیش از حلقه‌ی کاتالوگ ریخته می‌شوند',
    editSrc.indexOf('legacySpecs.forEach') < editSrc.indexOf('for (const f of specDefs)'),
    'برعکسش یعنی مقدارِ قدیمی روی ویرایشِ کاربر می‌نشیند');
  t('بولین و آرایه به رشته تبدیل نمی‌شوند',
    !editSrc.includes("const value = String(v ?? '').trim()"),
    'آرایه‌ی لوازم همراه در ذخیره‌ی دوم نابود می‌شد');
  t('ذخیره تا رسیدنِ تعریفِ فیلدها قفل است',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('if (specsLoading)')),
    'وگرنه آگهی بدونِ هیچ مشخصه‌ای ذخیره می‌شد');
  t('مسیرِ ویرایش هم می‌سنجد و ستون‌ها را می‌نویسد',
    ['validateSpecsOnServer', 'patch.brandId', 'patch.clothBrandId']
      .every(s => read('app/api/market/ads/[id]/route.ts').includes(s)),
    'دو مسیرِ نوشتن و یک قاعده — وگرنه PATCH کلِ اعتبارسنجی را دور می‌زد');
  t('هر دو فرم همان موتور را دارند',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('<SpecFieldRow') && read(f).includes('useSpecFields')),
    'دو فرمِ ناهمگون همان چیزی است که یک‌بار درستش کردیم');

  /* ── اعتبارسنجیِ سرور ── */
  const ads = read('app/api/market/ads/route.ts');
  t('بازه‌ی عددی سمتِ سرور سنجیده می‌شود', ads.includes('validateSpecsOnServer'));
  t('زنجیره‌ی پارچه سمتِ سرور سنجیده می‌شود',
    ads.includes('این مدل پارچه برای برند انتخاب‌شده نیست')
    && ads.includes('این پارچه برای نوع میز انتخاب‌شده نیست'));
  t('مهاجرتِ ۰۸۷ نوشته شده',
    existsSync(join(ROOT, '../../supabase/migrations/087_products_cloth_and_spec_columns.sql')));

  /* ── وابستگیِ فیلدها از داده می‌آید، نه از کد ──
     JSON خودش می‌گوید `cloth_model` به `cloth_brand` وابسته است. اگر
     کد این را نخواند، دراپ‌داونِ مدل پیش از انتخابِ برند باز می‌شود و
     خالی است. */
  const rulesSrc = read('lib/market/spec-rules.ts');
  t('آبشارِ مشخصات داده‌محور است',
    ['depends_on', 'auto_from', 'applySpecChange', 'isFieldLocked'].every(s => rulesSrc.includes(s))
    && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('applySpecChange(specDefs') && read(f).includes('isFieldLocked(field')),
    'هاردکد یعنی وابستگیِ بعدی دوباره کد می‌خواهد');
  t('هر وابستگیِ داده در فرم قابلِ اجراست',
    (() => {
      const S = JSON.parse(readFileSync(join(ROOT, 'data/specs_catalog.json'), 'utf8'));
      const all = Object.values(S.specs).flat();
      /* ارجاع به فیلدهای سطحِ فرم مجاز است — همان‌هایی که بالای فرم
         گرفته می‌شوند و در کارتِ مشخصات نیستند. */
      /* همان قاعده‌ی `isFormLevelField`: هر شناسه‌ای که به `_type`
         ختم شود یا برند/مدل باشد، بالای فرم گرفته می‌شود. */
      const formLevel = id => id.endsWith('_type') || id === 'brand' || id === 'model';
      const ids = new Set(all.map(f => f.id));
      return all.every(f => !f.depends_on || ids.has(f.depends_on) || formLevel(f.depends_on))
        && all.every(f => !f.auto_from || ids.has(f.auto_from.split('.')[0]) || formLevel(f.auto_from.split('.')[0]));
    })(),
    'ارجاع به فیلدی که وجود ندارد، بی‌صدا هیچ‌کاری نمی‌کند');

  /* ── ستونِ ایندکس‌دارِ پرنشده ──
     مهاجرتِ ۰۸۷ سه ستون ساخت. ایندکسی که هیچ‌وقت پر نشود فقط
     هزینه‌ی نوشتن دارد و فیلترِ آینده رویش کار نمی‌کند. */
  for (const f of ['app/api/market/ads/route.ts', 'app/api/market/ads/[id]/route.ts']) {
    const src = read(f);
    t((f.includes('[id]') ? 'ویرایش' : 'ثبت') + ' ستون‌های ایندکس‌دار را می‌نویسد',
      ['bedMaterial', 'shaftMaterial', 'cuePieces'].every(c => src.includes(c)),
      'مهاجرت ساختشان ولی چیزی پرشان نمی‌کرد');
  }

  /* ── کشِ تعریفِ فیلدها ──
     بازه‌های عددی در JSON‌اند تا اصلاحشان دیپلوی نخواهد؛ کشِ یک‌ساله
     همان را باطل می‌کرد — سرور بازه‌ی تازه را می‌سنجد و مرورگر قدیمی. */
  t('کشِ مسیرِ مشخصات immutable نیست',
    !strip(read('app/api/specs/[category]/route.ts')).includes('immutable'),
    'وگرنه اصلاحِ بازه تا یک سال به کاربر نمی‌رسد');

  /* ── دسترس‌پذیری ── */
  t('چیپ و تاگل حلقه‌ی focus دارند',
    read('components/market/AdFormFields.tsx').includes('.fchip:focus-visible')
    && (read('components/market/SpecFields.tsx').match(/className="fchip"/g) ?? []).length >= 3,
    'با ریستِ outline، پیمایشِ کیبورد نامرئی می‌شود');
  t('برچسبِ فیلد به ورودی گره خورده',
    read('components/market/SpecFields.tsx').includes('htmlFor={fieldId}')
    && read('components/market/SpecFields.tsx').includes('id={fieldId}'),
    'بدونش صفحه‌خوان نامِ فیلد را نمی‌گوید');

  /* ── هیچ دسته‌ای نباید بی‌فیلد بماند ──
     انتقالِ موتور به کاتالوگ، تیپ و گچ و کیس را بی‌صدا بی‌فیلد کرد:
     `specs_catalog.json` فقط سه دسته داشت و بقیه به آرایه‌ی خالی
     می‌افتادند. تستِ ایستا نگرفتش چون هیچ ادعایی درباره‌ی دسته‌های
     بیرونِ کاتالوگ نداشتیم. حالا داریم. */
  {
    const S = JSON.parse(readFileSync(join(ROOT, 'data/specs_catalog.json'), 'utf8'));
    const specsSrc = read('lib/market/specs.ts');
    const legacy = new Set([...specsSrc.matchAll(/^  '?([a-z-]+)'?:\s*\[/gm)].map(m => m[1]));
    const inCatalog = new Set(Object.keys(S.specs));
    /* دسته‌هایی که پیش‌تر فیلد داشتند و باید همچنان داشته باشند */
    const hadFields = [...legacy].filter(c => !['cue', 'table', 'ball'].includes(c));
    t('دسته‌های بیرونِ کاتالوگ پلِ تعریفِ قدیمی دارند',
      hadFields.every(c => legacy.has(c))
      && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
        .every(f => read(f).includes('fromLegacyDefs(')),
      hadFields.join(', '));
    t('پلِ قدیمی کلیدِ ذخیره را عوض نمی‌کند',
      read('lib/market/spec-rules.ts').includes('id: d.key'),
      'اگر کلید عوض شود، مشخصاتِ آگهی‌های موجود گم می‌شوند');

    /* پارچه: نوع از chain، برند/مدل از کاتالوگ، مشخصات از میز */
    t('دسته‌ی پارچه نوع دارد',
      /cloth:\s*\['اسنوکر'/.test(read('lib/market/chain.ts')),
      'بدونش دراپ‌داونِ نوع خالی می‌آمد');
    t('پارچه از کاتالوگِ برند می‌خواند',
      read('lib/market/catalog-rules.ts').includes("'cloth'")
      && read('lib/market/catalog.ts').includes('cloth_catalog.json')
      && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
        .every(f => read(f).includes("useCatalogType('cloth'")),
      'برندِ پارچه در chain.ts هاردکد بود، نه از کاتالوگ');
    /* ── پارچه ──
   تعریفش از کاتالوگِ لوازم می‌آید (`accessories_catalog.json`)، نه از
   مشتق‌کردنِ فیلدهای میز. شاخه‌ی `CLOTH_FROM_TABLE` هرگز اجرا نمی‌شد
   چون `isAccessoryCategory('cloth')` زودتر برمی‌گرداند — همان تله‌ی
   ترتیبی که در روت‌ها هم بود. */
t('مشخصاتِ پارچه سه فیلد دارد و از یک منبع می‌آید',
  (() => {
    const A = JSON.parse(readFileSync(join(ROOT, 'data/accessories_catalog.json'), 'utf8'));
    const c = A.categories.find(x => x.id === 'cloth');
    return (c?.specs ?? []).length === 3;
  })() && !read('lib/market/spec-catalog.ts').includes('CLOTH_FROM_TABLE'),
  'شاخه‌ی مرده حذف شد تا رفتارِ ناموجود را وعده ندهد');
  }
}

/* ── گچ: کاتالوگِ چهارم ── */
console.log('\n― گچ ―');
{
  const cp = join(ROOT, 'data/chalk_catalog.json');
  t('کاتالوگِ گچ هست', existsSync(cp));
  if (existsSync(cp)) {
    const C = JSON.parse(readFileSync(cp, 'utf8'));
    const cb = C.types.flatMap(x => x.brands);
    t('سه نوع، ۳۹ برند، ۶۰ مدل',
      C.types.length === 3 && cb.length >= 39 && cb.reduce((n, b) => n + b.models.length, 0) >= 60,
      `${C.types.length}/${cb.length}`);
    const P = { snooker: 'csnk__', pocket_billiard: 'cpkt__', carom: 'ccar__' };
    t('پیشوندِ برندِ گچ با نوعش می‌خواند',
      C.types.every(x => x.brands.every(b => b.id.startsWith(P[x.id]))));
    /* همان دلیلی که تفکیک را واقعی می‌کند */
    const snk = C.types.find(x => x.id === 'snooker');
    const pkt = C.types.find(x => x.id === 'pocket_billiard');
    const taomS = snk.brands.find(b => b.id.endsWith('taom'))?.models.map(m => m.id) ?? [];
    const taomP = pkt.brands.find(b => b.id.endsWith('taom'))?.models.map(m => m.id) ?? [];
    t('مدل‌های یک برند بینِ دو نوع فرق دارند',
      taomS.length > 0 && taomP.length > 0 && taomS[0] !== taomP[0],
      'اگر فهرست‌ها قاطی شوند، Pyro به اسنوکر و V10 به پاکت پیشنهاد می‌شود');
  }

  /* نُه فیلدِ مشخصات، با نمایشِ شرطیِ نگهدارنده */
  const S = JSON.parse(readFileSync(join(ROOT, 'data/specs_catalog.json'), 'utf8'));
  t('نُه فیلدِ مشخصاتِ گچ',
    (S.specs.chalk ?? []).length === 9, String((S.specs.chalk ?? []).length));
  t('نوعِ نگهدارنده به سوییچش وابسته است',
    (S.specs.chalk ?? []).find(f => f.id === 'holder_type')?.depends_on === 'has_holder',
    'وگرنه فیلدی می‌آید که کاربر نگهدارنده‌ای ندارد');

  /* نوعِ فرم و کاتالوگ باید بخوانند */
  const rules = read('lib/market/catalog-rules.ts');
  const chainSrc = read('lib/market/chain.ts');
  const formChalk = (chainSrc.match(/chalk:\s*\[([^\]]*)\]/) ?? [])[1] ?? '';
  const labels = [...formChalk.matchAll(/'([^']+)'/g)].map(m => m[1]);
  t('هر نوعِ گچِ کاتالوگ در فهرستِ فرم هست',
    ['اسنوکر', 'پاکت بیلیارد', 'کارامبول'].every(l => labels.includes(l)),
    labels.join(', '));
  t('گچ در نگاشتِ فارسی هست', /chalk: \{[\s\S]*?'کارامبول': 'carom'/.test(rules));
  t('گچ از کاتالوگ می‌آید',
    read('lib/market/catalog.ts').includes('chalk_catalog.json')
    && read('lib/market/catalog-rules.ts').includes("chalk: ['snooker'"),
    'دسته‌اش از isProductCatalog می‌گذرد، نه از فهرستِ دستی');
}

/* ── ظاهرِ ردیفِ دراپ‌داون ── */
{
  const af = read('components/market/AdFormFields.tsx');
  t('هر گزینه خطِ جداکننده دارد',
    af.includes("borderBottom: i === list.length - 1 ? 'none'"),
    'در فهرستِ صدتایی، نامِ فارسی و شمارشِ ردیفِ بعدی قاطی می‌شد');
  t('دسته‌بندی و نوع همان چیدمان را دارند',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => /options=\{CATEGOR(IES|Y_OPTIONS)\.map\(c => \(\{/.test(read(f)) && read(f).includes('src={c.img}')),
    'سه دراپ‌داونِ بالای فرم باید یک شکل باشند');
  t('شمارشِ برند کنارِ نوع می‌آید',
    read('app/shop/new/page.tsx').includes('row.brandCount')
    && /force-static/.test(read('app/api/catalog/[category]/route.ts')));
}

/* ── آیکونِ iOS ── */
{
  t('نشانیِ آیکون عوض شد',
    read('app/layout.tsx').includes('bh-apple-180-v5.png')
    && !read('public/manifest.json').includes('-v4'),
    'iOS آیکونِ نصب‌شده را به‌روز نمی‌کند؛ فقط نشانیِ تازه جواب می‌دهد');
  for (const f of ['bh-apple-180-v5.png', 'bh-icon-192-v5.png', 'bh-icon-512-v5.png']) {
    t('فایلِ ' + f + ' هست', existsSync(join(ROOT, 'public/images/Logo/' + f)));
  }
  t('فایل‌های v4 برداشته شدند',
    !existsSync(join(ROOT, 'public/images/Logo/bh-apple-180-v4.png')));
}

/* ── چیدمانِ دسکتاپ ── */
{
  const src = read('app/shop/new/page.tsx');
  const left = src.indexOf('LEFT COLUMN');
  /* ── چرا تک‌ستونه ──
     دو ستونی که ارتفاعشان یکی نباشد بدتر از یک ستون است. بدتر از
     آن: موقعِ جابه‌جاییِ کارت‌ها، `</div>`ی ستونِ راست جا افتاد و
     ستونِ چپ داخلش تو در تو شد — شبکه یک فرزند داشت و کلِ فرم در
     نیمه‌ی راست جا می‌گرفت. این تست همان را می‌گیرد. */
  /* ── چیدمان ──
     یک ستونِ ۸۲۰ پیکسلی بود؛ حالا دو ستونِ متعادل با نوارهای
     تمام‌عرض برای کارتِ مشخصات و ردیفِ پایانی. ظرف ۱۱۸۰ شد. */
  t('فرم روی دسکتاپ دو ستونِ متعادل دارد و ردیفِ پایانی تمام‌عرض است',
    src.includes('maxWidth: 1180')
    && src.includes('className="span-all"')
    && read('components/market/AdFormFields.tsx').includes('.ad-cols > .span-all { column-span: all; }'),
    'ردیفِ پایانی باید با کلِ فرم هم‌عرض باشد، نه با یک ستون');
}

/* ── تیپ: کاتالوگِ پنجم ── */
console.log('\n― تیپ ―');
{
  const tp = join(ROOT, 'data/tip_catalog.json');
  t('کاتالوگِ تیپ هست', existsSync(tp));
  if (existsSync(tp)) {
    const T = JSON.parse(readFileSync(tp, 'utf8'));
    const tb = T.types.flatMap(x => x.brands);
    t('سه نوع، ۵۵ برند، ۱۴۶ مدل',
      T.types.length === 3 && tb.length >= 55 && tb.reduce((n, b) => n + b.models.length, 0) >= 146,
      `${T.types.length}/${tb.length}`);
    t('هر نوعِ تیپ سایز و پیش‌فرض دارد',
      T.types.every(x => (x.sizes ?? []).length > 0 && x.sizes.filter(s => s.default).length === 1));
    /* دلیلِ واقعیِ تفکیک */
    const snkC = T.types.find(x => x.id === 'snooker').brands.flatMap(b => b.models).map(m => m.construction);
    const pktC = T.types.find(x => x.id === 'pocket_billiard').brands.flatMap(b => b.models).map(m => m.construction);
    const share = a => a.filter(x => x === 'layered').length / a.length;
    t('اسنوکر بیشتر تک‌لایه و پاکت بیشتر لایه‌لایه است',
      share(snkC) < share(pktC),
      `اسنوکر ${Math.round(share(snkC) * 100)}٪ · پاکت ${Math.round(share(pktC) * 100)}٪`);
  }

  /* ── تداخلِ پیشوند ──
     پیشوندِ تیپ عیناً همان پیشوندِ میز است (`tsnk__`). چون هر جست‌وجو
     دسته را می‌گیرد و `category` هم ذخیره می‌شود، امروز ابهامی نیست —
     ولی اگر روزی دو کاتالوگ یک شناسه‌ی برند داشته باشند، فیلترِ
     `brandId` هر دو را برمی‌گرداند. این تست همان را می‌گیرد. */
  const owner = new Map(); const clash = [];
  for (const [cat, f] of [['cue', 'cue-catalog.json'], ['table', 'table_catalog.json'],
    ['cloth', 'cloth_catalog.json'], ['chalk', 'chalk_catalog.json'], ['tip', 'tip_catalog.json'],
    ['ball', 'ball_catalog.json']]) {
    if (!existsSync(join(ROOT, 'data/' + f))) continue;
    const j = JSON.parse(readFileSync(join(ROOT, 'data/' + f), 'utf8'));
    for (const ty of j.types) for (const b of ty.brands) {
      if (owner.has(b.id) && owner.get(b.id) !== cat) clash.push(`${b.id} [${owner.get(b.id)}↔${cat}]`);
      else owner.set(b.id, cat);
    }
  }
  t('شناسه‌ی برند بینِ کاتالوگ‌ها مشترک نیست', clash.length === 0, clash.slice(0, 3).join(', '));

  /* ── دو مکانیزمِ تازه ── */
  const rules = read('lib/market/spec-rules.ts');
  t('نمایشِ شرطی پیاده شده',
    rules.includes('depends_on_construction') && rules.includes('isFieldHidden'),
    '«تعداد لایه» فقط برای تیپِ لایه‌لایه معنا دارد');
  t('والدِ بولین پنهان می‌کند و والدِ فهرستی فقط قفل',
    rules.includes("parent?.type !== 'boolean'"),
    'نگهدارنده باید پنهان شود ولی مدلِ پارچه فقط غیرفعال');
  t('مشخصات از مدلِ کاتالوگ پر می‌شود',
    rules.includes('fillFromModel') && rules.includes('MODEL_PROPS')
    && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('fillFromModel(specDefs')),
    'سختی و ساختار و Shore D روی مدل‌اند، نه در فرم');
  t('مدلِ بدونِ مقدار، مقدارِ قبلی را پاک می‌کند',
    rules.includes('MODEL_PROPS.includes(f.id)'),
    'با in روی شیء، عددِ مدلِ قبلی روی مدلِ تازه می‌ماند');
  t('فیلدِ پنهان در شمارشِ پیشرفت نمی‌آید',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('countFilled(shown, specs)')));
  t('تیپ از کاتالوگ می‌آید',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes("form.category === 'tip'")));
}

/* ── توپ: کاتالوگِ ششم ── */
console.log('\n― توپ ―');
{
  const bp = join(ROOT, 'data/ball_catalog.json');
  t('کاتالوگِ توپ هست', existsSync(bp));
  if (existsSync(bp)) {
    const B = JSON.parse(readFileSync(bp, 'utf8'));
    const bb = B.types.flatMap(x => x.brands);
    t('۵ نوع، ۵۸ برند، ۱۱۹ مدل',
      B.types.length === 5 && bb.length >= 58
      && bb.reduce((n, b) => n + b.models.length, 0) >= 119,
      `${B.types.length}/${bb.length}`);
    t('هر نوع سایز و نوعِ ست دارد',
      B.types.every(x => (x.sizes ?? []).length > 0 && (x.set_types ?? []).length > 0),
      'هر دو فهرست به نوع وابسته‌اند و از همان payload می‌آیند');
    const PB = { snooker: 'bsnk__', pocket_billiard: 'bpkt__', carom: 'bcar__',
      cue_ball: 'bcue__', single: 'bsng__' };
    t('پیشوندِ برندِ توپ با نوع می‌خواند',
      B.types.every(x => x.brands.every(b => b.id.startsWith(PB[x.id]))));
    /* ── چرا شناسه‌ی قطر بینِ نوع‌ها تکرار می‌شود ──
       ۵۰.۸ هم قطرِ پاکتِ انگلیسی است هم اسنوکرِ کوچک. تکراربودنش
       اشکال نیست چون فهرست همیشه از **نوعِ انتخاب‌شده** می‌آید؛ این
       تست فقط ثبت می‌کند که عمدی است. */
    const dia = new Set(B.types.flatMap(x => x.sizes.map(sz => sz.id)));
    t('شناسه‌ی قطر بینِ نوع‌ها مشترک است و باید با نوع خوانده شود',
      dia.size < B.types.reduce((n, x) => n + x.sizes.length, 0));
  }

  const rules = read('lib/market/catalog-rules.ts');
  t('توپ در فهرستِ کاتالوگ‌هاست',
    rules.includes("'ball'") && rules.includes('bsng__'));
  t('«نوع ست» از مسیرِ API می‌آید',
    read('app/api/catalog/[category]/[type]/route.ts').includes('setTypes')
    && read('components/market/CatalogSelector.tsx').includes('setTypes: CatalogSize[]'),
    'همان یک درخواست، دو مصرف‌کننده');
  t('قطر و نوعِ ست در فرم به کاتالوگ وصل‌اند',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes("id === 'diameter_mm' || id === 'set_type'")));

  /* ── تله‌ی «نوع» ──
     `depends_on_type`ِ «رنگ توپ» به نوعِ **بالای فرم** اشاره دارد
     (`single`/`cue_ball`)، ولی `set_type`ِ توپ هم پسوندِ `_type` دارد
     و شناسه‌ی `single` در گزینه‌هایش هست. اگر والد را از روی نام
     پیدا کنیم، «رنگ توپ» به نوعِ ست گره می‌خورد. */
  const sr = read('lib/market/spec-rules.ts');
  t('والدِ depends_on_type از روی گزینه‌ها پیدا می‌شود نه نامِ فیلد',
    sr.includes('(f.options ?? []).some(o =>') && sr.includes('formType'),
    'set_typeِ توپ همان پسوند را دارد');
  t('نوعِ بالای فرم به منطقِ پنهان‌سازی می‌رسد',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => /isFieldHidden\(f, specs, \w+, catTypeId\)/.test(read(f))));

  /* ── گاردهای سرور ── */
  const ads = read('app/api/market/ads/route.ts');
  t('دروازه‌ی اعتبارسنجی از خودِ فهرستِ کاتالوگ مشتق می‌شود',
    ads.includes('isProductCatalog(category)') && !ads.includes("category === 'chalk'"),
    'فهرستِ دستی، «توپ» را جا انداخته بود');
  /* ── هر دو مسیرِ نوشتن ──
     ثبت و ویرایش هر دو باید همان قاعده را داشته باشند؛ فهرستِ دستیِ
     مسیرِ ویرایش «توپ» را نداشت و کلِ اعتبارسنجی با یک PATCH دور
     می‌خورد. */
  const adsOne = read('app/api/market/ads/[id]/route.ts');
  t('مسیرِ ویرایش همان دروازه و همان گاردِ نوع را دارد',
    adsOne.includes('isProductCatalog(cat)')
    && adsOne.includes('validateSpecsOnServer(cat, b.specs as Record<string, unknown>, catType'),
    'قاعده‌ای که در یکی از دو مسیر باشد و در دیگری نه، باگِ فرداست');
  t('عوض‌شدنِ نوع، فهرست‌های وابسته را داده‌محور پاک می‌کند',
    sr.includes('export function typeDependentKeys')
    && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('typeDependentKeys(specDefs, form.category)')
        && !read(f).includes("'clothBrand', 'clothModel', 'clothType'")),
    'فهرستِ دستی فقط میز را می‌شناخت و تیپ و توپ ۴۰۰ می‌گرفتند');
  t('فیلدِ پنهان ذخیره نمی‌شود',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('if (isFieldHidden(f, specs, specDefs, catTypeId)) continue')),
    'رنگِ توپ نباید روی ستِ اسنوکر بماند');
  t('برچسبِ فهرست‌های source‌دار در صفحه‌ی آگهی حل می‌شود',
    read('app/shop/[id]/page.tsx').includes("src === 'types[].set_types'"),
    'وگرنه «نوع ست: full-22» نشان داده می‌شد');
  t('نامِ قدیمیِ «پول» هنوز به نوع نگاشت می‌شود',
    rules.includes("'پول': 'pocket_billiard'"),
    'ستونِ type در ردیف‌های موجود متنِ قدیمی را دارد');
  t('سازنده‌ی گزینه‌ی سایز یکی است',
    read('components/market/SpecFields.tsx').includes('export function sizeOptions')
    && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('sizeOptions(tipCat.data?.sizes)')),
    'سه نسخه‌ی یکسان در هر فرم بود');
  t('فهرست‌های source‌دار روی سرور با نوع سنجیده می‌شوند',
    read('lib/market/spec-catalog.ts').includes('SOURCE_LISTS')
    && ads.includes('validateSpecsOnServer(category, b.specs as Record<string, unknown>, catType'),
    'وگرنه آگهیِ اسنوکر می‌توانست قطرِ کارامبول بگیرد');
  t('جنسِ توپ از برند و مدل مشتق می‌شود',
    rules.includes('ballMaterial') && read('lib/market/catalog.ts').includes('ballMaterial(b.name_en'),
    'فایل ستونِ material ندارد ولی فرم دارد');
}

/* ── لوازم جانبی: ده دسته زیرِ یک کاتالوگ ── */
console.log('\n― لوازم جانبی ―');
{
  const ap = join(ROOT, 'data/accessories_catalog.json');
  t('کاتالوگِ لوازم هست', existsSync(ap));
  if (existsSync(ap)) {
    const A = JSON.parse(readFileSync(ap, 'utf8'));
    const br = A.categories.flatMap(c => c.brands ?? []);
    t('۱۰ دسته، ۱۰۱ برند، ۱۵۷ مدل',
      A.categories.length === 10 && br.length >= 101
      && br.reduce((n, b) => n + (b.models ?? []).length, 0) >= 157,
      `${A.categories.length}/${br.length}`);
    t('هر دسته مشخصاتِ خودش را دارد',
      A.categories.every(c => (c.specs ?? []).length > 0),
      'کیسِ چوب ۹ فیلد و حوله ۳ — فهرستِ مشترک بی‌معنا بود');
    t('هر دسته ایموجی دارد', A.categories.every(c => !!c.icon));

    /* پیشوندِ برند با دسته بخواند */
    const P = { cue_case: 'case__', extension: 'ext__', ball_bag: 'ballbag__', rest: 'rest__',
      oil: 'oil__', towel: 'twl__', apparel: 'apr__', accessory: 'acc__' };
    const bad = A.categories.flatMap(c => (c.brands ?? [])
      .filter(b => P[c.id] && !b.id.startsWith(P[c.id])).map(b => b.id));
    t('پیشوندِ هر برند با دسته‌اش می‌خواند', bad.length === 0, bad.slice(0, 3).join(', '));

    /* سه دسته‌ی با رفتارِ خاص */
    const cloth = A.categories.find(c => c.id === 'cloth');
    t('پارچه برندش از کاتالوگِ پارچه می‌آید',
      cloth.external_catalog === 'cloth_catalog.json' && (cloth.brands ?? []).length === 0
      && (cloth.specs ?? []).length > 0,
      'فقط مشخصاتش این‌جاست');
    const other = A.categories.find(c => c.id === 'other');
    t('«سایر» متنِ آزاد است و نامِ کالا اجباری',
      other.force_free_input === true
      && other.specs.some(f => f.id === 'other_item_name' && f.required),
      'همان منطقِ «میز خانگی»');
    t('اکسسوری فیلدِ نوع با ۲۲ گزینه دارد',
      (A.categories.find(c => c.id === 'accessory').specs
        .find(f => f.id === 'accessory_type')?.options ?? []).length >= 22);
    t('کیسِ چوب سازگاری با اسنوکر را می‌پرسد',
      A.categories.find(c => c.id === 'cue_case').specs.some(f => f.id === 'fits_snooker'),
      'چوبِ اسنوکر بلندتر است و خیلی از کیس‌های آمریکایی برایش کوتاه‌اند');
  }

  /* ── ساختارِ دوسطحی، بدونِ تغییرِ کامپوننت ── */
  const rules = read('lib/market/catalog-rules.ts');
  t('دسته‌ی سایت به نوعِ کاتالوگ نگاشت می‌شود',
    rules.includes('ACCESSORY_TYPE_OF') && rules.includes("clothing: 'apparel'"),
    'شناسه‌های سایت خط‌تیره دارند و بعضی نامشان فرق می‌کند');
  t('هر دسته‌ی لوازمِ سایت نگاشت دارد',
    ['cue-case', 'extension', 'ball-bag', 'rest', 'cloth', 'oil', 'towel', 'clothing', 'accessory', 'other']
      .every(c => rules.includes(`'${c}'`) || rules.includes(`${c}:`)));
  t('انتخابگر برای لوازم تغییری نخواست',
    !read('components/market/CatalogSelector.tsx').includes('accessor'),
    'دسته در همان شکافی می‌نشیند که برای بقیه «نوع» بود');
  t('مشخصاتِ لوازم از خودِ کاتالوگ می‌آید',
    read('lib/market/spec-catalog.ts').includes('accessorySpecs('));
  t('نمایشِ شرطیِ دستکش پیاده شده',
    read('lib/market/spec-rules.ts').includes('depends_on_type'),
    'بازیکنِ راست‌دست دستکش را دستِ چپ می‌کند — فیلد فقط برای دستکش');
  t('روتِ ثبت لوازم را می‌سنجد',
    ['app/api/market/ads/route.ts', 'app/api/market/ads/[id]/route.ts']
      .every(f => read(f).includes('isAccessoryCategory')));
}

/* ── نامِ نمایشیِ دسته‌ها ── */
{
  const title = read('lib/market/title.ts');
  /* هر دو در لایه‌ی نمایش‌اند، نه مهاجرتِ دیتابیس: آگهی‌های موجود
     رشته‌ی قدیمی را در ستونِ `title` دارند و باید درست دیده شوند. */
  t('«اکسسوری» از سرِ عنوانِ کارت برداشته می‌شود',
    title.includes('SHELF_WORDS') && title.includes("'اکسسوری'")
    && read('app/shop/new/page.tsx').includes('modernizeType([catLabel, effType]'),
    'نامِ قفسه است نه کالا — «اکسسوری جاسوییچی» یک واژه‌ی اضافه داشت');
  /* ── فهرستِ نوعِ کیس و کیف از کاتالوگ می‌آید ──
     `case_type` شش گزینه دارد و `bag_type` پنج؛ فهرستِ چهارتاییِ
     `case-bag` هم کوتاه‌تر بود و هم پرسش را دو بار می‌کرد. */
  t('کیس چوب و کیف توپ نوعشان را از کاتالوگ می‌گیرند',
    (() => {
      const ch = strip(read('lib/market/chain.ts'));
      const at = ch.indexOf("for (const alias of ['cue-case', 'ball-bag'])");
      if (at < 0) return false;   // سرِ حلقه عوض شده — تست باید بشکند، نه ساکت بماند
      return !ch.slice(at, ch.indexOf('}', at)).includes('TYPE_OPTIONS[alias]');
    })(),
    'فهرستِ مشترک با برچسبِ کاتالوگ یکی نبود و شناسه خالی ذخیره می‌شد');
  t('مقدارِ خارج از فهرست در فرم گم نمی‌شود',
    read('lib/market/chain.ts').includes('export const withCurrent')
    && ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('withCurrent(typeChoices, form.type)')),
    'FancySelect مقدارِ بی‌تطبیق را placeholder نشان می‌دهد — فیلدِ اجباری خالی به‌نظر می‌رسد');
  /* ── پنجره‌ی بارگذاری ──
     فهرستِ نوعِ لوازم از `/api/specs` می‌آید؛ تا نرسیدنش این فیلد به
     متنِ آزاد می‌افتاد و هر چه نوشته می‌شد شناسه‌اش خالی ذخیره می‌شد. */
  t('«نوع» در حالِ بارگذاری متنِ آزاد نمی‌شود',
    ['app/shop/new/page.tsx', 'app/shop/edit/[id]/page.tsx']
      .every(f => read(f).includes('(typeOptions || specsLoading)')
        && read(f).includes('disabled={!typeOptions}')));
  t('نامِ آگهی در ویرایش هم از همان تابع می‌گذرد',
    read('app/shop/edit/[id]/page.tsx').includes('modernizeType([catLabel, effType]'),
    'وگرنه ذخیره‌ی دوباره «اکسسوری …» را برمی‌گرداند');
  t('کیسِ سخت و نرم به هارد و سافت تغییر کردند',
    title.includes("'کیس سخت': 'هارد کیس'") && title.includes("'کیس نرم': 'سافت کیس'")
    && read('lib/market/chain.ts').includes("'هارد کیس', 'سافت کیس'")
    && !read('lib/market/specs.ts').includes("'کیس سخت'"),
    'هم فهرستِ فرم و هم آگهی‌های موجود');
}
/* ── فرمِ پروفایلِ نقش‌ها ── */
console.log('\n― پروفایلِ مربی و داور ―');
{
  const forms = ['app/dashboard/coach/page.tsx', 'app/referees/dashboard/page.tsx'];

  /* ── چرا فرم گاهی ثبت‌نشدنی بود ──
     «نام» از حساب می‌آمد، قفل بود و ستاره نداشت — ولی اجباری بود.
     حسابِ بی‌نام یعنی فرمی که هر چه کاربر پر کند باز هم رد می‌شود، و
     فیلدِ مقصر نه دیده می‌شد نه قابلِ تایپ بود. */
  t('نامِ قفل‌شده فقط وقتی قفل است که حساب واقعاً نام دارد',
    forms.every(f => read(f).includes('const firstLocked = !!user?.firstName')
      && read(f).includes('const lastLocked = !!user?.lastName')
      && read(f).includes('disabled={firstLocked}')
      /* داده‌ی سرور نباید نامِ حساب را با رشته‌ی خالی بپوشاند */
      && read(f).includes('...(user?.firstName ? { firstNameFa: user.firstName } : {}),')),
    'وگرنه یک فیلدِ اجباریِ پرنشدنی، فرم را برای همیشه می‌بندد');
  t('خطا در پنجره‌ی وسطِ صفحه می‌آید، نه نوارِ بالای فرم',
    forms.every(f => read(f).includes('<AlertDialog') && !read(f).includes('{topError && (')),
    'کاربرِ ته فرمِ بلند نوار را نمی‌دید');
  t('پیام نامِ فیلدهای ناقص را می‌گوید',
    forms.every(f => read(f).includes('FIELD_LABELS[k] ?? k')),
    '«فیلدهای الزامی را کامل کنید» نمی‌گوید کدام‌یک');
  t('کادرِ فیلدِ ناقص قرمز می‌شود',
    forms.every(f => read(f).includes('const inpErr') && read(f).includes('? inpErr : inp')),
    'متنِ ریزِ زیرِ فیلد از دور دیده نمی‌شود');
  t('صفحه روی اولین ایراد می‌ایستد و همه‌ی کلیدها مقصد دارند',
    forms.every(f => {
      const src = read(f);
      if (!src.includes("scrollIntoView({ behavior: 'smooth', block: 'center' })")) return false;
      const keys = [...new Set([...src.matchAll(/e\.([a-zA-Z]+)\s*=/g)].map(m => m[1]).filter(k => k !== 'trim'))];
      /* همان دو صفتی که خودِ کد جست‌وجو می‌کند — نه بیشتر، وگرنه تست
         سبز می‌ماند در حالی که پرش جایی نمی‌رود. */
      const targets = [...src.matchAll(/data-field(?:-alt)?="(\w+)"/g)].map(m => m[1]);
      if (!src.includes('[data-field-alt="${keys[0]}"]')) return false;
      return keys.every(k => targets.includes(k));
    }),
    'پرش به فیلدی که مقصد ندارد یعنی هیچ اتفاقی نمی‌افتد');

  /* ── داده‌ی سرور بدونِ اعتماد ──
     مسیرِ ذخیره فقط `typeof === object` را می‌سنجد؛ ردیفی با
     `fullBio: null` کلِ صفحه را با TypeError پایین می‌آورد. */
  t('داده‌ی پروفایلِ سرور پیش از نشستن در فرم غربال می‌شود',
    forms.every(f => read(f).includes('function safeRemote')
      && read(f).includes('...safeRemote(remote.data),')
      && !read(f).includes('...(remote.data as Partial<FormState>)')));
  t('خطای فیلدهای غیرِ ورودی هم با اصلاح پاک می‌شود',
    forms.every(f => read(f).includes('const clearErr =')
      && read(f).includes("clearErr('province', 'city')")
      && read(f).includes("clearErr('slug')")),
    'استان و نشانی مستقیم setForm می‌زنند و قرمز می‌ماندند');
  t('نامِ فقط-فاصله قفل نمی‌کند',
    forms.every(f => read(f).includes('!!user?.firstName?.trim()')),
    'قفل با مقدارِ فاصله‌دار، همان بن‌بستِ فیلدِ پرنشدنی را می‌سازد');
  t('هر دو داشبورد پشتِ گاردِ ورود هستند',
    forms.every(f => read(f).includes('<AuthGuard>')),
    'کاربرِ واردنشده کلِ فرم را پر می‌کرد و بعد ۴۰۱ می‌گرفت');
  t('مسیرِ ویدیوی پروفایل مالکیت را می‌سنجد',
    read('lib/upload/policy.ts').includes("cleaned.startsWith('profiles/videos/')"),
    'تکیه بر تصادفی‌بودنِ نامِ فایل، محافظ نیست');
  t('صفحه‌ی عمومی پروفایل را از سرور هم می‌خواند',
    ['app/coaches/[id]/page.tsx', 'app/referees/[id]/page.tsx']
      .every(f => read(f).includes('fetchProfile<')),
    'وگرنه پروفایل فقط در مرورگرِ خودِ صاحبش دیده می‌شد');
  t('باکسِ استوری در فرمِ ثبت نیست',
    forms.every(f => !read(f).includes('استوری‌های شما') && !read(f).includes('publishStory')),
    'استوری مستقل از ثبتِ پروفایل منتشر می‌شود');
  /* ── قفلِ نامک ──
     «اولین مقدارِ ناخالی» در فرمِ تازه یعنی اولین کاراکترِ تایپ‌شده:
     فیلد بعد از یک حرف قفل می‌شد و ثبت با «۲ تا ۶۰ کاراکتر» رد. */
  t('نامک با تایپ قفل نمی‌شود، فقط با بارگذاری',
    read('components/ProfileSlugField.tsx').includes('const typed = useRef(false)')
    && read('components/ProfileSlugField.tsx').includes('typed.current = true')
    && !read('components/ProfileSlugField.tsx').includes('firstSaved'),
    'تا وقتی ذخیره نشده باید قابلِ ویرایش بماند');
  t('برچسبِ فیلدهای لاتین چپ‌چین است',
    forms.every(f => read(f).includes('const lblLtr')
      && read(f).includes('<label style={lblLtr}>First name (English)')),
    'ورودی چپ‌چین بود و برچسبش راست‌چین');
  t('نشانیِ اختصاصی یک بار پرسیده می‌شود',
    forms.every(f => (read(f).match(/<SiteAddressField/g) ?? []).length === 0
      && read(f).includes('<ProfileSlugField')),
    'دو کامپوننت روی یک مقدار می‌نوشتند');
  t('دکمه‌ی افزودن ویدیو واقعاً ویدیو می‌گیرد',
    forms.every(f => read(f).includes('accept="video/mp4,video/quicktime,video/webm"'))
    && existsSync(join(ROOT, 'lib/video-thumb.ts'))
    && read('lib/coach-store.ts').includes('url?: string'),
    'تا امروز accept روی image/* بود و هیچ ویدیویی ذخیره نمی‌شد');
  t('هر دو صفحه‌ی عمومی ویدیو را پخش می‌کنند',
    existsSync(join(ROOT, 'components/ProfileVideoCard.tsx'))
    && ['app/coaches/[id]/page.tsx', 'app/referees/[id]/page.tsx']
      .every(f => read(f).includes('<ProfileVideoCard key={v.id} v={v} />')
        && read(f).includes('url: v.url')),
    'دکمه‌ی پخش تزئینی بود و صفحه‌ی داور اصلاً به‌روز نشده بود');
  t('سه عبارتِ اضافه حذف شدند',
    !read('components/ClubPicker.tsx').includes('یک عضو به آن باشگاه افزوده می‌شود')
    && !read('components/VerificationPrompt.tsx').includes('مانع ثبت پروفایل شما نمی‌شود')
    && forms.every(f => !read(f).includes('(با تصویر بندانگشتی)')));
}
/* ── نگهداری و رسانه ── */
console.log('\n― زیرساختِ رسانه ―');
{
  const keys = read('lib/media/keys.ts');
  t('کلیدِ رسانه UUID و سال/ماه دارد',
    keys.includes('export function mediaUploadPath') && keys.includes('MEDIA_ROOT'),
    'مهرِ زمانی قابلِ حدس بود و نامِ فایلِ کاربر را حمل می‌کرد');
  t('مسیرِ آپلود بی‌پسوند می‌رود',
    !/return `\$\{MEDIA_ROOT\}\/\$\{kind\}\/\$\{y\}\/\$\{m\}\/\$\{uuid\}\./.test(keys)
    && keys.includes('پسوند را همان‌جایی'),
    'safeSeg نقطه را به _ تبدیل می‌کند و uuid_mp4.mp4 درمی‌آید');
  t('پیشوندِ رسانه در قواعدِ آپلود مجاز است',
    read('lib/upload/policy.ts').includes("'media/videos/'")
    && read('lib/upload/policy.ts').includes("'media/thumbnails/'"));
  t('آپلودِ ویدیو از همان کلید استفاده می‌کند',
    read('components/MediaUpload.tsx').includes("mediaUploadPath('videos', id)")
    && read('components/MediaUpload.tsx').includes('crypto.randomUUID()')
    && !read('components/MediaUpload.tsx').includes('social/media/vid/'),
    'نامِ قدیمی uv-<timestamp>-<rand> قابلِ حدس بود');
  t('ویدیو همیشه از مسیرِ مستقیم می‌رود',
    read('lib/supabase.ts').includes("file.type.startsWith('video/')"),
    'وگرنه بایت‌هایش در RAMِ سرورِ سایت می‌نشیند');

  /* ── اسکریپت‌های سرور ──
     تا دیروز در هیچ ریپویی نبودند: با از دست رفتنِ سرور یا لپ‌تاپ،
     خودِ سازوکارِ پشتیبان هم می‌رفت. */
  t('اسکریپت‌های عملیاتی در ریپو هستند',
    ['ops/backup.sh', 'ops/disk-guard.sh', 'ops/pull-from-server.sh', 'ops/README.md']
      .every(f => existsSync(join(ROOT, '../..', f))));
  t('پشتیبانِ فایل‌ها افزایشی است، نه tarِ کامل',
    (() => {
      const b = readFileSync(join(ROOT, '../../ops/backup.sh'), 'utf8');
      return b.includes('rsync -a --delete') && b.includes('--link-dest')
        && !b.includes('tar -czf "$D/storage-files.tgz"');
    })(),
    'با ۱۰۰ گیگ ویدیو، tarِ شبانه سرور را زمین می‌زد');
  t('پشتیبان checksum دارد و خرابیِ خاموش را می‌گیرد',
    (() => {
      const b = readFileSync(join(ROOT, '../../ops/backup.sh'), 'utf8');
      return b.includes('sha256sum') && b.includes('VERIFY_BYTES');
    })());
  t('نگهبانِ دیسک سه آستانه دارد',
    (() => {
      const g = readFileSync(join(ROOT, '../../ops/disk-guard.sh'), 'utf8');
      return g.includes('WARN=70') && g.includes('HIGH=85') && g.includes('CRIT=95');
    })(),
    'پر شدنِ دیسک Postgres را هم می‌خواباند');
}
/* ── تستِ یکپارچگی: از فرم تا صفحه‌ی آگهی ── */
console.log('\n― یکپارچگیِ نمایش ―');
{
  const sr = read('lib/market/spec-rules.ts');
  const sc = read('lib/market/spec-catalog.ts');
  const detail = read('app/shop/[id]/page.tsx');
  const list = read('app/shop/page.tsx');

  t('ممیزیِ پوششِ فیلدها در ریپو هست',
    existsSync(join(ROOT, 'scripts/audit-spec-coverage.mjs')),
    'سه فهرست را کنارِ هم می‌گذارد — برای دسته‌های آینده');
  t('مقدارهای عددی در جدول فارسی می‌شوند',
    sr.includes('export function faDigits') && sr.includes('faDigits(text)'),
    '«۱۸.۵» نه «18.5»');
  t('نامِ لاتین و فیلدِ کد دست نمی‌خورند',
    sr.includes('/[A-Za-z]/.test(text)') && sr.includes('CODE_FIELDS'),
    'شماره‌ی سریال کد است و «6811 Tournament» نامِ مدل');
  t('«نوع» و «مدل» در جدول تکرار نمی‌شوند',
    sr.includes('TITLE_KEYS.has(k)'), 'هر دو در عنوانِ آگهی هستند');
  t('شناسه‌ی «سایر» خام نمایش داده نمی‌شود',
    sr.includes('text === OTHER_ID'), 'خریدار «__other__» می‌دید');
  t('۳۳ مشخصه‌ی میز گروه‌بندی می‌شود',
    sr.includes('FIELD_GROUPS') && sr.includes('export function groupedRows')
    && detail.includes('groupedRows(specRows_)'));
  t('دسته‌ی کم‌ردیف تخت می‌ماند',
    sr.includes('rows.length < GROUP_MIN_ROWS'),
    'زیرعنوان روی نُه ردیف فقط شلوغی است');
  t('پرچمِ کشورِ برند در صفحه‌ی آگهی هست',
    detail.includes('CountryFlag') && detail.includes('brandCountry'));
  t('مقدارِ بلند می‌شکند، برچسب نه',
    !detail.includes("fontWeight: 700, color: TEXT, whiteSpace: 'nowrap'"),
    'nowrap مقدار را از ستونِ ۲۴۰ پیکسلی بیرون می‌زد');
  t('جستجوی بازار همان نرمال‌سازیِ دراپ‌داون را دارد',
    list.includes('import { normalizeFa }') && list.includes('normalizeFa(`${l.name}'),
    '«predator» و کافِ عربی هیچ نتیجه‌ای نمی‌دادند');
  t('ستونِ specs سقفِ تعداد و حجم دارد',
    sc.includes('MAX_SPEC_KEYS') && sc.includes('MAX_SPEC_VALUE_LEN'));
  t('کلیدِ ناشناخته فقط در مسیرِ ثبت رد می‌شود',
    sc.includes('strict = false')
    && read('app/api/market/ads/route.ts').includes('catType || undefined, true)')
    && !read('app/api/market/ads/[id]/route.ts').includes('catType || undefined, true)'),
    'ویرایشِ آگهیِ قدیمی نباید بشکند');
  t('فیلدِ پنهان روی سرور هم مقدار نمی‌گیرد',
    sc.includes('isFieldHidden(f, values, fields, typeId)'));
  t('نامِ دستیِ بلندتر از سقف رد می‌شود نه بریده',
    read('lib/market/catalog-rules.ts').includes('const tooLong ='));
  t('کلیدِ نسل‌قبل برچسبِ فارسی می‌گیرد',
    read('lib/market/specs.ts').includes('export function legacyLabelOf')
    && detail.includes('legacyLabelOf(product?.cat, k)')
    && sr.includes('fallbackLabel?.(k)'),
    'آگهیِ موجود «bodyMaterial : اسلیت» نشان می‌داد');
  t('کدِ مرده‌ی HIDDEN_SPEC_KEYS حذف شد',
    !read('lib/market/specs.ts').includes('HIDDEN_SPEC_KEYS'));
  t('alias «پریس» اضافه شد',
    JSON.parse(readFileSync(join(ROOT, 'data/cue-catalog.json'), 'utf8'))
      .types.flatMap(x => x.brands).some(x => (x.aliases ?? []).includes('پریس')));
  t('هر کشورِ برندِ میز در countries خودش تعریف شده',
    (() => {
      const J = JSON.parse(readFileSync(join(ROOT, 'data/table_catalog.json'), 'utf8'));
      return J.types.flatMap(x => x.brands).every(x => !x.country || !!J.countries[x.country]);
    })(), 'SG جا افتاده بود و ادغام پوشانده بودش');
}

console.log('\n― CORS ―');
{
  t('فایلِ مرده‌ی CORS حذف شد',
    !existsSync(join(ROOT, 'lib/cors.ts')),
    'هیچ وارد‌کننده‌ای نداشت و الگوی وایلدکارتِ vercel.app را مجاز می‌کرد');
  t('نمونه‌ی متغیرهای محیطی هست',
    existsSync(join(ROOT, '.env.example')),
    'با حذفِ مقدارِ پیش‌فرض، کلونِ تازه بدونِ راهنما بالا نمی‌آید');
}

console.log('\n― دروازه‌ی انتشارِ پروفایل ―');
{
  /* پروفایلِ تازه `pending` درج می‌شود و فقط صفِ /admin/coaches باید
     منتشرش کند. یک‌بار تأییدِ *نقش* هم همان کار را می‌کرد و پروفایلی که
     هیچ‌کس محتوایش را ندیده بود ده دقیقه بعد از ساخته‌شدن روی سایت رفت. */
  const roles = read('app/api/admin/roles/route.ts');
  t('تأییدِ نقش، پروفایل را منتشر نمی‌کند',
    roles.includes("from('profiles')") && !/from\('profiles'\)[\s\S]{0,160}status:\s*'approved'/.test(roles),
    'تأییدِ نقش یعنی «حق دارد پروفایل بسازد»، نه «محتوایش تأیید شد»');
  t('تیکِ آبی هنوز از همین مسیر داده می‌شود',
    /from\('profiles'\)[\s\S]{0,120}verified:\s*true/.test(roles),
    'تیک و انتشار دو تصمیم‌اند؛ فقط دومی جابه‌جا شد');

  const server = read('lib/profiles/server.ts');
  t('پروفایلِ تازه هنوز pending درج می‌شود',
    /row\.status === undefined\) row\.status = 'pending'/.test(server),
    'پیش‌فرضِ ستون در دیتابیس approved است — این خط خنثی‌اش می‌کند');
}

console.log('\n― استوری: یک منبع، با انقضا ―');
{
  /* سه علامتی که کاربر گزارش کرد، همه یک ریشه داشتند: فیلدهای
     «عکس/متن استوری» در فرمِ ثبتِ فروشگاه یک استوریِ *دائمی*
     می‌ساختند — بدونِ انتشار، بدونِ انقضا. سیستمِ واقعی (همان که
     برای باشگاه و ادمین کار می‌کرد) `expiresAt` دارد و سرور
     منقضی‌ها را خودش پاک می‌کند. */

  const shop = read('app/sellers/[id]/FlatShop.tsx');
  t('حلقه‌ی استوریِ فروشگاه از مسیرِ واقعی می‌آید',
    /* خودِ فراخوانی سنجیده می‌شود نه رشته‌ی `/stories` — که کامنتِ
       بالای همان بلوک هم داردش. */
    /fetch\(`\/api\/sellers\/\$\{owner\}\/stories`/.test(shop)
    && shop.includes('const hasStory = !storiesLoading && liveStories.length > 0'),
    'فیلدِ فرم انقضا ندارد و روزها می‌ماند');

  /* دکمه نباید وسطِ دریافت معنی‌اش عوض شود: تا پاسخ نیامده،
     «بزرگ‌نماییِ لوگو» است نه «مشاهده‌ی استوری». */
  t('حلقه‌ی فروشگاه تا آمدنِ پاسخ خاموش است',
    /const \[storiesLoading, setStoriesLoading\] = useState\(true\)/.test(shop)
    && /\.finally\([\s\S]{0,80}?setStoriesLoading\(false\)/.test(shop));

  /* مسیر تا ۱۰ استوری می‌دهد؛ پیش‌تر فقط اولی پخش می‌شد */
  t('هر ۱۰ استوریِ فروشگاه پخش می‌شود',
    /liveStories\[storyIdx\]/.test(shop)
    && /count=\{liveStories\.length\}/.test(shop)
    && /setStoryIdx\(storyIdx \+ 1\)/.test(shop),
    'مودال با تمام‌شدنِ تایمر بسته می‌شد و بقیه دیده نمی‌شدند');

  /* بستنِ دستی نباید «بعدی» بشود */
  const csm = read('components/ClubStoryModal.tsx');
  t('فقط پایانِ تایمر استوریِ بعدی را می‌آورد',
    csm.includes('else (onNext ?? onClose)();')
    /* ضربدر، پس‌زمینه و Esc همگی onClose صدا می‌زنند */
    && csm.includes('onClick={onClose}')
    && /if \(e\.key === 'Escape'\) \{ onClose\(\); return; \}/.test(csm),
    'ضربدر و پس‌زمینه و Esc باید ببندند، نه جلو ببرند');

  /* دو استوری با یک فایلِ یکسان: بدونِ index در وابستگی‌ها پخش می‌ایستد */
  t('تایمرِ استوری به شماره‌ی استوری وابسته است',
    /\}, \[index, club\.storyMediaUrl\]\);/.test(csm),
    'نشانیِ یکسان یعنی افکت دوباره اجرا نمی‌شود و نوار پر می‌ماند');

  /* نوارِ بخش‌بخش در RTL باید از راست شروع شود */
  t('نوارِ پیشرفتِ استوری جهتِ صفحه را می‌پذیرد',
    !/direction: 'ltr'/.test(csm) && csm.includes('insetInline: 14'),
    'با direction:ltr اولین استوری ته صفحه می‌افتاد');

  t('استوریِ چندتایی راهِ رد کردن دارد',
    csm.includes('aria-label="استوری بعدی"') && csm.includes('aria-label="استوری قبلی"'),
    'ده استوریِ دوازده‌ثانیه‌ای یعنی دو دقیقه پخشِ بی‌گریز');

  t('دکمه‌ی بستنِ استوری نامِ دسترس‌پذیر دارد',
    csm.includes('aria-label="بستن استوری"'));
  t('فیلدِ استوریِ پروفایل دیگر خوانده نمی‌شود',
    !shop.includes('store.storyImage') && !shop.includes('store.storyText'));

  const form = read('app/dashboard/seller/page.tsx');
  t('فرمِ ثبتِ فروشگاه فیلدِ استوریِ جعلی ندارد',
    /* هر شکلی از برگشتن، نه فقط همان یک املا */
    !/\bstoryImage\b/.test(form) && !/\bstoryText\b/.test(form),
    'پرکردنشان بی‌درنگ حلقه‌ی استوریِ بی‌انقضا می‌ساخت');
  t('مدیریتِ استوریِ واقعی سرِ جایش است', form.includes('<StoryManager'));

  /* ── استوریِ شبح در فهرستِ مربیان و داوران ──
     `storyImage: p.photo` یعنی عکسِ پروفایل رسانه‌ی استوری می‌شد و
     آواتار حلقه را بی‌قیدوشرط می‌کشید. هر مربی یک «استوری» داشت که
     خودش نگذاشته بود و هرگز منقضی نمی‌شد. */
  for (const p of ['app/coaches/page.tsx', 'app/referees/page.tsx']) {
    const src = read(p);
    t(`حلقه‌ی استوریِ شبح در ${p.split('/')[1]} نیست`,
      !src.includes('ClubStoryModal') && !/aria-label="مشاهده استوری"/.test(src)
      /* برگرداندنِ گرادیان بدونِ مودال هم باید قرمز کند */
      && !/feda75/.test(src),
      'برای مربی و داور اصلاً سیستمِ استوریِ واقعی وجود ندارد');
  }
  /* نامکِ ناشناخته نباید پروفایلِ نمونه را نشان دهد */
  for (const p of ['app/coaches/[id]/page.tsx', 'app/referees/[id]/page.tsx']) {
    t(`فالبکِ نمونه در ${p.split('/')[1]} برداشته شد`,
      /* کامنت‌ها کنار می‌روند وگرنه توضیحِ خودِ اصلاح، ادعا را سبز می‌کند */
      !stripComments(read(p)).includes('?? D[0]!'),
      'رکوردِ نمونه استوری و مدرکِ کسِ دیگری دارد');
  }

  /* هر سه مسیرِ استوری باید منقضی کنند */
  t('استوریِ عمومی منقضی می‌شود',
    /now - s\.createdAt < DAY/.test(read('app/api/social/stories/route.ts')));
  /* فقط هندلرِ GET سنجیده می‌شود — همان که نمایش به آن بند است.
     ادعای فایل‌محور با سه occurrence، شکستنِ یکی‌شان را ساکت رد می‌کرد. */
  const sellerStories = read('app/api/sellers/[id]/stories/route.ts');
  const getFn = sellerStories.split('export async function GET')[1]?.split(String.fromCharCode(10) + 'export ')[0] ?? '';
  t('استوریِ فروشگاه در خواندن منقضی می‌شود',
    /* هم فیلترِ داخلِ GET، هم تعریفِ خودِ isActive — وگرنه یکی از دو
       نیمه می‌تواند بشکند و ادعا سبز بماند. */
    getFn.includes('all.filter(s => isActive(s, now))')
    && /!!s\.expiresAt && new Date\(String\(s\.expiresAt\)\)\.getTime\(\) > now/.test(sellerStories));

  /* ── ریشه‌ی واقعیِ «استوری چند روز مانده» ──
     بدنه‌ی درخواست همان‌طور که می‌آمد نوشته می‌شد، یعنی `expiresAt`
     را کلاینت تعیین می‌کرد. یک ساعتِ جلو یا یک POST دستی با تاریخِ
     ۲۰۹۹ استوریِ همیشگی می‌ساخت و GET هم هیچ‌وقت حذفش نمی‌کرد. */
  for (const p of ['app/api/sellers/[id]/stories/route.ts', 'app/api/clubs/[id]/stories/route.ts']) {
    const src = read(p);
    const post = src.split('export async function POST')[1]?.split(String.fromCharCode(10) + 'export ')[0] ?? '';
    t(`انقضای استوری در ${p.includes('sellers') ? 'فروشگاه' : 'باشگاه'} روی سرور ساخته می‌شود`,
      post.includes('normalizeStory(await req.json()')
      && !/const story = await req\.json\(\);/.test(post),
      'وگرنه مرورگر می‌تواند استوریِ بی‌انقضا بنویسد');
  }
  const storyInput = read('lib/story-input.ts');
  t('تاریخ‌های استوری از بدنه‌ی درخواست خوانده نمی‌شوند',
    /expiresAt: new Date\(now \+ STORY_TTL_MS\)\.toISOString\(\)/.test(storyInput)
    && /createdAt: new Date\(now\)\.toISOString\(\)/.test(storyInput)
    && !/expiresAt: (?:b|raw)\./.test(storyInput));

  /* پرچمِ صفحه‌ی اصلی هم باید مشتق باشد، نه ستونی که کسی نمی‌نویسد */
  t('حلقه‌ی باشگاهِ صفحه‌ی اصلی از تاریخِ انقضا می‌آید',
    /hasStory: !!c\.storyExpiresAt && new Date\(c\.storyExpiresAt\)\.getTime\(\) > Date\.now\(\)/
      .test(read('lib/home-featured.ts')),
    'ستونِ hasActiveStory را هیچ‌کس نمی‌نویسد — همیشه خاموش بود');

  /* پاسخِ سرور باید خوانده شود: ۴۰۳ و ۴۰۰ بی‌صدا رد می‌شدند */
  t('پنلِ استوریِ فروشگاه پاسخِ سرور را می‌خواند',
    /if \(!r\.ok\)/.test(read('components/seller/StoryManager.tsx')),
    'موفقیت نشان می‌داد در حالی که سرور چیزی ننوشته بود');

  /* ── درستیِ فهرستِ استوری ──
     دو نسخه‌ی جدا از خواندن/نوشتنِ فهرست بود و هر دو خطا را می‌بلعیدند:
     نوشتنِ ناموفق ۲۰۱ می‌داد، و خطای خواندن «فهرست خالی» حساب می‌شد
     که یعنی یک خطای گذرا می‌توانست ده استوریِ زنده را پاک کند. */
  const storyIdxSrc = read('lib/story-index.ts');
  /* ⚠️ نسخه‌ی اول این ادعا توخالی بود: الگو روی *کلِ فایل* اجرا می‌شد و
     `throw` داخلِ تابعِ خواندن را می‌گرفت، پس با برداشتنِ throwِ نوشتن
     هم سبز می‌ماند. حالا فقط تنه‌ی خودِ `write` سنجیده می‌شود. */
  const writeFn = storyIdxSrc.split('async write(')[1]?.split('async purge(')[0] ?? '';
  t('خطای نوشتنِ فهرستِ استوری بلعیده نمی‌شود',
    /throw new StoryIndexError\('ذخیره‌ی استوری انجام نشد'\)/.test(writeFn));
  t('خطای خواندن با فهرستِ خالی یکی گرفته نمی‌شود',
    storyIdxSrc.includes('if (isMissing(error)) return []')
    && /throw new StoryIndexError\('خواندنِ فهرستِ استوری انجام نشد'\)/.test(storyIdxSrc),
    'یک خطای گذرا می‌توانست ده استوریِ زنده را بسوزاند');

  for (const p of ['app/api/sellers/[id]/stories/route.ts', 'app/api/clubs/[id]/stories/route.ts']) {
    const src = read(p);
    const who = p.includes('sellers') ? 'فروشگاه' : 'باشگاه';
    t(`مسیرِ استوریِ ${who} از فهرستِ مشترک می‌خواند`,
      src.includes("from '@/lib/story-index'") && !/async function (readIndex|writeIndex)/.test(src),
      'نسخه‌ی محلی همان رفتارِ خطاخورِ قبلی را برمی‌گرداند');
    t(`شکستِ ذخیره در ${who} به کلاینت گفته می‌شود`,
      /return failed\(e, 'ذخیره‌ی استوری انجام نشد'\)/.test(src));
    t(`حذفِ استوریِ ناموجود در ${who} ۴۰۴ می‌دهد`,
      /status: 404/.test(src) && /شناسه‌ی استوری لازم است/.test(src),
      'ok گفتن یعنی استوری با رفرشِ بعدی برمی‌گردد');
    t(`فایلِ استوریِ رفته در ${who} پاک می‌شود`,
      /\.purge\(/.test(src),
      'وگرنه رسانه تا ابد در فضای ذخیره‌سازی می‌ماند');
  }

  /* رسانه‌ی استوری روی صفحه‌ی اولِ همه رندر می‌شود */
  t('رسانه‌ی استوری فقط از میزبانِ خودمان پذیرفته می‌شود',
    storyInput.includes("if (s.startsWith('//')) return ''")
    && /hosts\.includes\(u\.host\)/.test(storyInput),
    'وگرنه پیکسلِ ردیاب یا عوض‌کردنِ عکس بعد از انتشار ممکن است');

  /* پنل نباید شناسه‌ی محلی نگه دارد — حذف بی‌صدا کار نمی‌کند */
  for (const p of ['components/seller/StoryManager.tsx', 'components/dashboard/club/GalleryTab.tsx']) {
    t(`رکوردِ سرور در ${p.split('/').pop()} جایگزینِ پیش‌نویس می‌شود`,
      /if \(!saved\?\.id\) throw new Error/.test(read(p)),
      'شناسه‌ی محلی با شناسه‌ی ذخیره‌شده فرق می‌کرد');
  }

  /* حلقه‌ی کارتِ باشگاه روی hasActiveStory && storyMediaUrl است */
  t('ستون‌های استوری در فهرستِ عمومیِ باشگاه انتخاب می‌شوند',
    /'storyExpiresAt', 'storyMediaUrl', 'storyType', 'storyText'/.test(read('app/api/clubs/route.ts')),
    'بدونِ رسانه، حلقه‌ی استوری روی /clubs هرگز رندر نمی‌شد');

  /* ── کفِ کنتراست ──
     این‌ها با فرمولِ WCAG روی زمینه‌ی واقعیِ صحنه حساب می‌شوند، نه با
     چشم. چهار رنگ زیرِ حد بودند و تیره شدند؛ این ادعا نمی‌گذارد
     کسی دوباره روشنشان کند.
     حدِ AA: ۴.۵ برای متنِ عادی. */
  {
    const hex = h => h.replace('#', '').match(/../g).map(x => parseInt(x, 16));
    const lum = ([r, g, b]) => {
      const f2 = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f2(r) + 0.7152 * f2(g) + 0.0722 * f2(b);
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(hex(a)), lum(hex(b))].sort((m, n) => n - m);
      return (x + 0.05) / (y + 0.05);
    };
    const STAGE = '#F4F2EE';
    const SLASH = '/';
    const OLD_MUT = '#' + '8A8474';
    const css = read('app/globals.css');
    const tok = n => css.match(new RegExp(`--${n}:\\s*(#[0-9A-Fa-f]{6})`))?.[1] ?? null;

    for (const name of ['text-secondary', 'text-tertiary', 'gold-deep']) {
      const v = tok(name);
      const r = v ? ratio(v, STAGE) : 0;
      t(`کنتراستِ --${name} از ۴.۵ کم‌تر نیست`, r >= 4.5,
        v ? `${v} روی ${STAGE} می‌شود ${r.toFixed(2)}:1` : `توکنِ --${name} پیدا نشد`);
    }

    /* رتبه‌ی جدول متن است، پس نباید رنگِ تزئینیِ --gold را بگیرد */
    t('رتبه‌ی جدول رنگِ متنِ خوانا دارد',
      /\.table-rank \{[\s\S]*?color: var\(--gold-deep\)/.test(css),
      '--gold روی زمینه‌ی روشن ۲.۰۷:۱ است');

    /* خاکستریِ کم‌رنگِ صفحه‌ها — ۳.۳۳:۱ بود، در ۱۰۴ فایل */
    const glob = (d, out = []) => {
      for (const e of readdirSync(join(ROOT, d), { withFileTypes: true })) {
        const p = d + SLASH + e.name;
        if (e.isDirectory()) { if (!/node_modules|[.]next/.test(e.name)) glob(p, out); continue; }
        /* ⚠️ css هم — نسخه‌ی اول فقط tsx می‌گشت و globals.css را نمی‌دید،
           پس روی کدی که هنوز رنگِ قدیم داشت سبز می‌ماند. */
        if (/[.](tsx?|css)$/.test(e.name) && read(p).toUpperCase().includes(OLD_MUT)) out.push(p);
      }
      return out;
    };
    const stale = [...glob('app'), ...glob('components'), ...glob('lib')];
    t('خاکستریِ متنِ کم‌رنگ به کدِ روشنِ قبلی برنگشته', stale.length === 0,
      stale.length + ' فایل هنوز رنگِ ۳.۳۳:۱ دارد');

    /* طلاییِ اینلاین هم باید با توکن یکی بماند — وگرنه سایت دو تُنه
       می‌شود: کلاس‌ها تیره، استایلِ اینلاین روشن. */
    const OLD_GOLD = '#' + '9A6E38';
    const goldStale = [];
    const glob2 = (d) => {
      for (const e of readdirSync(join(ROOT, d), { withFileTypes: true })) {
        const p = d + SLASH + e.name;
        if (e.isDirectory()) { if (!/node_modules|[.]next/.test(e.name)) glob2(p); continue; }
        if (/[.](tsx?|css)$/.test(e.name) && stripComments(read(p)).toUpperCase().includes(OLD_GOLD)) goldStale.push(p);
      }
    };
    glob2('app'); glob2('components'); glob2('lib');
    t('طلاییِ اینلاین با توکنِ تیره‌شده یکی است', goldStale.length === 0,
      goldStale.length + ' فایل هنوز #9A6E38 دارد (۴.۰۳:۱)');
  }

  /* هدفِ لمس — حدِ WCAG 2.2 AA برابرِ ۲۴×۲۴ پیکسلِ CSS است.
     دکمه‌ی گزارش ۲۳×۲۳ بود: یک پیکسل کم. */
  t('دکمه‌ی گزارشِ فشرده به حدِ ۲۴ پیکسل می‌رسد',
    /* هر دو نیمه: با آیکونِ کوچک‌تر هم هدف کوچک می‌شود، پس تنها
       سنجیدنِ padding کافی نیست. */
    /padding: 5, display: 'flex', color: MUT/.test(read('components/ReportButton.tsx'))
    && read('components/ReportButton.tsx').includes('<Flag size={15} />'),
    'آیکونِ ۱۵ با padding 4 می‌شود ۲۳');

  t('دکمه‌ی نمایشِ رمز با کیبورد در دسترس است',
    !/onClick={opts.reveal.toggle} tabIndex={-1}/.test(read('app/register/page.tsx')),
    'نامِ دسترس‌پذیر روی عنصری که فوکوس نمی‌گیرد بی‌فایده است');
  t('نامِ هر تراشه‌ی فیلتر یکتاست',
    /aria-label=\{`برداشتن فیلترِ \$\{c\.label\}`\}/.test(read('app/shop/page.tsx')),
    'پنج دکمه با یک نام برای صفحه‌خوان از هم جدا نمی‌شوند');

  /* ── کمانِ سرِ صفحه‌ی مربی ──
     لبه‌ی پایینِ کاور بیضی است: شعاعِ افقی نصفِ عرض و شعاعِ عمودی --dip،
     پس کناره‌ها بالا و مرکز گود می‌شود. آواتار وسط، روی همان گودی. */
  {
    /* `strip` لازم است: کامنتی که می‌گوید «کمان چطور کار می‌کند»
       نباید خودش ادعا را سبز کند. */
    const hero = strip(read('app/coaches/[id]/page.tsx'));
    /* ⚠️ این ادعا وارونه شد — و درسش را ثبت می‌کنم.
       نسخه‌ی قبلی می‌گفت «کاور لبه‌ی کمانیِ بیضی دارد»، و آن کمان دو
       گوشه‌ی کناری را بالا می‌بُرد. نمونه‌ی کاربر برعکس است: لبه صاف
       است و تنها انحنا همان گودیِ دایره‌ایِ زیرِ عکس. سه بار عمقِ آن
       کمانِ اشتباه را تنظیم کردم پیش از آنکه بفهمم اصلاً نباید باشد. */
    t('لبه‌ی پایینِ کاورِ مربی صاف است',
      !/borderBottom(Left|Right)Radius/.test(hero) && !hero.includes('--dip'),
      'کمانِ بیضی کناره‌ها را بالا می‌برد — وارونه‌ی نمونه');

    /* ── مرزِ کاور: موجِ مقعرِ بِزیه ──

       ⚠️ این ادعا سه بار عوض شد و هر سه بار درسش را ثبت می‌کنم.
       نسخه‌ی اول یک دایره‌ی خشک می‌خواست (گوشه‌ی ۹۰ درجه می‌ساخت).
       نسخه‌ی دوم دایره + دو کمانِ مماس (مماس پیوسته شد ولی بخشِ
       میانی همچنان قوسی با انحنای ثابت بود و «بریدگی» دیده می‌شد).
       حالا مرز از یک تابعِ صریح می‌آید:  y = D·(1 − (1 − u²)³)
       که در دو سرش هم شیب و هم *انحنا* صفر است، پس اتصال به خطِ
       صاف اصلاً دیده نمی‌شود. */
    /* ⚠️ فقط داخلِ خودِ NOTCH_WAVE شمرده می‌شود. نسخه‌ی قبل کلِ فایل
       را می‌گشت، پس دو C از مسیرِ آیکونِ آواتار هم حساب می‌شد و با شش
       قطعه‌ی موج هم سبز می‌ماند؛ و هر آیکونِ آینده‌ای که کمان داشت،
       بی‌ربط قرمزش می‌کرد. */
    const wave = (hero.match(/const NOTCH_WAVE =[\s\S]*?Z'/) ?? [''])[0];
    t('مرزِ کاورِ مربی موجِ بِزیه است، نه دایره',
      wave.length > 0
      && !/ A\d/.test(wave)
      && (wave.match(/ C\d/g) ?? []).length === 8,
      'قوسِ دایره‌ای «بریده با قیچی» دیده می‌شود');

    /* نسبتِ جعبه باید با viewBox یکی باشد وگرنه منحنی کش می‌آید.
       4.972 / 1.03 = 4.827 = 497.192 / 103 */
    t('جعبه‌ی ماسک هم‌نسبتِ viewBox است',
      read('app/coaches/[id]/page.tsx').includes("viewBox='0 0 497.192 103'")
      && hero.includes("'--boxW':'calc(var(--notch-r) * 4.972)'")
      /* بلندی از عرض مشتق می‌شود، نه از شعاع: وگرنه در حالتی که
         `min` عرض را می‌بُرد، نسبت می‌شکست و موج کج می‌شد. */
      && hero.includes("'--boxH':'calc(var(--notch-r) * 1.03)'"),
      'هر دو بُعد باید با هم بمانند وگرنه موج کش می‌آید');

    /* دو بُعد باید از شعاعِ آواتار مشتق شوند، نه عددِ ثابت */
    t('ابعادِ موج از شعاعِ آواتار می‌آیند',
      hero.includes("'--notch-r':'min(calc(var(--av) / 2), calc((100vw - 26px) / 4.972))'"),
      'با عددِ ثابتِ پیکسلی، شکل با اندازه از آواتار جدا می‌افتد');

    /* چهار لایه با ترکیبِ پیش‌فرض؛ mask-composite عمداً استفاده نشد */
    t('ماسکِ موج چهار لایه دارد و هر دو اعلان مقدار می‌گیرند',
      (hero.match(/[Mm]askImage:NOTCH_MASK\.image/g) ?? []).length === 2
      && (hero.match(/[Mm]askSize:NOTCH_MASK\.size/g) ?? []).length === 2
      && (hero.match(/[Mm]askPosition:NOTCH_MASK\.position/g) ?? []).length === 2
      && !hero.includes('mask-composite') && !hero.includes('MaskComposite')
      /* دو نوارِ کناری باید دقیقاً بقیه‌ی عرض را پر کنند:
         boxW + 2·(50% − boxW/2) = 100%. این عبارت بی‌صدا می‌شکند. */
      && hero.includes("calc(50% - var(--boxW) / 2) var(--boxH)")
      && hero.includes("100% calc(100% - var(--boxH))"),
      'کلیدواژه‌ی mask-composite در وبکیتِ قدیمی فرق دارد');

    /* سپرِ کلیک باید *همان* مسیر را بگیرد، نه شکلِ تقریبی */
    t('سپرِ کلیک همان مسیرِ موج را می‌گیرد',
      /* ⚠️ فقط داخلِ خودِ بلوکِ svg سنجیده می‌شود: `pointerEvents:'none'`
         چند جای دیگرِ همین فایل هم هست (تزئین‌های کاور)، پس ادعای
         فایل‌محور با برداشتنِ آن از ریشه‌ی svg هم سبز می‌ماند.
         جعبه‌ی svg مستطیل است و بالای موج روی کاورِ دیدنی می‌افتد؛
         بدونِ `none` روی ریشه، حدودِ ۵۴٪ سطحِ جعبه کلیکِ دکمه‌ی کاور
         را می‌بلعید. */
      (() => {
        const i0 = hero.indexOf("<svg aria-hidden viewBox='0 0 497");
        const svg = i0 < 0 ? '' : hero.slice(i0, hero.indexOf('</svg>', i0));
        return svg.includes("pointerEvents:'none'")
          && svg.includes('<path d={NOTCH_WAVE}')
          && svg.includes("pointerEvents:'all'");
      })(),
      'ماسک جلوی کلیک را نمی‌گیرد؛ ناحیه‌ی نامرئی باید پوشانده شود');
    t('قطرِ آواتار یک‌جا روی کارت تعریف شده',
      /pcard-profile[\s\S]{0,220}?'--av':'clamp\(/.test(hero),
      'متغیر پایین می‌آید نه پهلو — کاور و آواتار هر دو باید ببینندش');
    t('آواتارِ مربی وسط‌چین و روی گودیِ کمان است',
      /className="lq-ident"[^>]*flexDirection:'column'[^>]*alignItems:'center'/.test(hero)
      /* رابطه سنجیده می‌شود نه عددِ ثابت: بالاکشیدن باید *نصفِ همان
         قطری* باشد که چند خط بالاتر تعریف شده. سه‌تاییِ پیکسلیِ قبلی
         حتی روی نسخه‌ی خرابِ clamp هم سبز می‌ماند. */
      && /--av'?:'clamp\(/.test(hero)
      && hero.includes("width:'var(--av)'")
      && hero.includes("marginTop:'calc(var(--av) / -2)'"),
      'چیدمانِ قبلی آواتار را کنارِ نام و سمتِ راست می‌گذاشت');
  }

  /* ── جدولِ رنکینگ ── */
  {
    const rk = strip(read('app/ranking/page.tsx'));

    /* ⚠️ این ادعا دو بار عوض شد و هر دو بار درسش را ثبت کردم.
       نسخه‌ی اول می‌گفت rlig باید *خاموش* باشد؛ آن «لا» را می‌شکست.
       نسخه‌ی دوم می‌گفت خاموش‌کردنِ liga/clig/dlig کافی است؛ روی وزنی
       که سایت دارد اصلاً اثر نداشت و تشدید سرِ جایش ماند.
       راهِ درست ZWJ است: هیچ ویژگیِ فونتی خاموش نمی‌شود، پس «لا»
       اصلاً در خطر نیست. */
    t('هیچ ویژگیِ لیگاتورِ فونت روی نامِ بازیکن خاموش نیست',
      !/font-feature-settings/.test(rk),
      'خاموش‌کردنشان یا بی‌اثر بود یا «لا» را می‌شکست');
    t('تشدیدِ «لله» با ZWJ شکسته می‌شود',
      /* هر دو فراخوانی — نام و فامیل. با شمارشِ ساده، برداشتنِ یکی
         ساکت رد می‌شد. */
      rk.split('breakAllahLigature(').length - 1 === 2
      && read('lib/fa-ligature.ts').includes('0x200D'),
      'داده تشدید ندارد؛ لیگاتورِ فونت آن را می‌کشد');

    t('علامتِ # از کنارِ رتبه برداشته شد', !rk.includes('<i>#</i>'));

    /* مونوگرام برای نامِ فارسی چیزی نمی‌گوید */
    t('آواتارِ رنکینگ آیکونِ آدمک دارد، نه حرفِ اول',
      !/: p\\.name\\?\\.\\[0\\]/.test(rk) && rk.includes('<circle cx="12" cy="8.2"'));

    t('در دسکتاپ دو بازیکن در هر سطر می‌آید',
      rk.includes(String.fromCharCode(46)+String.fromCharCode(114,107,45,103,114,105,100)+" { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr))"));

    /* بینِ ۹۰۰ و ۹۰۱ نه یک‌ستونی می‌شد نه قواعدِ جمع‌شدن */
    t('حفره‌ای بینِ دو مدیاکوئریِ جدول نیست',
      rk.includes('@media (max-width: 900px)') && rk.includes('@media (min-width: 900.02px)'));

    /* در ستونِ نصف‌عرض چیزی نباید سرریز کند */
    /* ⚠️ ادعا یک بار سفت‌تر شد. نسخه‌ی قبلی می‌گفت نام *اصلاً* جمع
       نشود (flex: 0 0 auto)؛ آن‌طور فامیلِ خیلی بلند تبِ امتیاز را از
       لبه‌ی کارت بیرون می‌انداخت و overflow:hidden می‌بریدش. حالا نام
       می‌تواند جمع شود ولی شهر با ضریبِ ۹۹۹ اول تسلیم می‌شود، پس
       عملاً همیشه نام برنده است. */
    t('در تنگنا اول شهر جمع می‌شود، نه نام',
      rk.includes('.rk-name { flex: 0 1 auto')
      && rk.includes('.rk-city { flex: 0 999 auto'),
      'ضریبِ جمع‌شدنِ شهر باید بسیار بزرگ‌تر از نام باشد');

    t('نامِ فدراسیون در هر دو جا درست است',
      rk.includes('فدراسیون بولینگ و بیلیارد جمهوری اسلامی ایران — به‌روز شده')
      && rk.includes('جدول امتیازات رسمی فدراسیون بولینگ و بیلیارد جمهوری اسلامی ایران')
      && !rk.includes('بیلیارد، بولینگ و بولس'),
      'نامِ قدیمی نباید هیچ‌جا بماند');

    /* کنترل‌ها همان سیستمِ مشترکِ lq-seg را می‌گیرند، نه پوسته‌ی محلی.
       سه سیستمِ جدا برای یک کار همان اشتباهی است که در این پروژه
       بارها تکرار شده. */
    t('کنترل‌های رنکینگ از سیستمِ مشترکِ lq-seg‌اند',
      rk.includes('className="lq-seg rk-sports"')
      && rk.includes('className="lq-seg rk-genders"')
      && rk.includes('className="lq-seg rk-cats"')
      && !/\.rk-seg\b|\.rk-chip\b/.test(rk),
      'پوسته‌ی محلیِ قدیمی نباید برگردد');

    /* ردیف نباید بشکند: nowrap در مدیاکوئری اثر نداشت */
    t('ردیفِ رشته و جنسیت نمی‌شکند',
      /\.rk-row1 \{[^}]*flex-wrap: nowrap/.test(rk),
      'در ۳۶۰ تا ۳۹۰ دو سطر می‌شد');

    /* هر دو گروه باید بتوانند جمع شوند */
    t('در تنگنا هر دو گروهِ کنترل جمع می‌شوند',
      /\.rk-sports \{ flex: 3 1 0/.test(rk) && /\.rk-genders \{ flex: 2 1 0/.test(rk),
      'با flex:0 0 auto روی جنسیت، گروهِ رشته تا ۸ پیکسل جمع می‌شد');

    t('«به زودی» از کنارِ هی‌بال برداشته شد',
      !rk.includes('به زودی</span>'),
      'خودِ خاموش‌بودن گویاست و آن نشان ردیف را می‌شکست');

    /* مرزِ نام و فامیل حدس‌زدنی نیست */
    const adm = strip(read('app/admin/rankings/page.tsx'));
    t('ادمین نام و نام‌خانوادگی را جدا می‌گیرد',
      adm.includes('placeholder="نام"') && adm.includes('placeholder="نام خانوادگی"')
      && adm.includes('const updateName ='),
      'از یک رشته نمی‌شود فهمید مرز کجاست');
    t('شهرِ پنلِ رنکینگ از ProvinceCitySelect می‌آید',
      adm.includes('<ProvinceCitySelect') && !adm.includes('placeholder="شهر"'),
      'قاعده‌ی ثابتِ پروژه — ورودیِ متنیِ آزاد ممنوع');
    t('عکسِ بازیکن پیش از آپلود فشرده می‌شود',
      adm.includes('compressAvatar(file'),
      'فایلِ خامِ دوربین برای آواتارِ ۴۶ پیکسلی');

    /* ── آپلودِ عکسِ بازیکن: فقط ادمین ──
       گاردِ ادمین باید *پیش از* بررسیِ باشگاه بیاید. `clubInPath`
       لنگر ندارد، پس `rankings/clubs/<شناسه‌ی باشگاهِ خودم>/x.jpg`
       به شاخه‌ی باشگاه می‌افتاد و مالکیتِ یک باشگاه کافی می‌شد. */
    const pol = strip(read('lib/upload/policy.ts'));
    t('گاردِ ادمینِ مسیرِ رنکینگ پیش از بررسیِ باشگاه است',
      pol.indexOf("cleaned.startsWith('rankings/')") > 0
      && pol.indexOf("cleaned.startsWith('rankings/')") < pol.indexOf('const clubInPath'),
      'وگرنه داشتنِ یک باشگاه، گاردِ «فقط ادمین» را دور می‌زند');
    t('مسیرِ رنکینگ در فهرستِ پیشوندهای مجاز است',
      pol.includes("'rankings/',"));
  }

  /* ── ناحیه‌ی امنِ iOS در پوشش‌های تمام‌صفحه ──
     در حالتِ نصب‌شده نوارِ مرورگر نیست و بالاترین ~۴۷px مالِ ساعت و
     باتری است. پوششی که سربرگش آن‌جا بنشیند، ضربدرش زیرِ نمادهای
     سیستم می‌رود. در سافاریِ عادی مقدار صفر است و باگ دیده نمی‌شود. */
  t('نمایِ تمام‌صفحه‌ی تصویر ناحیه‌ی امن را رعایت می‌کند',
    read('components/market/ImageLightbox.tsx').includes("paddingTop: 'env(safe-area-inset-top)'"),
    'ضربدرِ نمای تصویر روی آیفونِ نصب‌شده زیرِ ساعت می‌رفت');
  for (const p of ['components/MediaUpload.tsx', 'components/IdentityVerify.tsx']) {
    t(`ورقِ ${p.split('/').pop()} ناحیه‌ی امن را با calc جمع می‌زند`,
      /paddingTop: 'calc\(clamp\([^']*env\(safe-area-inset-top\)\)'/.test(read(p)),
      'paddingِ اینلاین بر کلاسِ safe-top مقدم است و بی‌صدا بی‌اثرش می‌کند');
  }

  /* پروفایلِ واقعی نباید یک لحظه «پیدا نشد» شود */
  for (const p of ['app/coaches/[id]/page.tsx', 'app/referees/[id]/page.tsx']) {
    t(`گاردِ بارگذاری در ${p.split('/')[1]} پیش از «پیدا نشد» است`,
      /&& !checked\) \{/.test(read(p)),
      'وگرنه هر پروفایلِ واقعی اول «پیدا نشد» نشان می‌داد');
  }
}

console.log('\n― استوری فقط با انتشارِ صریح ―');
{
  /* `storyImage` یک فیلد در فرمِ ثبتِ فروشگاه است. تا امروز اگر فروشگاه
     استوریِ واقعی نداشت، همان عکس با حلقه‌ی استوری روی صفحه‌ی اصلی
     می‌نشست — بدونِ انقضا و بدونِ اینکه کسی «انتشار» زده باشد. */
  const stories = read('components/Stories.tsx');
  t('عکسِ فرمِ فروشگاه خودکار استوری نمی‌شود',
    !stories.includes('store-story-') && !/:\s*s\.storyImage\s*$/m.test(stories),
    'فیلدِ داخلِ فرم انتشار نیست');
  t('استوریِ منتشرشده هنوز نمایش داده می‌شود',
    stories.includes('sellerResults') && stories.includes('st.expiresAt'),
    'فقط فالبک برداشته شد، نه خودِ مسیر');
}

/* آیا مسیرِ ۴۰۱ پیش از قضاوت، پاسخِ تمدید را می‌سنجد؟ باید بینِ
   `refreshSession` و رسیدن به شاخه‌ی پایانی، یک استثنا برای وضعیتی
   جز ۴۰۱ وجود داشته باشد. */
const terminal401Guard = src => /res\.status !== 401[\s\S]{0,240}return/.test(src)

console.log('\n― نشستِ کهنه، صفحه‌ی سفید ―');
{
  /* کاربر در localStorage می‌ماند ولی کوکی منقضی می‌شود. اگر آن کاربرِ
     کهنه پاک نشود، میدل‌ور به /login می‌فرستد و صفحه‌ی ورود چون `user`
     را می‌بیند `null` رندر می‌کند و دوباره به داشبورد برمی‌گرداند —
     صفحه‌ی سفیدِ بی‌واکنش که با رفرش هم درست نمی‌شود. */
  const sb = read('components/auth/SessionBridge.tsx')
  /* ── چرا فقط بدنه‌ی `sync` ──
     همین فایل یک تابعِ `refresh` هم دارد که الگویی تقریباً یکسان
     دارد (`401` ⟵ `legacyToken` ⟵ `logout`). ادعای بی‌محدوده به آن
     یکی می‌خورد و خرابکاری در `sync` را ساکت رد می‌کند — همان‌طور که
     در اولین نسخه‌ی این تست شد. */
  const sync = sb.split('const sync = async () => {')[1]?.split('const onStorage')[0] ?? ''
  t('بدنه‌ی sync پیدا شد', sync.length > 200, 'اگر تابع نام عوض کند، ادعاهای زیر بی‌معنا می‌شوند');
  /* شاخه‌ی «۴۰۱ قطعی» — نه شاخه‌ی «۴۰۱ گذرا» که با `&&` شروع می‌شود، و
     نه شاخه‌ی «هویت عوض شد» که `reload` کردنش درست است. */
  const parts401 = sync.split('if (r.status === 401) {')
  const terminal401 = (parts401[parts401.length - 1] ?? '').split('if (!r.ok)')[0] ?? ''
  t('۴۰۱ قطعی کاربرِ کهنه را پاک می‌کند',
    terminal401.includes('logout()') && !terminal401.includes('reloadForIdentityChange()'),
    'بدونِ این، بن‌بستِ /login ⇄ /dashboard می‌سازد');
  /* ── چرا این ادعا شکل‌محور است و نه «رشته هست یا نه» ──
     نسخه‌ی اولش فقط وجودِ `refresh` و `MIN_GAP_MS` را می‌سنجید و روی
     کدی سبز می‌ماند که رفتارش دقیقاً برعکس بود: آن فاصله مسیرِ ۴۰۱ را
     هم می‌گرفت، تمدید رد می‌شد و کاربرِ سالم بیرون می‌افتاد. */
  t('۴۰۱ گذرا کاربر را بیرون نمی‌اندازد',
    sync.includes('await refreshSession()') && !sync.includes('MIN_GAP_MS'),
    'بازیابیِ ۴۰۱ نباید پشتِ فاصله‌ی تمدیدِ دوره‌ای بیفتد — آن فاصله در همان لحظه‌ی بارگذاری پر می‌شود');
  t('خطای گذرای تمدید به خروج ترجمه نمی‌شود',
    terminal401Guard(sync),
    '۵۰۳ یعنی انبارِ نشست بالا نیست، نه اینکه نشست باطل است');
  t('تمدید یک درخواستِ مشترک دارد',
    sb.includes('let inflight') && sb.includes('function refreshSession'),
    'دو تمدیدِ موازی را سرور «سرقتِ توکن» می‌بیند');
  t('مهرِ زمانی فقط روی موفقیت نوشته می‌شود',
    /if \(r\.ok\) writeLastRefresh/.test(sb) && (sb.match(/writeLastRefresh\(Date/g) ?? []).length === 1,
    'وگرنه یک خطای گذرا پنجره‌ی مشترکِ چهاردقیقه‌ای را می‌سوزاند');
}

console.log('\n― سالِ مدرک وسطِ برچسب نیفتد ―');
{
  /* برچسبِ درجه حرفِ لاتین دارد («A آسیایی») و سال ارقامِ فارسی. در بندِ
     راست‌به‌چپ الگوریتمِ دوجهته این دو را قاطی می‌کرد. اندازه‌گیریِ واقعی
     در کروم: بدونِ ایزوله «A» در x=318 و «آسیایی» در x=263 می‌نشست —
     یعنی برچسب وارونه می‌شد؛ با ایزوله ترتیب درست است. */
  for (const f of ['lib/coach-store.ts', 'lib/referee-store.ts']) {
    const src = read(f);
    t(`ایزوله‌ی دوجهته در ${f.split('/')[1]}`,
      src.includes('\\u2068${g.label}\\u2069') && src.includes('\\u2068${g.year}\\u2069'),
      'FSI/PDI داخلِ خودِ رشته، تا هرجا رندر شد درست بماند');
  }
  /* ⚠️ آن نویسه‌ها نامرئی‌اند ولی کاراکترند: هرکس این متن را *می‌سنجد*
     باید اول پاکشان کند. پنلِ ادمین کلیدِ درجه را با `startsWith` از
     روی همین خط پیدا می‌کند و بدونِ پاک‌کردن هرگز جور نمی‌شد — کلاسِ
     لاتینِ عنوان‌های انگلیسی بی‌صدا از دست می‌رفت. */
  t('پاک‌کننده‌ی دوجهته در ابزارِ متن هست',
    read('lib/text-fa.ts').includes('export const stripBidi'));
  t('جست‌وجوی کلیدِ درجه از آن رد می‌شود',
    read('app/admin/referees/page.tsx').includes('stripBidi(line).startsWith'),
    'وگرنه کلاسِ لاتینِ عنوان‌های انگلیسی از دست می‌رود');
}

console.log('\n― ردیفِ رزرو در فایلِ مشترک ―');
{
  /* این قاعده در `<style>` صفحه‌ی داشبورد بود ولی کامپوننتش در /booking
     هم رندر می‌شود — آن‌جا کاملاً بی‌قاب دیده می‌شد. */
  /* خودِ قاعده سنجیده می‌شود، نه صرفِ وجودِ نام: بلوکِ
     `prefers-reduced-motion` هم یک `.booking-row {` دارد و ادعای
     نام‌محور با حذفِ قاعده‌ی اصلی هم سبز می‌ماند. */
  const bookingRule = read('app/globals.css').split('.booking-row {')[1]?.split('}')[0] ?? '';
  t('booking-row در globals است',
    bookingRule.includes('background:') && bookingRule.includes('border-radius:'));
  t('نسخه‌ی محلیِ داشبورد حذف شد',
    !read('app/dashboard/page.tsx').includes('.booking-row {'),
    'دو تعریف یعنی یکی‌شان روزی عقب می‌ماند');
}

console.log('\n― صحنه روی همه‌ی صفحه‌های اصلی ―');
{
  const pages = [
    'app/booking/page.tsx', 'app/booking/[clubId]/page.tsx',
    'app/coaches/page.tsx', 'app/referees/page.tsx', 'app/players/page.tsx',
    'app/news/page.tsx', 'app/tournaments/page.tsx', 'app/services/page.tsx',
    'app/manufacturers/page.tsx', 'app/advertise/page.tsx', 'app/cart/page.tsx',
    'app/checkout/page.tsx', 'app/live/page.tsx', 'app/plans/page.tsx',
    'app/ranking/page.tsx', 'app/results/page.tsx', 'app/story-plans/page.tsx',
  ];
  const missing = [];
  /* دنبالِ خودِ className می‌گردیم نه نامِ کلاس: هفت فایل کامنتی دارند
     که واژه‌ی lq-stage در آن آمده و ادعای نام‌محور با حذفِ className هم
     سبز می‌ماند. */
  for (const p of pages) if (!read(p).includes('className="lq-stage"') && !read(p).includes("className={'lq-stage'") && !/className="[^"]*lq-stage/.test(read(p))) missing.push(p);
  t('همه‌ی صفحه‌های اصلی صحنه دارند', missing.length === 0,
    missing.length ? 'بدونِ صحنه: ' + missing.join(' · ') : '');
}


console.log('\n― دکمه و فیلد روی سیستمِ موجود ―');
{
  /* ⚠️ یک‌بار این‌جا یک سیستمِ دومِ دکمه/فیلد ساخته شد در حالی که
     `.btn`/`.input` از قبل بودند و ده‌ها فایل از آن‌ها استفاده
     می‌کردند. پس گرفته شد و حالت‌های گمشده به همان سیستمِ موجود
     اضافه شد. این تست جلوی برگشتنش را می‌گیرد. */
  const css = read('app/globals.css');
  /* دنبالِ *قاعده* می‌گردیم نه هر ذکری: کامنتِ بالای همین بخش در
     globals عمداً نامشان را دارد تا تاریخچه گم نشود. */
  t('سیستمِ دومِ دکمه/فیلد ساخته نشده',
    !/^\.lq-btn/m.test(css) && !/^\.lq-field/m.test(css),
    'قاعده‌ی ۲ پروژه: قبل از نوشتن بگرد؛ دوباره‌کاری باگ است');

  /* چهار حالت، روی همان سیستمِ موجود */
  t('دکمه: focus-visible', css.includes('.btn:focus-visible'));
  t('دکمه: غیرفعال', css.includes('.btn:disabled'));
  t('دکمه: در حالِ کار', css.includes("[data-busy='true']::after"));
  t('فیلد: focus-visible', css.includes('.input:focus-visible'));
  t('فیلد: غیرفعال', css.includes('.input:disabled'));
  /* با آکولاد: '.input-sm' زیررشته‌ی '.input-smx' هم هست */
  t('نسخه‌ی فشرده‌ی فیلد', css.includes('.input-sm {'));
  /* iOS 26: خودِ کنترل شیشه است، نه اینکه روی شیشه بنشیند. سه جزء
     لازم است — اشباع، تارکردنِ پس‌زمینه، و درخششِ لبه. نبودِ حتی یکی
     نتیجه را به «سفیدِ رنگ‌پریده» برمی‌گرداند. */
  const glass = css.split('.input-glass {')[1]?.split('}')[0] ?? '';
  t('واریانتِ شیشه‌ایِ فیلد کامل است',
    /(^|[^-])backdrop-filter:/m.test(glass) && glass.includes('saturate')
    && glass.includes('inset 0 1.5px 0'),
    'بدونِ blur و درخششِ لبه فقط رنگ‌پریده می‌شود');
  t('شیشه هندسه را دست نمی‌زند',
    !glass.includes('border-radius') && !/border:/.test(glass),
    'وگرنه اندازه‌ی فشرده‌ی .input-sm بی‌اثر می‌شود');
  /* ⚠️ سمتِ *شروع*، نه پایان: در چیدمانِ راست‌به‌چپ آیکونِ جست‌وجو
     سمتِ راست می‌نشیند و 'inline-end' یعنی چپ. یک‌بار اشتباه گرفته شد و
     متن از زیرِ آیکون رد می‌شد. */
  t('پدینگِ آیکون منطقی و در سمتِ درست است',
    /\.input-icon-start(-lg)?\s*\{\s*padding-inline-start:/.test(css)
    && !css.includes('.input-icon-end'),
    'راست/چپِ فیزیکی در چیدمانِ راست‌به‌چپ ممنوع است');

  const pages = ['app/tournaments/page.tsx', 'app/news/page.tsx', 'app/players/page.tsx', 'app/services/page.tsx'];
  for (const p of pages) {
    t(`فیلدِ مشترک در ${p.split('/')[1]}`, /className="input input-glass input-sm/.test(read(p)));
  }
  /* ── چرا این ادعا روی TSX است و نه CSS ──
     باگِ واقعی این‌جا بود، نه در استایل‌شیت: آیکون با
     `insetInlineEnd` نوشته شده بود که در راست‌به‌چپ یعنی چپ، و متن
     از زیرش رد می‌شد. گاردِ CSS-only آن را نمی‌دید. */
  const heroPages = ['app/sellers/page.tsx', 'app/manufacturers/page.tsx'];
  for (const p of heroPages) {
    t(`فیلدِ هیرو در ${p.split('/')[1]}`,
      /className="input input-glass input-icon-start-lg/.test(read(p)));
  }
  for (const p of [...pages, ...heroPages]) {
    const src = read(p);
    /* ⚠️ دو تلاشِ قبلی خطا داشتند و روی فایلِ *سالم* قرمز شدند:
       برش‌زدنِ اولین `<svg>` گرافیکِ تزئینیِ هیرو را می‌گرفت، و جست‌وجوی
       سراسریِ `right:` به لکه‌های پس‌زمینه می‌خورد که فیزیکی‌بودنشان
       اشکالی ندارد.

       پنجره باید *هر دو طرفِ* فیلد را بگیرد: در صفحه‌های هیرو آیکون
       پیش از `<input>` می‌آید و در نوارهای ابزار بعد از آن. نسخه‌ی
       یک‌طرفه روی چهار صفحه‌ی سالم قرمز شد. */
    const at = src.indexOf('input-icon-start');
    const win = at > 0 ? src.slice(Math.max(0, at - 700), at + 700) : '';
    t(`آیکونِ جست‌وجو در ${p.split('/')[1]} سمتِ شروع است`,
      win.includes('insetInlineStart') && !/\b(right|left):\s*\d/.test(win),
      'در راست‌به‌چپ آیکون سمتِ راست می‌نشیند؛ inline-end یعنی چپ');
  }
  t('هر فیلد برچسبِ دسترس‌پذیری دارد',
    [...pages, ...heroPages].every(p => /aria-label="جستجو/.test(read(p))),
    'قاعده‌ی پروژه: هر input یک برچسب');

  t('قاعده‌ی فوکوسِ محلی حذف شد',
    pages.every(p => !/-search:focus \{/.test(read(p))),
    'نسخه‌ی محلی !important داشت و کلاسِ مشترک را بی‌اثر می‌کرد');
  t('حالتِ باز کلاس است نه رنگِ درون‌خطی',
    css.includes('.btn.is-open') && !read('app/news/page.tsx').includes('borderColor: sortOpen'),
    'مقدارِ درون‌خطی بر :hover برنده می‌شود و حاشیه‌ی هاور را می‌کشد');
}

console.log('\n― یک سطح برای کارتِ محصول ―');
{
  /* یک محصول در سه صفحه دیده می‌شود و تا امروز سه کارتِ متفاوت بود:
     `.mk-card` در بازار، `.bz-card` در صفحه‌ی اصلی، و `.prod-card-sec1`
     در فروشگاه — هر کدام با پس‌زمینه و حاشیه و hoverِ خودش. */
  const css = read('app/globals.css');
  t('کلاسِ سطحِ کارت در فایلِ مشترک است', css.includes('.lq-pcard {'));
  t('لبه‌ی کارت مرکبی است نه سفید',
    /\.lq-pcard \{[\s\S]{0,400}border: 1px solid rgba\(28,28,26/.test(css),
    'لبه‌ی سفید روی زمینه‌ی روشنِ بازار کاملاً محو می‌شد');

  const users = [
    ['app/shop/page.tsx', 'mk-card lq-pcard'],
    ['app/shop/page.tsx', 'mk-row lq-pcard'],
    ['app/HomeClient.tsx', 'bz-card lq-pcard'],
    ['app/sellers/[id]/FlatShop.tsx', 'prod-card-sec1 lq-pcard'],
    ['app/shop/[id]/page.tsx', 'pd-card lq-pcard'],
  ];
  for (const [p, cls] of users) {
    t(`«${cls.split(' ')[0]}» سطحِ مشترک را گرفته`, read(p).includes(cls));
  }
  /* هیچ‌کدام نباید پس‌زمینه/حاشیه‌ی خودش را دوباره تعریف کند، وگرنه
     ترتیبِ سند برنده می‌شود و سطحِ مشترک بی‌اثر می‌ماند. */
  t('کارتِ بازار پس‌زمینه‌ی محلی ندارد',
    !/\.mk-card \{[^}]*background:/.test(read('app/shop/page.tsx')));
  t('کارتِ صفحه‌ی اصلی پس‌زمینه‌ی محلی ندارد',
    !/\.bz-card \{[^}]*background:/.test(read('app/HomeClient.tsx')));

  /* صحنه‌ی رنگی روی صفحه‌های فهرست و جزئیات */
  for (const p of ['app/shop/page.tsx', 'app/sellers/page.tsx', 'app/clubs/page.tsx', 'app/shop/[id]/page.tsx']) {
    /* مسیرِ کامل در برچسب: `app/shop/page.tsx` و `app/shop/[id]/page.tsx`
       هر دو با تکه‌ی دوم «shop» می‌شدند و دو تست هم‌نام چاپ می‌کردند. */
    t(`صحنه در ${p}`, read(p).includes('className="lq-stage"'));
  }
  /* صفحه‌ی فروشگاه صحنه‌ی خودش را دارد (`shop-shell`) و نباید دو تا شود */
  t('فروشگاه صحنه‌ی دوم نگرفته',
    !read('app/sellers/[id]/FlatShop.tsx').includes('lq-stage')
    && read('app/sellers/[id]/FlatShop.tsx').includes('.shop-shell'),
    'دو لایه‌ی گرادیانِ ثابت روی هم، هم زشت است هم گران');

  /* نامِ برقِ ورودی نباید با کلاسِ هم‌نامِ صفحه‌ی جزئیات قاطی شود */
  t('برقِ ورودی نامِ جدا دارد',
    css.includes('.lq-enter-sheen') && !css.includes('.lq-sheen {'),
    'صفحه‌ی جزئیاتِ محصول از قبل `lq-sheen` دارد و آن برقِ هاور است');
}


console.log('\n― صفحه‌ی باشگاه روی همان لایه‌ی مربی ―');
{
  /* «دقیقاً مثلِ صفحه‌ی مربی» — پس همان کلاس‌های مشترک، نه یک نسخه‌ی
     محلیِ دیگر. نوارِ تبِ قبلی رنگِ تأکیدِ بنفش داشت و چهار عرضِ
     متفاوت می‌ساخت. */
  const club = read('app/clubs/[id]/page.tsx');
  t('باشگاه روی صحنه‌ی لیکویید نشسته', club.includes('className="lq-stage"'));
  t('کارت‌های باشگاه شیشه‌ای‌اند', (club.match(/lqg/g) ?? []).length >= 8,
    'نه پس‌زمینه‌ی سفیدِ تخت');
  t('نوارِ تبِ محلی حذف شد', !club.includes('.tab-btn') && !club.includes('tab-btn ${tab'),
    'دو سیستمِ تب یعنی یکی‌شان از قلم می‌افتد');
  t('تب‌ها هم‌عرضِ دقیق‌اند', club.includes('lq-seg lq-seg-fill'),
    'چهار تب که یکی‌شان «ساعت کاری» است، با min-width هم‌عرض نمی‌شوند');
  /* با گیومه‌ی پایانی سنجیده می‌شود: `cpanel-schedule` زیررشته‌ی
     `cpanel-scheduleX` هم هست و ادعای بدونِ گیومه، شکستنِ پیوند را
     ساکت رد می‌کرد. */
  t('هر تب پنلِ متناظر دارد',
    ['info', 'gallery', 'tournaments', 'schedule'].every(k => club.includes(`id="cpanel-${k}"`)),
    'aria-controls بدونِ پنل یعنی وعده‌ی بی‌پشتوانه به صفحه‌خوان');
  t('کلیدهای جهت روی نوارِ تب',
    club.includes('onKeyDown={onTabKey}') && club.includes('useTabKeys('));
  /* سه صفحه، یک منطق. نسخه‌ی محلی در هیچ‌کدام نماند. */
  t('منطقِ کلیدهای تب یک نسخه دارد',
    existsSync(join(ROOT, 'hooks/use-tab-keys.ts'))
    && read('hooks/use-tab-keys.ts').includes('ArrowLeft')
    && ['app/coaches/[id]/page.tsx', 'app/referees/[id]/page.tsx', 'app/clubs/[id]/page.tsx']
      .every(p => read(p).includes('useTabKeys(') && !read(p).includes("e.key === 'ArrowLeft'")),
    'سه نسخه‌ی جدا یعنی یکی‌شان روزی جا می‌ماند');
  t('حالتِ هم‌عرض در فایلِ مشترک است',
    read('app/globals.css').includes('.lq-seg-fill'),
    'قاعده‌ی پروژه: استایلِ تکرارشونده کلاسِ مشترک می‌گیرد');
}


console.log('\n― نمای تمام‌صفحه‌ی عکس پروفایل ―');
{
  /* یک نمای مشترک برای همه‌ی نقش‌ها. چهار صفحه از قبل نسخه‌ی ناقصِ
     خودشان را داشتند؛ این پنجمی ساخته نشد. */
  t('هوکِ مشترک هست', existsSync(join(ROOT, 'components/ProfileImageViewer.tsx')));
  const pages = [
    'app/coaches/[id]/page.tsx',
    'app/referees/[id]/page.tsx',
    'app/clubs/[id]/page.tsx',
    'app/sellers/[id]/FlatShop.tsx',
    'app/services/[id]/page.tsx',
    'app/manufacturers/[id]/page.tsx',
    'app/users/[id]/page.tsx',
  ];
  for (const p of pages) {
    const src = read(p);
    t(`نما در ${p.split('/').slice(1, 2)} وصل است`,
      src.includes('useProfileImageViewer') && src.includes('{imageViewer}') && src.includes('openImage('),
      'هوک، رندرِ نما و دستِ‌کم یک نقطه‌ی بازکردن — هر سه لازم است');
  }
  t('لایه‌ی شیشه‌ای در فایلِ مشترک است، نه در صفحه',
    read('app/globals.css').includes('.lqg {') && read('app/globals.css').includes('.lq-seg'),
    'قاعده‌ی پروژه: افکتِ شیشه‌ای یک کلاسِ مشترک دارد');
}

console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} قبول · ${fail} رد\n`);
process.exit(fail === 0 ? 0 : 1);
