# فهرست کامل عملیات پنل ادمین

ترتیب همان ترتیب کارت‌های داشبورد پنل است (`app/admin/page.tsx`)، از اولین بخش تا آخرین. هر ردیف یک فراخوانی واقعی API در کد صفحه یا کامپوننت‌هایش است، با شناسه‌ی یکتا.

روش استخراج: اسکریپتی که هر صفحه‌ی `app/admin/**/page.tsx` و هر کامپوننتی را که import می‌کند (تا عمق ۳، به‌اضافه‌ی `lib/admin/content-client` و `lib/admin/profile-rows`) می‌خواند و هر `apiFetch` / `fetch` / `api.*` را با متد و تابع دربرگیرنده ثبت می‌کند. فراخوانی‌های `api.put/delete` صفحه‌ی محصولات (axios) جداگانه در انتهای جدول آمده‌اند.

- صفحه‌ها: **37** (دو صفحه فقط ریدایرکت‌اند)
- عملیات (فراخوانی API): **121** — تغییردهنده **61**، خواندنی **60** (با چهار فراخوانی axios انتهای جدول)

| شناسه | بخش | صفحه | عملیات (تابع — متد نشانی) |
|---|---|---|---|
| ADMIN-001 | داشبورد پنل | `/admin` | AdminPage — GET /api/admin/permissions |
| ADMIN-002 | داشبورد پنل | `/admin` | AdminPage — GET /api/account/status |
| ADMIN-003 | داشبورد پنل | `/admin` | ? — GET /api/admin/stats |
| ADMIN-004 | اعمال وضعیت حساب | `/admin/enforcement` | run — GET /api/owner/enforcement |
| ADMIN-005 | اعمال وضعیت حساب | `/admin/enforcement` | load — GET /api/owner/enforcement/${userId} |
| ADMIN-006 | اعمال وضعیت حساب | `/admin/enforcement` | submit — POST /api/owner/enforcement |
| ADMIN-007 | مدیریت کاربران | `/admin/users` | AdminUsersPage — GET /api/admin/users |
| ADMIN-008 | مدیریت کاربران | `/admin/users` | handleVerify — PATCH /api/admin/users |
| ADMIN-009 | مدیریت کاربران | `/admin/users` | UserDetailDialog — GET /api/admin/users |
| ADMIN-010 | مدیریت کاربران | `/admin/users` | save — PATCH /api/admin/users |
| ADMIN-011 | مدیریت نقش‌ها | `/admin/roles` | load — GET /api/admin/roles |
| ADMIN-012 | مدیریت نقش‌ها | `/admin/roles` | handleAction — PATCH /api/admin/roles |
| ADMIN-013 | مدیریت نقش‌ها | `/admin/roles` | openDoc — GET /api/clubs/${id}/license-doc |
| ADMIN-014 | مدیریت نقش‌ها | `/admin/roles` | checkLicense — POST /api/admin/license-check |
| ADMIN-015 | مدیریت نقش‌ها | `/admin/roles` | checkLicense — GET /api/admin/review |
| ADMIN-016 | احراز هویت | `/admin/verifications` | AdminVerificationsPage — GET /api/admin/users |
| ADMIN-017 | احراز هویت | `/admin/verifications` | handleVerify — PATCH /api/admin/users |
| ADMIN-018 | تیک آبی | `/admin/verified` | loadRows — GET /api/admin/profiles |
| ADMIN-019 | تیک آبی | `/admin/verified` | loadRows — GET /api/clubs |
| ADMIN-020 | تیک آبی | `/admin/verified` | setVerified — PUT /api/clubs/${row.id} |
| ADMIN-021 | تیک آبی | `/admin/verified` | setVerified — PATCH /api/admin/profiles |
| ADMIN-022 | تیکت‌های پشتیبانی | `/admin/support` | load — GET /api/admin/support |
| ADMIN-023 | تیکت‌های پشتیبانی | `/admin/support` | act — PATCH /api/admin/support |
| ADMIN-024 | دسترسی ادمین | `/admin/access` | load — GET /api/admin/grant-admin${query  |
| ADMIN-025 | دسترسی ادمین | `/admin/access` | load — GET /api/admin/permissions |
| ADMIN-026 | دسترسی ادمین | `/admin/access` | toggle — POST /api/admin/grant-admin |
| ADMIN-027 | دسترسی ادمین | `/admin/access` | save — PATCH /api/admin/permissions |
| ADMIN-028 | ژورنال خطا | `/admin/errors` | resolve — PATCH /api/admin/errors |
| ADMIN-029 | ژورنال رویدادها | `/admin/logs` | AdminLogsPage — GET /api/admin/logs |
| ADMIN-030 | ژورنال رویدادها | `/admin/logs` | load — GET /api/admin/logs |
| ADMIN-031 | ژورنال رویدادها | `/admin/logs` | toggle — GET /api/admin/logs |
| ADMIN-032 | تأیید مربیان | `/admin/coaches` | loadProfileRows — GET /api/admin/profiles |
| ADMIN-033 | تأیید مربیان | `/admin/coaches` | patchProfile — PATCH /api/admin/profiles |
| ADMIN-034 | تأیید مربیان | `/admin/coaches` | toggleProfile — GET /api/admin/profiles |
| ADMIN-035 | تأیید داوران | `/admin/referees` | loadProfileRows — GET /api/admin/profiles |
| ADMIN-036 | تأیید داوران | `/admin/referees` | patchProfile — PATCH /api/admin/profiles |
| ADMIN-037 | تأیید داوران | `/admin/referees` | toggleProfile — GET /api/admin/profiles |
| ADMIN-038 | رنکینگ بازیکنان | `/admin/rankings` | AdminRankingsPage — GET /api/admin/settings |
| ADMIN-039 | رنکینگ بازیکنان | `/admin/rankings` | handleSave — PATCH /api/admin/settings |
| ADMIN-040 | بازیکنان شاخص | `/admin/players` | openDoc — GET /api/clubs/${id}/license-doc |
| ADMIN-041 | بازیکنان شاخص | `/admin/players` | checkLicense — POST /api/admin/license-check |
| ADMIN-042 | بازیکنان شاخص | `/admin/players` | checkLicense — GET /api/admin/review |
| ADMIN-043 | مدیریت رزروها | `/admin/bookings` | cancel — POST /api/bookings/${b.id}/cancel |
| ADMIN-044 | داشبورد مالی و تسویه | `/admin/finance` | load — GET /api/admin/finance${qs()} |
| ADMIN-045 | داشبورد مالی و تسویه | `/admin/finance` | act — POST /api/admin/settlements |
| ADMIN-046 | داشبورد مالی و تسویه | `/admin/finance` | load — GET /api/admin/commission |
| ADMIN-047 | داشبورد مالی و تسویه | `/admin/finance` | save — PUT /api/admin/commission |
| ADMIN-048 | داشبورد مالی و تسویه | `/admin/finance` | remove — DELETE /api/admin/commission |
| ADMIN-049 | داشبورد مالی و تسویه | `/admin/finance` | load — GET /api/admin/finance/payouts |
| ADMIN-050 | داشبورد مالی و تسویه | `/admin/finance` | post — POST /api/admin/settlements |
| ADMIN-051 | داشبورد مالی و تسویه | `/admin/finance` | ? — POST /api/admin/refunds |
| ADMIN-052 | داشبورد مالی و تسویه | `/admin/finance` | TransactionsReport — GET /api/admin/finance/transactions |
| ADMIN-053 | داشبورد مالی و تسویه | `/admin/finance` | TransactionTimeline — GET /api/admin/finance/timeline |
| ADMIN-054 | تأیید باشگاه‌ها | `/admin/clubs` | fetchClubs — PUT /api/clubs |
| ADMIN-055 | تأیید باشگاه‌ها | `/admin/clubs` | updateStatus — PUT /api/clubs/${id} |
| ADMIN-056 | تأیید باشگاه‌ها | `/admin/clubs` | openLicenseDoc — GET /api/clubs/${id}/license-doc |
| ADMIN-057 | تأیید باشگاه‌ها | `/admin/clubs` | openDoc — GET /api/clubs/${id}/license-doc |
| ADMIN-058 | تأیید باشگاه‌ها | `/admin/clubs` | checkLicense — POST /api/admin/license-check |
| ADMIN-059 | تأیید باشگاه‌ها | `/admin/clubs` | checkLicense — GET /api/admin/review |
| ADMIN-060 | تأیید فروشگاه‌ها | `/admin/sellers` | loadProfileRows — GET /api/admin/profiles |
| ADMIN-061 | تأیید فروشگاه‌ها | `/admin/sellers` | patchProfile — PATCH /api/admin/profiles |
| ADMIN-062 | تأیید فروشگاه‌ها | `/admin/sellers` | toggleProfile — GET /api/admin/profiles |
| ADMIN-063 | آگهی‌های بیلیارد بازار | `/admin/products` | handleVerify — GET /api/admin/settings |
| ADMIN-064 | آگهی‌های بیلیارد بازار | `/admin/products` | toggleApproval — PATCH /api/admin/settings |
| ADMIN-065 | برندهای بازار | `/admin/brands` | load — GET /api/market/brands |
| ADMIN-066 | برندهای بازار | `/admin/brands` | add — POST /api/market/brands |
| ADMIN-067 | برندهای بازار | `/admin/brands` | patch — PATCH /api/market/brands |
| ADMIN-068 | تولیدکنندگان | `/admin/manufacturers` | openDoc — GET /api/clubs/${id}/license-doc |
| ADMIN-069 | تولیدکنندگان | `/admin/manufacturers` | checkLicense — POST /api/admin/license-check |
| ADMIN-070 | تولیدکنندگان | `/admin/manufacturers` | checkLicense — GET /api/admin/review |
| ADMIN-071 | متخصصان فنی | `/admin/technicians` | openDoc — GET /api/clubs/${id}/license-doc |
| ADMIN-072 | متخصصان فنی | `/admin/technicians` | checkLicense — POST /api/admin/license-check |
| ADMIN-073 | متخصصان فنی | `/admin/technicians` | checkLicense — GET /api/admin/review |
| ADMIN-074 | محتوای نمایشی | `/admin/demo-content` | load — GET /api/admin/demo-profiles |
| ADMIN-075 | محتوای نمایشی | `/admin/demo-content` | create — POST /api/admin/demo-profiles |
| ADMIN-076 | محتوای نمایشی | `/admin/demo-content` | ? — POST /api/admin/demo-profiles |
| ADMIN-077 | اخبار | `/admin/news` | ? — GET /api/admin/content/${kind} |
| ADMIN-078 | اخبار | `/admin/news` | ? — POST /api/admin/content/${kind} |
| ADMIN-079 | اخبار | `/admin/news` | ? — PATCH /api/admin/content/${kind} |
| ADMIN-080 | اخبار | `/admin/news` | deleteContent — DELETE /api/admin/content/${kind} |
| ADMIN-081 | مسابقات باشگاه‌ها | `/admin/tournaments` | load — GET /api/admin/tournaments${filter  |
| ADMIN-082 | مسابقات باشگاه‌ها | `/admin/tournaments` | setStatus — PATCH /api/admin/tournaments |
| ADMIN-083 | مسابقات باشگاه‌ها | `/admin/tournaments` | setFeatured — PUT /api/admin/tournaments/featured |
| ADMIN-084 | مسابقات باشگاه‌ها | `/admin/tournaments` | create — POST /api/admin/tournaments |
| ADMIN-085 | مسابقات باشگاه‌ها | `/admin/tournaments` | remove — DELETE /api/admin/tournaments |
| ADMIN-086 | رویدادهای رسمی | `/admin/events` | ? — GET /api/admin/content/${kind} |
| ADMIN-087 | رویدادهای رسمی | `/admin/events` | ? — POST /api/admin/content/${kind} |
| ADMIN-088 | رویدادهای رسمی | `/admin/events` | ? — PATCH /api/admin/content/${kind} |
| ADMIN-089 | رویدادهای رسمی | `/admin/events` | deleteContent — DELETE /api/admin/content/${kind} |
| ADMIN-090 | سیستم تبلیغات | `/admin/advertising` | load — GET /api/admin/advertising |
| ADMIN-091 | سیستم تبلیغات | `/admin/advertising` | call — GET /api/admin/advertising${query} |
| ADMIN-092 | بسته‌های آگهی | `/admin/ad-plans` | load — GET /api/admin/ad-plans |
| ADMIN-093 | بسته‌های آگهی | `/admin/ad-plans` | load — GET /api/admin/settings |
| ADMIN-094 | بسته‌های آگهی | `/admin/ad-plans` | create — POST /api/admin/ad-plans |
| ADMIN-095 | بسته‌های آگهی | `/admin/ad-plans` | patch — PATCH /api/admin/ad-plans |
| ADMIN-096 | بسته‌های آگهی | `/admin/ad-plans` | saveSettings — PATCH /api/admin/settings |
| ADMIN-097 | بسته‌های استوری | `/admin/story-plans` | load — GET /api/admin/story-plans |
| ADMIN-098 | بسته‌های استوری | `/admin/story-plans` | load — GET /api/admin/settings |
| ADMIN-099 | بسته‌های استوری | `/admin/story-plans` | create — POST /api/admin/story-plans |
| ADMIN-100 | بسته‌های استوری | `/admin/story-plans` | patch — PATCH /api/admin/story-plans |
| ADMIN-101 | بسته‌های استوری | `/admin/story-plans` | saveSettings — PATCH /api/admin/settings |
| ADMIN-102 | بیلیارد مدیا | `/admin/media` | load — GET /api/admin/videos |
| ADMIN-103 | بیلیارد مدیا | `/admin/media` | patch — PATCH /api/admin/videos |
| ADMIN-104 | بیلیارد مدیا | `/admin/media` | remove — DELETE /api/admin/videos |
| ADMIN-105 | پخش زنده | `/admin/live` | load — GET /api/admin/streams |
| ADMIN-106 | پخش زنده | `/admin/live` | run — POST /api/admin/streams |
| ADMIN-107 | گزارش‌های تخلف | `/admin/reports` | AdminReports — GET /api/admin/settings |
| ADMIN-108 | گزارش‌های تخلف | `/admin/reports` | savePhone — PATCH /api/admin/settings |
| ADMIN-109 | گزارش‌های تخلف | `/admin/reports` | load — GET /api/admin/reports |
| ADMIN-110 | گزارش‌های تخلف | `/admin/reports` | update — PATCH /api/admin/reports |
| ADMIN-111 | قابلیت‌های پلتفرم | `/admin/features` | AdminFeaturesPage — GET /api/admin/settings |
| ADMIN-112 | قابلیت‌های پلتفرم | `/admin/features` | toggle — PATCH /api/admin/settings |
| ADMIN-113 | پیامک‌های سایت | `/admin/sms` | load — GET /api/admin/sms/test |
| ADMIN-114 | پیامک‌های سایت | `/admin/sms` | save — PATCH /api/admin/settings |
| ADMIN-115 | پیامک‌های سایت | `/admin/sms` | test — POST /api/admin/sms/test |
| ADMIN-116 | نرخ کمیسیون | `/admin/commission` | load — GET /api/admin/commission |
| ADMIN-117 | نرخ کمیسیون | `/admin/commission` | save — PUT /api/admin/commission |
| ADMIN-118 | آگهی‌های بیلیارد بازار | `/admin/products` | handleVerify — PUT /api/products/[id] (axios) |
| ADMIN-119 | آگهی‌های بیلیارد بازار | `/admin/products` | setStatus — PUT /api/products/[id] (axios) |
| ADMIN-120 | آگهی‌های بیلیارد بازار | `/admin/products` | handleDelete — DELETE /api/products/[id] (axios) |
| ADMIN-121 | آگهی‌های بیلیارد بازار | `/admin/products` | load — GET /api/products?all=1 (axios) |

**جمع کل: 121 عملیات.**
