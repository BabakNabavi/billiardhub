# Billiard Hub Advertising System Progress

## Current Phase

PHASE 3 — IDENTITY-BASED FREE AD QUOTA

## Status

COMPLETED — ۱۴۰۵/۰۵/۰۶ (2026-07-28) · کامیت `1c24a55`

---

## Decision D3 — PHASE 3 Security Finding — Closed

تصمیمِ ثبت‌شده‌ی مالک — ۱۴۰۵/۰۵/۰۶ (2026-07-28). این یادداشت بر هر برداشتِ دیگری از بخشِ «Security (فاز ۳)» در همین سند مقدم است.

**وضعیت: Closed.**

* حفره‌ی امنیتی — نبودِ RLS روی `users`/`clubs`/`tables` و در نتیجه امکانِ خواندن/نوشتنِ آن‌ها با کلیدِ عمومیِ Supabase — شناسایی و در **مایگریشن ۰۱۷** اصلاح شد.
* **زمینه‌ی واقعیِ پروژه:** در تمامِ مدتی که این حفره وجود داشت، پروژه در محیطِ **خصوصی/Preview** روی Vercel توسعه و تست می‌شد و **فقط توسطِ مالکِ پروژه** استفاده شده است؛ به‌صورتِ عمومی منتشر نشده و نشانیِ آن در اختیارِ شخصِ دیگری نبوده است.
* بنابراین **هیچ Incident Response یا اقدامِ اضطراری برای کاربران لازم نیست** و هیچ‌کدام از موارد زیر انجام نشده و نباید انجام شود: بازنشانیِ اجباریِ رمز، باطل‌کردنِ نشست‌ها، خروجِ اجباریِ کاربران، چرخاندنِ Secret/Credential، حذف یا تغییرِ داده، و ساختِ مایگریشنِ تازه برای این موضوع.
* بررسیِ گسترده‌ی Incident یا جست‌وجوی سوءاستفاده‌ی واقعی نیز در این مرحله لازم تشخیص داده نشد.
* **اصلاحاتِ مایگریشن ۰۱۷ الزامِ قطعیِ Production هستند** و باید دست‌نخورده بمانند.

### الزاماتِ قطعیِ Production (معیارِ پذیرشِ همه‌ی فازهای بعدی)

۱. RLS روی جداولِ حساس همیشه فعال بماند.
۲. کلاینت هیچ دسترسیِ مستقیمی به داده‌های حساس نداشته باشد.
۳. کد ملی فقط از مسیرِ امنِ سرورساید مدیریت شود.
۴. نقش و تأیید (Verification) فقط از بک‌اند و با Enforcement سمتِ سرور کنترل شود.
۵. کاربر نتواند خودش را Admin یا Verified کند.
۶. هیچ منطقِ امنیتیِ مهمی صرفاً به کلاینت یا localStorage اعتماد نکند.
۷. همه‌ی عملیاتِ حساس سرورساید و با Authorizationِ درست کنترل شوند.
۸. کلیدِ عمومیِ Supabase هرگز نقشِ مجوزِ دسترسی به داده‌های حساس را نداشته باشد.

### اقدامِ باقی‌مانده

پیش از عمومی‌شدنِ نهاییِ سایت، یک **Security Audit نهایی در PHASE 7** انجام شود.

---

## Identity Architecture (فاز ۳)

```
persons  (شخصِ حقیقی — واحدِ سهمیه)
  id uuid PK
  national_id_hash text UNIQUE   ← HMAC-SHA256 کد ملیِ نرمال‌شده
  is_test boolean                ← پرچمِ حساب‌های تستیِ مالک (بی‌اثر در منطق)
     ▲
     │ users.person_id  (FK، ON DELETE SET NULL — «لینک» است نه Merge)
     │
  چند حساب ← یک شخص ← یک سهمیه‌ی مشترک
```

* **کلیدِ هش عمداً از env نمی‌آید**، از `app_settings.person_hash_salt` (جدولی با RLS و بدون policy ⇒ فقط service-role) خوانده می‌شود. اگر کلید از `JWT_SECRET` می‌آمد، هر محیطی با secret متفاوت برای یک کد ملی هشِ متفاوت می‌ساخت و همان شخص دو ردیف persons و دو برابر سهمیه می‌گرفت. `NID_HMAC_SECRET` در صورت تنظیم مقدم است (برای چرخشِ دستی).
* خودِ کد ملی هرگز در `persons` ذخیره نمی‌شود؛ فقط هش.
* اتصال در سه نقطه: ثبت‌نام (پس از تأییدِ شاهکار)، مسیرِ احرازِ کد ملیِ حساب‌های قدیمی، و بک‌فیلِ تنبل در کرانِ روزانه. بک‌فیل **عمداً روی سرورِ پروداکشن** اجرا می‌شود تا هش با نمکِ همان دیتابیس ساخته شود.
* **تصمیم D2 رعایت شد**: هر دو حسابِ تستیِ مالک دست‌نخورده باقی‌اند؛ هیچ Merge/حذفی در مایگریشن نیست و اتصال با NULL کردنِ `person_id` برگشت‌پذیر است.
  * وضعِ فعلی روی دیتابیس (پس از بک‌فیلِ پروداکشن): `09001327283` کد ملیِ **تأییدشده** دارد ⇒ به شخص وصل شد. `09121327283` کد ملی دارد ولی `national_id_verified=false` ⇒ هنوز شخص ندارد و سهمیه‌ی رایگان نمی‌گیرد (طبقِ قانونِ «هویتِ تأییدنشده سهمیه نمی‌سازد»). اگر بخواهید هر دو یک سهمیه‌ی مشترک داشته باشند، کافی است هویتِ حسابِ دوم از مسیرِ عادیِ احراز تأیید شود؛ خودکار به همان شخص وصل می‌شود.

## Role Logic (فاز ۳)

نقشِ «تأییدشده» فقط از منابعِ سرورساید خوانده می‌شود — `primaryRole`/`secondaryRoles` خوداظهاری‌اند و **هیچ اثری بر سهمیه ندارند**:

| نقش | منبعِ تأیید |
|---|---|
| user | همه دارند (پایه) |
| player · coach · referee · technician · seller · manufacturer | ردیفِ `profiles` با `status='approved'` **و** `verified=true` |
| club_owner | مالکیتِ باشگاهی با `verificationStatus='verified'` (تأییدِ جواز با کد ملیِ مالک) |

**چرا شرطِ `verified` هم لازم بود:** DDLِ جدولِ profiles برای `status` پیش‌فرضِ `'approved'` دارد و کاربر با ساختنِ پروفایل، خودش approved می‌شد؛ بدونِ شرطِ تیکِ ادمین (`verified`)، هر کاربری با ساختنِ پروفایلِ فروشنده به سهمیه‌ی ۴تایی می‌رسید.

نقش‌های یک شخص از **همه‌ی حساب‌هایش** جمع‌آوری می‌شود (نه فقط حسابِ جاری).

## Quota Logic (فاز ۳)

* **Free Quota = بیشینه‌ی سهمیه بینِ نقش‌های تأییدشده** (جمع نمی‌شوند): user/player/referee=۱ · technician/coach=۲ · club_owner/manufacturer/seller=۴ — دوره‌ی **۳۰ روزه**. اعداد در `app_settings.ads_free_quota` و از پنل ادمین قابل ویرایش‌اند (هاردکد نیستند).
* مصرف در دفترِ `quota_consumptions` ثبت می‌شود، نه با شمارشِ آگهی‌های زنده ⇒ **حذف یا انقضای آگهی سهمیه را برنمی‌گرداند** (چرخه‌ی ثبت→حذف→ثبت بسته شد).
* مصرف **اتمیک** است: `bh_consume_quota` با قفلِ ردیفِ شخص (FOR UPDATE) بررسی و ثبت را در یک تراکنش انجام می‌دهد؛ دو درخواستِ هم‌زمان حتی از دو حسابِ یک شخص نمی‌توانند از سقف رد شوند.
* **ارتقای نقش** سقف را بالا می‌برد ولی مصرفِ قبلی ریست نمی‌شود؛ **تنزلِ نقش** هم مصرف را پاک نمی‌کند (شخصِ مازادمصرف تا خروجِ مصرف‌ها از پنجره مسدود می‌ماند) ⇒ چرخاندنِ مکررِ نقش سودی ندارد.
* حسابِ بدونِ کد ملیِ تأییدشده شخص ندارد ⇒ سهمیه‌ی رایگان ندارد (`identityRequired` با راهنمای تأییدِ هویت در UI).
* دو مسیرِ ثبتِ آگهی (`/api/market/ads` و `/api/products`) هر دو از همین دروازه رد می‌شوند.
* `resetAt` زمانِ بازشدنِ **اولین جای خالی** است (با در نظر گرفتنِ مصرفِ مازاد)، نه صرفاً قدیمی‌ترین مصرف.
* مسیرِ پلنِ خریداری‌شده عمداً دست‌نخورده ماند (per-account، شمارشِ products) — انتقالش به اعتبارهای شخص‌محور در فاز ۵.

## Database Changes (فاز ۳)

* **۰۱۶**: جدولِ `persons`، ستون + FK + ایندکسِ `users.person_id`، جدولِ `quota_consumptions`، تابعِ `bh_consume_quota` (با `REVOKE ... FROM PUBLIC, anon, authenticated`)، و مقداردهیِ یک‌باره‌ی `ads_free_quota` با اعدادِ فاز ۳ (گیت‌شده با مارکرِ `mig_016_data_done` تا ویرایشِ بعدیِ ادمین بازنویسی نشود). RLS روی هر دو جدولِ جدید روشن و بدون policy.
* **۰۱۷ (امنیتی)**: `users`/`clubs`/`tables` هرگز RLS نداشتند و گرنتِ anon داشتند.
* `app_settings.person_hash_salt` — نمکِ هشِ اشخاص (خودکار در اولین اجرا ساخته می‌شود).

## Security (فاز ۳)

* **حفره‌ی بحرانیِ کشف‌شده و بسته‌شده** (وضعیتِ نهایی و تعیین‌تکلیف در **Decision D3** بالا — Closed، بدونِ نیاز به Incident Response): کلیدِ `anon` داخلِ باندلِ مرورگر منتشر می‌شود و سه جدولِ پایه RLS نداشتند. اندازه‌گیریِ زنده پیش از اصلاح: `GET /rest/v1/users` → ۲۰۰ با ردیف‌های واقعی (کد ملی، هشِ رمز، کدِ OTP) و `PATCH /rest/v1/users` → ۲۰۴. یعنی در آن وضعیت، دارنده‌ی کلید می‌توانست کد ملیِ خود را عوض کند (سهمیه‌ی تازه)، باشگاهی را verified کند (سهمیه‌ی ۴تایی) یا خودش را admin کند. پس از مایگریشن ۰۱۷: هر چهار مسیر ۴۰۱ می‌دهند و `products` فقط خواندنی مانده. Storage و Realtime دست‌نخورده کار می‌کنند. طبقِ D3، پروژه در این بازه خصوصی/Preview و فقط در دستِ مالک بوده است.
* خودتأییدیِ باشگاه بسته شد: `PUT /api/clubs/[id]` دیگر بدنه‌ی خام را UPDATE نمی‌کند؛ فیلدهای اعتماد (`verificationStatus`، `licenseVerified`، `licenseCheckedAt`، `licenseNumber`، `ibanVerified`، `ibanOwnerName`، `ownerId`، `id`، `createdAt`) برای غیرادمین حذف می‌شوند.
* دروازه‌ی سهمیه هنگام خطای دیتابیس **fail-closed** است (۵۰۳)، نه fail-open؛ ولی «هویت تأیید نشده» از «خطای زیرساخت» تفکیک شده تا کاربرِ تأییدشده پیامِ اشتباه نبیند.
* کد ملی همچنان فقط به مالکِ حساب نمایش داده می‌شود و از هیچ مسیری با ورودیِ کلاینت نوشته نمی‌شود (تست شد).
* تابعِ مصرف از دسترسِ anon خارج است (تست: ۴۰۱).

## Tests (فاز ۳)

**۳۷/۳۷ سناریوی موظف** (پوششِ هر ۱۷ موردِ خواسته‌شده) + **۱۴ تستِ تکمیلی** برای اصلاحاتِ بازبینی — همه علیه بیلدِ production و دیتابیسِ زنده، با پاک‌سازیِ کاملِ فیکسچرها:

۱ فقط user=۱ · ۲ player=۱ · ۳ technician=۲ · ۴ coach=۲ · ۵ باشگاه‌دارِ verified=۴ · ۶ همه‌ی ۸ نقش ⇒ ۴ (نه ۲۱) · ۷ نقشِ تأییدنشده بی‌اثر · ۸ تیکِ ادمین ⇒ ۴ · ۹ و ۱۰ دو حساب با یک کد ملی ⇒ یک شخص و سهمیه‌ی مشترک (هر دو حساب سالم) · ۱۱ مصرفِ واقعی از API · ۱۲ حذفِ آگهی بدونِ برگشتِ سهمیه · ۱۳ انقضا بدونِ برگشت · ۱۴ دوره‌ی ۳۰ روزه‌ی تازه · ۱۵ ارتقای نقش بدونِ ریستِ مصرف · ۱۶ تنزلِ نقشِ امن · ۱۷ تلاش‌های دور زدن (نقشِ خوداظهاری، بدونِ هویت، دستکاریِ کد ملی/person_id، صدا زدنِ تابع با کلیدِ anon، و رقابتِ هم‌زمان از دو حسابِ یک شخص که فقط یکی برنده می‌شود).

تکمیلی: دروازه‌ی `/api/products`، ممنوعیتِ خودتأییدیِ باشگاه (و مجازبودنِ ادمین)، پایداریِ هشِ نمکِ دیتابیس، و صحتِ `resetAt` هنگام مصرفِ مازاد.

## Known Issues (فاز ۳)

* ~~نیاز به تصمیمِ مالک درباره‌ی چرخاندنِ رمزها/نشست‌ها~~ — **تعیین‌تکلیف شد**: طبقِ **Decision D3**، پروژه در آن بازه خصوصی/Preview و فقط در دستِ مالک بوده؛ هیچ اقدامِ Incident Response لازم نیست و هیچ‌کدام انجام نشده است. این مورد بسته است.
* `ads_quota_enabled` هنوز **خاموش** است (رفتار فعلی حفظ شد). تا روشن‌شدنش هیچ کاربری مسدود نمی‌شود، ولی مصرف‌ها از همین حالا در دفتر ثبت می‌شوند تا تاریخچه واقعی باشد.
* سهمیه‌ی استوری هنوز per-account و بر پایه‌ی نقشِ خوداظهاری است (فقط باگِ «صفر یعنی نامحدود» در انتخابِ نقش اصلاح شد)؛ شخص‌محورکردنش در فازِ بعدی.
* پلنِ خریداری‌شده هنوز per-account است و حذفِ آگهی در پنجره‌اش سهمیه را برمی‌گرداند — تا فاز ۵ پذیرفته شده.
* اگر پردازش بینِ «مصرفِ سهمیه» و «درجِ آگهی» قطع شود (کرشِ سرور)، یک سهمیه می‌سوزد؛ مسیرِ جبران فقط خطای دیتابیس را پوشش می‌دهد.

## Next Phase

PHASE 4 — (منتظر دستور شما) · پیشنهاد: انتقالِ بسته‌های پولی به اعتبارهای شخص‌محور + ledger، سپس پرداختِ جایگاه‌های تبلیغاتی.

**PHASE 7 — Security Audit نهایی (الزامی پیش از عمومی‌شدنِ سایت):** طبقِ Decision D3، پیش از انتشارِ عمومی باید یک ممیزیِ امنیتیِ نهایی انجام شود که دستِ‌کم هر هشت الزامِ قطعیِ Production (بخشِ D3) را روی محیطِ واقعی راستی‌آزمایی کند.

---

# PHASE 2 — CORE ADVERTISING SYSTEM (آرشیو)

COMPLETED — ۱۴۰۵/۰۵/۰۶ (2026-07-28)

هستهٔ Placement/Campaign/Pricing/Expiration ساخته، تست، بازبینی و روی دیتابیس زنده اعمال شد. مطابق تصمیمات D1/D2 (بخش Decisions فاز ۱ در ادامهٔ همین سند).

## Completed (فاز ۲)

* **مایگریشن 015** (`supabase/migrations/015_advertising_core.sql`) — روی دیتابیس زنده اعمال شده: جدول‌های `placements` (۶ جایگاه مستقل)، `campaigns` (۸ وضعیت)، `ad_pricing_plans` (پلن‌های DB-driven)، `ad_credits` (اسکیمای اعتبار آگهی)، `campaign_orders` (اسکیمای سفارش، ایندکس یکتای `provider_authority`).
* **توابع اتمیک**: `bh_expire_campaigns()` (SCHEDULED→ACTIVE و ACTIVE/SCHEDULED/PENDING_*→EXPIRED؛ DRAFT عمداً مستثنا) و `bh_track_campaign()` (شمارش اتمیک فقط برای کمپین ACTIVE داخل پنجرهٔ زمانی) — هر دو با `REVOKE ... FROM PUBLIC, anon, authenticated` (تأییدشده در ACL زنده).
* **بدون Master Toggle**: هر جایگاه `is_active` و `mode` (free/manual/paid) مستقل دارد؛ `ad_slots_enabled` از whitelist ادمین حذف شد و در تست ۴ ثابت شد بی‌اثر است.
* **API عمومی** `/api/ads/placements` (+`?catalog=1`) با resolve سروری موجودیت‌ها (محصول/باشگاه/فروشنده → snapshot کارت)؛ **آداپتور سازگاری** `/api/ads/slots` (DEPRECATED، کلیدهای legacy برای باندل‌های کش‌شده)؛ **API ادمین** `/api/admin/advertising`؛ **کران** `/api/cron/expire-campaigns` (روزانه، vercel.json).
* **پنل ادمین جدید** `/admin/advertising`: کنترل مستقل هر جایگاه (فعال/غیرفعال + حالت + ظرفیت/قیمت/مدت)، مدیریت کمپین‌ها (بنری/موجودیتی، تغییر وضعیت بین ۸ حالت، حذف)، ویرایش پلن‌های قیمت‌گذاری، فهرست درخواست‌های تبلیغات. `/admin/ad-slots` → redirect.
* **AdSlot v2**: چرخش اسلایدری وزن‌دار برای جایگاه بنری، برچسب شفافیت «تبلیغ»، شمارش impression/click با sendBeacon، هوک `usePlacement` برای سکشن‌های ویژه.
* **چیدمان D1** در صفحهٔ اصلی: بازار = ۱۴ محصول بدون بنر کناری؛ فروشگاه‌های تجهیزات = راست/اصلی/چپ در Desktop و ستونی بدون Overflow در Mobile؛ بنر پایینی در layout. سه سکشن ویژه placement-driven شدند با fallback به آرایه‌های فعلی وقتی جایگاه خالی/غیرفعال است.
* **بازبینی خصمانه** (۳ بازبین + راستی‌آزماها) و رفع همهٔ یافته‌های تأییدشده: CSRF بیکن (CSRF_EXEMPT در proxy)، XSS از `javascript:` در link_url (اعتبارسنجی + safeHref)، extendDays (تمدید از انتهای فعلی نه جایگزینی)، await روی tracking/expiry در سرورلس، فیلتر UUID در resolve (یک ref خراب کل کوئری را نمی‌کشد)، گیت idempotency مهاجرت داده با مارکر، بازنویسی CSS گرید (بدون `:has`، بدون gap باقی‌مانده)، dedupe کمپین‌های هم‌مرجع.

## Files Changed (فاز ۲)

* **جدید:** `supabase/migrations/015_advertising_core.sql`، `apps/web/lib/ads/core.ts`، `apps/web/lib/ads/resolve.ts`، `apps/web/app/api/ads/placements/route.ts`، `apps/web/app/api/admin/advertising/route.ts`، `apps/web/app/admin/advertising/page.tsx`، `apps/web/app/api/cron/expire-campaigns/route.ts`
* **تغییر:** `components/ads/AdSlot.tsx` (بازنویسی v2)، `app/page.tsx` (چیدمان D1 + سکشن‌های placement-driven)، `app/layout.tsx`، `app/advertise/page.tsx` (کاتالوگ از placements)، `app/api/ads/slots/route.ts` (آداپتور legacy)، `app/api/ads/requests/route.ts`، `app/admin/ad-slots/page.tsx` (redirect)، `app/admin/page.tsx`، `app/api/admin/settings/route.ts` (حذف `ad_slots_enabled`)، `proxy.ts` (CSRF_EXEMPT برای بیکن)، `vercel.json` (کران دوم)
* **حذف:** `apps/web/lib/ads/slots.ts`، `apps/web/app/api/admin/ad-slots/route.ts`

## Database Changes (فاز ۲)

* ۶ جایگاه seed شده، **همه `is_active=false`** (رفتار فعلیِ بدون بنر حفظ شد؛ روشن‌کردن با پنل ادمین). حالت پیش‌فرض: سه جایگاه موجودیتی `manual`، سه جایگاه بنری `paid`. ظرفیت‌ها: ۱۴/۸/۱۲/۱/۱/۱.
* ۵ پلن پیش‌فرض قیمت‌گذاری (تومان، در DB و قابل ویرایش از پنل — هاردکد نیست): رایگان ۰؛ پایه ۲۴۹٬۰۰۰/۳ آگهی/۳۰ روز؛ حرفه‌ای ۴۹۹٬۰۰۰/۷/۶۰؛ کسب‌وکار ۹۹۹٬۰۰۰/۱۵/۶۰؛ فروشگاهی ۱٬۹۹۰٬۰۰۰/۳۰/۹۰.
* جدول‌های قدیمی `ad_slots`/`ad_placements` **دست‌نخورده به‌عنوان آرشیو** ماندند؛ `ad_requests` همچنان زنده و متصل است. کلید `ad_slots_enabled` در app_settings مانده ولی هیچ کدی دیگر نمی‌خواندش.

## Migration (فاز ۲)

* کپی دادهٔ جایگاه‌ها/بنرهای قدیمی با نگاشت `market_1→equipment_ads_right`، `market_2→equipment_ads_left`، `footer→homepage_bottom_banner`.
* **Idempotent**: statementهای کپی داده با مارکر `mig_015_data_done` در app_settings گیت شده‌اند — اجرای مجدد فایل، ویرایش‌های ادمین را بازنویسی یا کمپین حذف‌شده را زنده نمی‌کند.
* اعتبارها (ad_credits) و سفارش‌ها (campaign_orders) فقط اسکیما هستند؛ فلوهای خرید در فازهای ۴–۵ تکمیل می‌شوند (سهمیهٔ رایگان و اعتبار پولی مستقل‌اند).

## Tests (فاز ۲)

**۱۹/۱۹ پاس** (اسکریپت `phase2-tests.js` علیه بیلد production محلی + دیتابیس زنده — بعد از رفع یافته‌های بازبینی دوباره اجرا شد): ساخت ۶ جایگاه، شروع inactive، ذخیرهٔ مستقل free/manual/paid، رد mode نامعتبر توسط CHECK، ساخت کمپین بنری، رد پنجرهٔ زمانی معکوس، غیبت جایگاه inactive از خروجی عمومی، **رندر جایگاه active با وجود `ad_slots_enabled=false` (اثبات حذف Master Toggle)**، صحت محتوای بنر، آداپتور legacy با کلید `market_1`، پذیرش هر ۸ وضعیت، رد وضعیت خارج از لیست (PAUSED)، انقضای خودکار ACTIVE→EXPIRED، فعال‌سازی SCHEDULED→ACTIVE، resolve کمپین موجودیتی به snapshot محصول، ۵ پلن با اعداد دقیق spec، ویرایش‌پذیری قیمت پلن. `npx tsc --noEmit` و `npm run build` سبز.

## Known Issues (فاز ۲)

* کارت‌های باشگاه/فروشندهٔ placement-driven مثل کارت‌های هاردکد فعلی، rating/تعداد میز نمایشی دارند (اسکیمای واقعی این فیلدها را ندارد) — تعیین تکلیف در فاز ۶.
* بیکن شمارش بدون auth است (مثل سیستم قبلی)؛ mitigation فعلی: فقط کمپین ACTIVE داخل پنجره شمرده می‌شود و شمارش اتمیک است. سخت‌گیری برای صورتحساب (dedupe/viewport/rate-limit) = فاز ۶.
* کمپین DRAFT هرگز خودکار منقضی نمی‌شود (عمدی — پیش‌نویس مالِ کاربر است).
* باندل‌های کش‌شدهٔ پنل ادمین تا refresh ممکن است روی `/api/admin/ad-slots` حذف‌شده 404 ببینند (یک‌بار refresh حل می‌کند).
* `href="\plans"` با بک‌اسلش در `shop/new` (یافتهٔ ممیزی فاز ۱ — خارج از دامنهٔ فاز ۲، در فاز پاک‌سازی اصلاح شود).

## Next Phase

PHASE 3 — IDENTITY & VERIFIED ROLES (فقط با دستور صریح مالک شروع می‌شود؛ تصمیم D2 دربارهٔ دو حساب تستی عیناً رعایت خواهد شد) ← سپس فاز ۴ سهمیهٔ v2، فاز ۵ پرداخت/رزرو جایگاه + ledger، فاز ۶ آنالیتیکس/پاک‌سازی.

---

# PHASE 1 — AUDIT (آرشیو)

COMPLETED — ۱۴۰۵/۰۵/۰۷ (2026-07-29)

هیچ تغییری در کد ایجاد نشده؛ فقط همین فایل ساخته شده است.
روش ممیزی: ۸ ممیزِ موازی روی زیرسیستم‌ها + یک منتقدِ کامل‌بودن که ادعاهای مشکوک را با خواندن دوبارهٔ کد راستی‌آزمایی کرد + اندازه‌گیری زندهٔ دیتابیس Supabase (فهرست جدول‌ها، شمارش ردیف‌ها، مقادیر واقعی app_settings).

---

## Completed

* بررسی کامل ساختار پروژه (frontend، backend مرده، دیتابیس، API، auth، نقش‌ها، هویت، ادمین، آگهی، تبلیغات، پرداخت، آپلود، آنالیتیکس)
* بررسی سیستم کاربران/نقش‌ها/کد ملی — با پاسخ دقیق به تک‌تک سؤالات فاز ۱
* بررسی سیستم آگهی (products) و موتور سهمیهٔ فعلی
* بررسی سیستم تبلیغات فعلی (ad_slots / ad_placements / ad_requests) + تعیین تکلیف حذف/Refactor/حفظ/Migration
* بررسی شش بخش صفحهٔ اصلی و منبع دادهٔ هرکدام
* بررسی لایهٔ پرداخت و حکم دربارهٔ بازاستفاده برای تبلیغات
* اندازه‌گیری زندهٔ دیتابیس: ۳۰ جدول، ۱۱ تابع bh_*، ۷ کلید app_settings، **۲ حساب با ۱ کد ملی مشترک**، مقدار ذخیره‌شدهٔ `ads_free_quota` هنوز شکل قدیمی `{quota:3, period:"week"}`
* طراحی معماری پیشنهادی (Person/Identity + Advertising) و برنامهٔ اجرایی مرحله‌ای
* ثبت دو تصمیم مالک دربارهٔ جای بنرهای کناری و حساب‌های تستی (بخش Decisions)

---

## Decisions

تصمیمات قطعی مالک — ۱۴۰۵/۰۵/۰۷. این دو، سؤال‌های بازِ انتهای ممیزی را می‌بندند و بر هر متن دیگری در این سند مقدم‌اند.

### D1 — جای دو بنر تبلیغاتی: سکشن «فروشگاه‌های تجهیزات»، نه «بیلیارد بازار»

دو Placement کناری (`equipment_ads_right` و `equipment_ads_left`) متعلق به سکشن **فروشگاه‌های تجهیزات** هستند. ساختار نهایی صفحهٔ اصلی:

**سکشن بیلیارد بازار**
* نمایش ۱۴ محصول — Placement: `market_featured_products_homepage`
* این سکشن **هیچ‌کدام از دو بنر کناری را ندارد** (دو `<AdSlot>` فعلی که انتهای این سکشن کار گذاشته شده‌اند، در فاز ۲ باید به سکشن فروشگاه‌ها منتقل شوند)

**سکشن فروشگاه‌های تجهیزات** (در Desktop به‌ترتیب راست / محتوای اصلی / چپ)
* تبلیغ اسلایدری سمت راست — `equipment_ads_right`
* نمایش ۱۲ فروشگاه تجهیزات — `featured_equipment_stores_homepage`
* تبلیغ اسلایدری سمت چپ — `equipment_ads_left`

قواعد:
* هر دو Placement تبلیغاتی کاملاً مستقل از `market_featured_products_homepage` هستند (فعال/غیرفعال/حالت مستقل — طبق اصل «بدون Master Toggle»).
* **Desktop:** چیدمان سه‌ستونه راست / اصلی / چپ.
* **Mobile:** کاملاً Responsive؛ بدون Overflow افقی و بدون به‌هم‌ریختن UI (ستون‌ها زیر هم می‌آیند؛ همان قاعدهٔ موجود پروژه: هیچ عنصری صفحه را عریض نکند).
* تبلیغ‌ها «اسلایدری» هستند — یعنی هر جایگاه کناری می‌تواند بیش از یک بنر بچرخاند (بر خلاف نمایش ثابتِ فعلی؛ نیازمند rotation در فاز ۲).

نگاشت مهاجرت داده (اصلاح‌شده):
* `market_1` → `equipment_ads_right`
* `market_2` → `equipment_ads_left`
* `footer` → `homepage_bottom_banner`
* جدید: `market_featured_products_homepage`، `featured_clubs_homepage`، `featured_equipment_stores_homepage`

### D2 — دو حساب موجود با کد ملی یکسان: حساب‌های تستی مالک — دست نزن

دو حسابی که در ممیزی با یک `national_id` مشترک پیدا شدند، **حساب‌های تستی خودِ مالک** هستند (عمداً با دو شمارهٔ موبایل برای تست بخش‌های مختلف سایت ساخته شده‌اند). بنابراین:

* هیچ‌کدام **حذف نشوند**؛ هیچ‌کدام با دیگری **Merge نشوند**؛ داده‌های هر دو حفظ شود.
* این دو حساب «دادهٔ تستی موجود» تلقی می‌شوند.
* **هیچ Merge یا حذف خودکاری در هیچ Migrationی انجام نشود** — هر اقدامی روی این دو حساب فقط با تأیید صریح مالک.

اصول معماری Production (بدون تغییر):
* هر شخص واقعی یک `Person / Identity` یکتا.
* یکتاییِ National ID در سطح Identity مدیریت می‌شود.
* چند User Account می‌توانند به یک Identity متصل باشند.
* Quota در سطح Person محاسبه می‌شود، نه User Account.

**راهکار امن و قابل‌برگشت برای Migration فاز ۳** (اعلام طبق درخواست — اجرا فقط پس از تأیید):
* قید یکتایی روی `persons.national_id_hash` است، نه روی `users.national_id` — پس وجود دو ردیف user با یک کد ملی **هیچ Conflictی با قید ایجاد نمی‌کند**: یک ردیف `persons` ساخته می‌شود و هر دو حساب با `users.person_id` به همان یک ردیف اشاره می‌کنند. این «اتصال» است، نه Merge: هر دو حساب، نشست‌ها، آگهی‌ها و پروفایل‌هایشان دست‌نخورده و مستقل می‌مانند و برگشت‌پذیر است (فقط یک مقدار FK است که می‌توان NULL کرد).
* پیامد جانبی که باید پیش از فاز ۴ تأیید شود: با «سهمیه در سطح Person»، این دو حساب تستی سهمیهٔ مشترک خواهند داشت (مطابق قانون Production). اگر برای تست مزاحم است، گزینهٔ جایگزین: پرچم `is_test` روی ردیف person این دو حساب که فقط سهمیهٔ مشترک را برایشان معلق کند — تصمیمش با مالک در فاز ۴.
* بک‌فیل بقیهٔ کاربران (که کد ملی یکتا دارند) بدون ابهام است.

---

## Findings

### هویت و نقش‌ها (بحرانی‌ترین یافته)

* **سیستم نقش‌ها عملاً مرده است.** صفحهٔ انتخاب نقش (`app/profile/role/page.tsx`) درخواست را به `${API}/roles/request` می‌فرستد که با `NEXT_PUBLIC_API_URL=/api` به مسیر ناموجود می‌خورد (۴۰۴ بی‌صدا)؛ سپس نقش صرفاً با `updateUser` در **localStorage خود کاربر** «فعال» می‌شود. صفحهٔ ادمین نقش‌ها (`app/admin/roles/page.tsx`) به `/api/admin/roles` وصل است که **وجود ندارد** (همیشه «سرویس در دسترس نیست»). جدول `role_requests` در دیتابیس هست (ساختهٔ TypeORM مرده) ولی خالی و بی‌استفاده (۰ ردیف).
* **`PATCH /api/users/me` به هر کاربر اجازه می‌دهد `primaryRole` خودش را آزادانه عوض کند** (فقط با whitelist نام نقش‌ها). ترکیب این با سهمیهٔ نقش‌محور یعنی هر کاربر می‌تواند خودش را «فروشنده» کند و سهمیهٔ بیشتر بگیرد.
* **Person/Identity وجود ندارد.** سهمیه به `user.id` گره خورده. `national_id` هیچ قید یکتایی ندارد؛ در دیتابیس زنده **۲ حساب یک کد ملی مشترک دارند** (تست‌های عمدی مالک — طبق تصمیم قبلی «فعلاً اعمال نشود»).
* احراز هویت ثبت‌نام (OTP + شاهکار + ثبت‌احوال) سرورساید و نسبتاً محکم است؛ نشان‌های `verifiedAt`/`idHash` سمت سرور نگه داشته می‌شوند و کلاینت نمی‌تواند کد ملیِ تأییدشده جعل کند. دو گریزگاه: بدون `SMS_API_KEY` هر دو استعلام `match:true` برمی‌گردانند، و اگر PersonInfo در دسترس نباشد حساب با نامِ تطبیق‌نخورده verified می‌شود (فلگ `nameChecked:false` هیچ‌جا ذخیره نمی‌شود).
* جدول `users` در **هیچ مایگریشنی ساخته نمی‌شود** — تنها سند اسکیمایش entity مردهٔ NestJS است (`apps/api/src/modules/user/user.entity.ts`) که آن هم کامل نیست (مثلاً `club_id` را ندارد).

### آگهی و سهمیه

* آگهی = ردیف `products` با `sellerId = user.id`؛ POST/PATCH/DELETE در `/api/market/ads` با مالکیت درست.
* **هیچ انقضایی برای آگهی نیست.** ستون `expiresAt` در مایگریشن ۰۰۶ ساخته شده ولی هیچ کدی آن را نمی‌خواند/نمی‌نویسد؛ آگهیِ active برای همیشه می‌ماند.
* **حذف آگهی حذف فیزیکی است و سهمیه را در همان دوره برمی‌گرداند** (شمارش = count ردیف‌های موجود با `createdAt` در پنجره) — ناقض قانون فاز ۱. چرخهٔ «ثبت→حذف→ثبت» بی‌نهایت ممکن است.
* موتور سهمیه (`lib/ads/quota.ts`): پنجرهٔ لغزان day/week/month؛ **نقشِ صرفاً حاضر (نه تأییدشده) شمرده می‌شود**؛ سخاوتمندانه‌ترین نقش برنده (همین قانون درست است)؛ `limit<=0` = نامحدود؛ خطای دیتابیس ⇒ fail-open؛ چکِ سهمیه و INSERT غیراتمیک (race در درخواست‌های همزمان).
* **مقدار زندهٔ `ads_free_quota` هنوز شکل قدیمی `{quota:3,"week"}` است** ⇒ شاخهٔ legacy در `normalizeFreeQuota` آن را «۳ در هفته برای همهٔ نقش‌ها» بسط می‌دهد؛ اعداد per-role کد تا وقتی ادمین از پنل ذخیره نکند بی‌اثرند.
* زنجیرهٔ فروش بسته (۰۰۷: `ad_plans`/`ad_plan_orders`/`user_ad_plans` + `bh_activate_ad_plan`) سالم است: قیمت از سرور، snapshot ضد تغییر قیمت، callback ایدمپوتنت، فعال‌سازی اتمیک. آینهٔ استوری (۰۱۳) هم همین‌طور.
* `status` محصولات ناسازگار: enum قدیمی `active|sold|inactive`، POST همیشه `active`، PATCH فقط `active|paused`، چک `deleted` کد مرده.
* باگ ریز: لینک باکس سهمیه در `shop/new` با بک‌اسلش `href="\plans"` نوشته شده.

### تبلیغات (بنر) فعلی

* سه جایگاه (`market_1`، `market_2`، `footer`) + `ad_placements` (بنر ادمین‌ساخته) + `ad_requests` (فرم تماس). **هیچ فلوی پرداخت/رزروی برای جایگاه نیست** — قیمت فقط نمایشی؛ فلوی تجاری = تماس دستی.
* **کلید سراسری `ad_slots_enabled` همهٔ جایگاه‌ها را با هم خاموش/روشن می‌کند** — دقیقاً همان Master Toggle که معماری هدف ممنوع کرده.
* هیچ rotation با capacity>1، هیچ cron انقضا (بنر منقضی در پنل «ACTIVE» می‌ماند و فقط با فیلتر خواندن حذف می‌شود).
* شمارش impression/click: بدون auth، غیراتمیک (read-then-update)، بدون چک دیده‌شدن واقعی — **برای صورتحساب قابل اتکا نیست**.
* Legacy: `app/admin/ads` فقط redirect است؛ هیچ سیستم Campaign/Banner قدیمی دیگری نمانده. `budget` در فرم advertise حذف شده ولی API/ستون هنوز می‌پذیرند (همیشه NULL). متن پنل ادمین هنوز «چهار جایگاه» می‌گوید (سه‌تاست).

### صفحهٔ اصلی

* هر سه سکشن «ویژه» از **آرایه‌های هاردکد داخل `app/page.tsx`** رندر می‌شوند: `PRODUCTS` (۱۴)، `CLUBS` (۸)، `SELLERS` (۱۲) — هیچ fetchی در کار نیست و با دادهٔ صفحات اصلی خودشان ناسازگارند (کلیک روی «باشگاه ستاره تهران» id=1 به صفحهٔ «باشگاه سنچوری» می‌رود!).
* AdSlotهای واقعی: `market_1`/`market_2` انتهای سکشن بازار (`page.tsx:1748-1749`) و `footer` در `layout.tsx:84`.
* ۴ بنر دکوری هاردکد (`MktBanner`) زیر بازار و زیر فروشندگان + اسلایدر `BANNER_SLIDES` با محتوای تاریخ‌دار کهنه‌شونده («تابستان ۱۴۰۴»).
* منابع دادهٔ واقعیِ آماده برای placement-driven شدن: `GET /api/clubs` (جدول clubs)، `GET /api/market/ads` (products)، `fetchProfiles('seller')` (جدول profiles).

### پرداخت

* قرارداد Provider-agnostic (`lib/payments`) با mock + zarinpal؛ الگوی «سفارش+snapshot → درگاه → callback با verify سروری و مقایسهٔ مبلغ → فعال‌سازی اتمیک ایدمپوتنت» دو بار (آگهی/استوری) اثبات شده — **برای رزرو جایگاه قابل بازاستفاده است**.
* کمبودها: refund زرین‌پال stub است (فقط دستی)؛ `getPaymentStatus` پیاده نشده (reconciliation سفارش‌های PENDING رهاشده ممکن نیست)؛ **خرید بسته‌ها هیچ ردیفی در `ledger_entries` نمی‌سازد ⇒ درآمد تبلیغات از داشبورد مالی ادمین نامرئی است**؛ `platform_bank`/`story_platform_bank` فقط متادیتای نمایشی‌اند؛ ایندکس `provider_authority` در جدول‌های سفارش پلن یکتا نیست (payments یکتاست)؛ REFUNDED در CHECK سفارش‌ها نیست.
* باگ: retry پرداخت رزرو بعد از FAILED با برخورد `idempotency_key` یکتا ⇒ ۵۰۰ دائمی.
* **تله برای فاز بعد: `/api/ads/plans/callback` و `/api/stories/plans/callback` در `CSRF_EXEMPT` نیستند** (فقط `/api/payments/callback` هست) — با زرین‌پالِ GET-محور کار می‌کند ولی هر PSP با کالبک POST مرورگری ۴۰۳ می‌گیرد.
* درگاه فعال از روی ریپو قابل تعیین نیست (env پروداکشن در Vercel است)؛ در env محلی mock است.

### زیرساخت و بدهی فنی مرتبط

* پنل ادمین دو دنیاست: مالی/رزرو/تبلیغات server-backed با گارد ۳لایه (proxy + isAdmin + کلاینت)؛ ولی تأیید پروفایل‌ها (مربی/داور/فروشنده/بازیکن/…)، رنکینگ و مدیا فقط **localStorage خود ادمین**؛ news/events حتی localStorage هم نیستند (state حافظه‌ای). سه صفحهٔ ادمین با axios به NestJS مرده می‌زنند (همیشه خالی). `/api/admin/profiles` سرورساید ساخته شده ولی **هیچ صفحهٔ ادمینی صدایش نمی‌زند**.
* پس‌درِ هاردکد: `ADMIN_PHONE='09121327283'` در سه صفحهٔ ادمین (کلاینتی).
* عکس آگهی‌های بازار **به‌صورت base64 داخل ستون `products.images`** ذخیره می‌شود (تا ۵×۵MB بدون فشرده‌سازی و بدون سقف سروری) — خطر سقف بدنهٔ ~4.5MB در Vercel و پاسخ‌های سنگین.
* زیرساخت cron موجود است (`vercel.json` → `/api/cron/expire-bookings` روزانه) ولی **هیچ jobی برای انقضای بنر/بسته نیست**؛ endpoint کران بدون `CRON_SECRET` برای عموم باز است.
* دیتابیس: **هیچ FK به users یا clubs در کل مایگریشن‌ها نیست**؛ سه رژیم نام‌گذاری (camelCase قدیمی/snake_case جدید/دورگه)؛ RLS روشن با صفر policy (مدل service-role-only — عمدی)؛ جداول پایه خارج از version control.
* شمارنده‌ها/استوری/OTP روی باکت **عمومی** `club-media` به‌صورت JSON — رکورد OTP با نام فایل = شماره موبایل قابل خواندن عمومی است؛ POST/DELETE استوری باشگاه/فروشگاه **هیچ auth ندارد**.

---

## Existing Architecture

```
کاربر (users) ── primaryRole/secondaryRoles (خوداظهاری، بدون تأیید سرورساید)
   │                      ▲ PATCH /api/users/me (آزاد!)
   │ national_id (بدون یکتایی؛ Person وجود ندارد)
   │
   ├─ آگهی: products(sellerId) ←گیت← lib/ads/quota (پنجرهٔ لغزان، نقشِ حاضر، حذف=برگشت سهمیه)
   │        └─ بسته: ad_plans → ad_plan_orders → user_ad_plans (bh_activate_ad_plan، بدون ledger)
   ├─ استوری: آینهٔ کامل (story_*, bh_activate_story_plan) + شمارش از JSON در Storage
   └─ بنر:   ad_slots(3) → ad_placements (ادمین‌دستی، بدون پرداخت/rotation/انقضا)
              └─ Master Toggle: app_settings.ad_slots_enabled  ← باید حذف شود
پرداخت: lib/payments (mock|zarinpal) — الگوی callback+activation اثبات‌شده
صفحهٔ اصلی: سه سکشن ویژه = آرایه‌های هاردکد در page.tsx (بدون هیچ اتصال به داده)
```

## Proposed Architecture

### لایهٔ هویت

```
persons (شخص حقیقی)
  id uuid PK
  national_id_hash text UNIQUE   ← کلید یکتایی؛ HMAC مثل الگوی موجود otp-server
  created_at
    ▲ users.person_id FK  (بک‌فیل: هر national_id_verified موجود؛ دو حسابِ فعلیِ هم‌کدملی → یک person)
    ▲ role_grants (جایگزین سیستم مردهٔ نقش‌ها)
        person_id FK, role, status(pending|approved|rejected),
        doc_url, reviewed_by, reviewed_at, note
        UNIQUE(person_id, role)
```

* گرنت نقش **فقط سرورساید** پس از تأیید ادمین؛ `PATCH /api/users/me` برای primaryRole بسته می‌شود؛ `updateUser` کلاینتی دیگر منبع نقش نیست.
* ادمین: صفحهٔ واقعی بررسی درخواست نقش (به‌جای `/api/admin/roles` ناموجود) + اتصال `/api/admin/profiles` موجود.

### لایهٔ سهمیهٔ رایگان (قوانین بخش ۸)

```
quota_consumptions (دفترِ مصرف — نه شمارش ردیف‌های زنده)
  id, person_id FK, kind('ad'), ref_id(آگهی، nullable), consumed_at
```

* Free Quota = **max** سهمیه بین نقش‌های **approved** شخص (جمع نمی‌شوند) — تابع `bh_consume_quota(person_id)` اتمیک با FOR UPDATE (رفع race فعلی).
* دوره = پنجرهٔ لغزان ۳۰ روزه روی `consumed_at`؛ **حذف/انقضای آگهی ردیف مصرف را پاک نمی‌کند** ⇒ سهمیه در همان دوره برنمی‌گردد (قانون ۸ برقرار).
* اعداد: user/player/referee=۱، technician/coach=۲، club_owner/manufacturer/seller=۴ — در `app_settings.ads_free_quota` با شکل per-role (مهاجرت مقدار legacy فعلی الزامی).
* سهمیه و شمارش **به person** گره می‌خورد نه user ⇒ چند حساب با یک کد ملی سهمیهٔ جدا نمی‌گیرند.
* بستهٔ خریداری‌شده (user_ad_plans) روی سهمیهٔ رایگان سوار می‌شود (بدون تغییر ساختاری).

### لایهٔ تبلیغات

```
placements (تعمیم ad_slots — ۶ جایگاهِ مستقل، بدون Master Toggle)
  key PK: market_featured_products_homepage │ featured_clubs_homepage │
          featured_equipment_stores_homepage │ equipment_ads_right │
          equipment_ads_left │ homepage_bottom_banner
  is_active bool (مستقل)  mode('free'|'manual'|'paid')
  content_kind('banner'|'entity')  price, capacity, duration_days, sort_order

campaigns (تعمیم ad_placements)
  id, placement_key FK, user_id/person_id, advertiser,
  content jsonb: بنر {image_url, link_url} یا موجودیت {type:'product'|'club'|'seller', ref}
  status(DRAFT|PENDING_PAYMENT|ACTIVE|PAUSED|EXPIRED), starts_at, ends_at, weight

placement_orders (خرید جایگاه — الگوی اثبات‌شدهٔ ad_plan_orders)
  + bh_activate_campaign: اتمیک، ایدمپوتنت، چکِ ظرفیتِ جایگاه با FOR UPDATE
  + ثبت در ledger_entries (type جدید AD_REVENUE) → دیده‌شدن در داشبورد مالی

campaign_stats / rpc bh_track(campaign_id, kind): شمارش اتمیک (update ... = x+1)
cron روزانه: انقضای campaigns و user_*_plans (status→EXPIRED) با CRON_SECRET اجباری
```

* سه سکشن «ویژه» صفحهٔ اصلی از هاردکد به campaigns با `content_kind='entity'` مهاجرت می‌کنند (fallback به آرایه‌های فعلی تا پرشدن)؛ دو بنر کناری و بنر فوتر = مهاجرت دادهٔ سه جایگاه فعلی (`market_1→equipment_ads_right`، `market_2→equipment_ads_left`، `footer→homepage_bottom_banner`).
* اتصال دو سیستم: خرید جایگاه/بسته ⇒ `person_id` از نشست؛ ادمین در پنل، درخواست تبلیغ (ad_requests موجود) را به campaign تبدیل می‌کند.

---

## Risks

* **قفل شدن کاربران هنگام سخت‌گیری نقش‌ها**: امروز نقش‌ها localStorage‌اند؛ با انتقال به role_grants سرورساید، نقش‌های فعلی کاربران باید بک‌فیل یا مسیر باز-درخواست داده شود وگرنه پنل‌هایشان بسته می‌شود.
* **دو حسابِ هم‌کدملیِ موجود** (تستی مالک): طبق تصمیم D2 هیچ Merge/حذف خودکاری ممنوع؛ راهکار اتصالِ برگشت‌پذیر هر دو به یک ردیف person در همان بخش اعلام شده و فقط با تأیید مالک اجرا می‌شود.
* env پروداکشن (Vercel) از ریپو قابل دیدن نیست — حکم دربارهٔ درگاه فعال/SMS/CRON_SECRET قبل از فاز ۵ باید با خروجی env واقعی سنجیده شود.
* تغییر کلید جایگاه‌ها (market_1→equipment_ads_right و …) مهاجرت داده می‌خواهد و `SLOT_KEYS` هاردکد کلاینت باید هم‌زمان عوض شود (ناسازگاری نسخهٔ کش‌شدهٔ کلاینت در لحظهٔ دیپلوی).
* حذف Master Toggle یعنی `ad_slots_enabled` فعلی باید به `is_active` تک‌تک جایگاه‌ها ترجمه شود (الان false است ⇒ همهٔ جایگاه‌ها inactive شروع می‌کنند — رفتار فعلی حفظ می‌شود).
* شمارنده‌های فعلی برای صورتحساب قابل اتکا نیستند؛ اگر قیمت‌گذاری CPM/CPC خواسته شود، سخت‌گیری (dedupe، viewport، rate-limit) پیش‌نیاز است.
* جدول‌های پایه (users/products/clubs) خارج از مایگریشن‌اند — هر ALTER جدید باید با احتیاط و idempotent نوشته شود؛ اسکیمای پایه باید ابتدا dump و در ریپو مستند شود.
* حجم base64 در `products.images` می‌تواند در حین مهاجرت به Storage باعث درخواست‌های سنگین/timeout شود — مهاجرت باید تدریجی باشد.
* قانون «انتخاب نقش به‌تنهایی سهمیه نمی‌سازد» رفتار امروز را برای کاربران دارای نقشِ تأییدنشده سخت‌تر می‌کند — نیاز به پیام روشن در UI.

## Files Reviewed

(نمایندهٔ ~۱۲۰ فایل خوانده‌شده؛ کامل‌ها در گزارش ممیزها)

* `apps/web/app/api/auth/register/route.ts`، `app/register/page.tsx`، `lib/otp-server.ts`، `lib/shahkar-server.ts`، `app/api/shahkar/route.ts`، `app/api/users/me/route.ts`، `app/api/users/profile/route.ts`، `app/api/auth/change-phone/route.ts`، `app/profile/role/page.tsx`، `lib/roles.ts`، `app/admin/roles/page.tsx`، `store/auth.store.ts`
* `apps/web/app/api/market/ads/route.ts` + `[id]/route.ts`، `lib/ads/quota.ts`، `lib/ads/plans.ts`، `app/api/ads/plans/*`، `app/api/admin/ad-plans/route.ts`، `app/shop/new/page.tsx`، `app/plans/page.tsx`، `components/ads/MyAdPlan.tsx`
* `apps/web/lib/ads/slots.ts`، `components/ads/AdSlot.tsx`، `app/api/ads/slots/route.ts`، `app/api/ads/requests/route.ts`، `app/api/admin/ad-slots/route.ts`، `app/admin/ad-slots/page.tsx`، `app/advertise/page.tsx`
* `apps/web/lib/payments/{provider,index,mock,zarinpal}.ts`، `app/api/payments/create` + `callback/[provider]`، `app/api/bookings/[id]/cancel/route.ts`، `lib/finance/db.ts`
* `apps/web/app/page.tsx` (۲۰۱۴ خط)، `app/layout.tsx`، `proxy.ts`، `vercel.json`، `app/api/cron/expire-bookings/route.ts`
* `apps/web/app/admin/*` (هر ۲۴ مسیر)، `app/api/admin/settings/route.ts`، `app/api/admin/profiles/route.ts`
* `supabase/migrations/001..014` (همه)، `apps/api/src/modules/{user,product,role}/*.entity.ts` (اسناد اسکیمای پایه)
* `apps/web/lib/{social-server,stories/*,profiles/*,supabase,supabase-server,notify,sms-server,push-server,email-server,bank-server,license-server}.ts`

## Files That Will Change

(پیش‌بینی فازهای ۲ به بعد — در فاز ۱ هیچ‌کدام تغییر نکرده‌اند)

* **فاز ۲ (هستهٔ تبلیغات):** `lib/ads/slots.ts` (بازنویسی به placements/campaigns)، `components/ads/AdSlot.tsx`، `app/api/ads/slots/route.ts`، `app/api/admin/ad-slots/route.ts`، `app/admin/ad-slots/page.tsx`، `app/page.tsx` (سه سکشن ویژه + دو AdSlot)، `app/layout.tsx`، `app/advertise/page.tsx`، `app/api/admin/settings/route.ts` (حذف ad_slots_enabled از whitelist)
* **فاز ۳ (هویت/نقش):** `app/profile/role/page.tsx`، `app/admin/roles/page.tsx` + route جدید `app/api/roles/*` و `app/api/admin/roles/*`، `app/api/users/me/route.ts` (بستن تغییر آزاد نقش)، `app/api/auth/register/route.ts` (اتصال person)، `store/auth.store.ts`
* **فاز ۴ (سهمیه v2):** `lib/ads/quota.ts`، `app/api/market/ads/route.ts` (مصرف اتمیک + انقضا)، `lib/stories/quota.ts`، `app/api/ads/quota/route.ts`، `components/ads/MyAdPlan.tsx`، `app/admin/ad-plans/page.tsx` (اعداد جدید)
* **فاز ۵ (پرداخت جایگاه):** `lib/payments/*` (getPaymentStatus)، route جدید placement_orders + callback، `proxy.ts` (CSRF_EXEMPT)، `app/api/admin/finance/route.ts` (ledger تبلیغات)، `vercel.json` + cron جدید
* **فاز ۶ (آنالیتیکس/پاک‌سازی):** شمارش اتمیک، offload تصاویر products، حذف کد مرده (DiscoveryPanel/NEWS/mkt-dots)، تعیین تکلیف `apps/api`

## Database Changes Required

1. `persons` + `users.person_id` (FK، بک‌فیل از national_id موجود با هش HMAC)
2. `role_grants` (جایگزین role_requests مرده — یا بازسازی همان جدول با اسکیمای وب)
3. `quota_consumptions` + تابع اتمیک `bh_consume_quota`
4. `placements` (مهاجرت/rename از `ad_slots` با ۶ کلید جدید + ستون‌های mode/content_kind) — حذف کلید `ad_slots_enabled` از app_settings
5. `campaigns` (مهاجرت از `ad_placements`) + `placement_orders` + `bh_activate_campaign` (با enforcement ظرفیت در DB)
6. `ledger_entries`: type جدید `AD_REVENUE` (+ ثبت برای فروش بسته‌های موجود)
7. به‌روزرسانی مقدار `ads_free_quota` به شکل per-role با اعداد بخش ۸ (۳۰روزه)
8. ایندکس‌های یکتا روی `provider_authority` سفارش‌ها؛ `status='EXPIRED'` خودکار با cron
9. مستندسازی اسکیمای جداول پایه (dump ساختار users/products/clubs/bookings در ریپو)
10. (اختیاری، توصیه‌شده) FKهای گمشده به users/clubs — حداقل برای جدول‌های جدید

## Next Phase (ثبت‌شده در پایان فاز ۱ — انجام شد)

PHASE 2 — CORE ADVERTISING SYSTEM

پیشنهاد ترتیب: ۲) هستهٔ Placement/Campaign مستقل و مهاجرت سه جایگاه فعلی ← ۳) Person/Identity و نقش‌های تأییدشده ← ۴) سهمیهٔ v2 (چون به نقش تأییدشده وابسته است) ← ۵) پرداخت/رزرو جایگاه + ledger + cron ← ۶) آنالیتیکس و پاک‌سازی.

هر دو سؤالِ باز ممیزی با تصمیمات D1 و D2 (بخش Decisions) بسته شدند: بنرهای کناری به سکشن «فروشگاه‌های تجهیزات» می‌روند (راست/اصلی/چپ در Desktop، Responsive بدون Overflow در Mobile)، و دو حساب تستیِ هم‌کدملی بدون هیچ Merge/حذفی به‌عنوان دادهٔ تستی می‌مانند.
