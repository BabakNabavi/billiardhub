# معماری واقعی (کشف‌شده از کد، نه فرض)

## لایه‌ها

```
مرورگر (React 19، صفحه‌های 'use client' پنل)
  │  apiFetch (lib/http.ts) — کوکی نشست + هدر CSRF؛ روی خطا throw نمی‌کند، Response برمی‌گرداند
  │  api (lib/api.ts، axios) — فقط صفحه‌ی محصولات؛ روی غیر ۲xx throw می‌کند
  ▼
proxy.ts (Next 16، روی Node)
  ├─ CSRF: Origin بیگانه رد؛ توکن هدر = کوکی (جز ورود، OTP و کالبک درگاه‌ها)
  ├─ وضعیت حساب از دیتابیس (accountStateOf، کش ۱۰ ثانیه): مسدود/تعلیق/حذف ⟵ ۴۰۳ برای همه‌ی APIها
  └─ صفحه‌های /admin: نشست لازم + نقش داخل توکن = admin (فقط لایه‌ی اول؛ مجوز نهایی در API)
  ▼
app/api/**/route.ts (۱۷۰ مسیر)
  ├─ هویت: actorFromRequest (نقش از توکن) یا actorOf (نقش از دیتابیس + canSignIn)
  ├─ مجوز ادمین: can(userId, key) / canAny / isSuperAdmin ⟵ lib/admin/permissions
  │     permissionsOf: مالک پلتفرم ⟵ ['*'] · نقش admin در users ⟵ admin_permissions.permissions
  │     ادمین بی‌ردیف ⟵ [] (هیچ؛ پیش‌فرض امن)
  ├─ فقط مالک: requireOwner ⟵ users.is_platform_owner (/api/owner/*)
  └─ نوشتن مالی: rpc() ⟵ توابع اتمیک Postgres (هر تابع یک تراکنش)
  ▼
Supabase self-hosted روی همان VPS (کانتینر supabase-db) از راه PostgREST با service role
```

## منبع حقیقت هر موجودیت

| موجودیت | منبع | توضیح |
|---|---|---|
| کاربر، نقش | `users.primaryRole`، `users.secondaryRoles` | نقش ادمین همیشه از دیتابیس خوانده می‌شود، نه از توکن (actorOf، isAdmin، permissionsOf) |
| دسترسی بخش‌ها | `admin_permissions.permissions` (آرایه‌ی کلید) | `'*'` یعنی سوپرادمین؛ کلید `access` فقط سوپر |
| مالک پلتفرم | `users.is_platform_owner` | بالای همه‌ی ادمین‌ها؛ از او چیزی گرفتنی نیست |
| وضعیت حساب | جدول enforcement (مهاجرت ۱۱۳) ⟵ `lib/enforcement` | در proxy و actorOf اعمال می‌شود |
| آگهی بازار | `products` | نمایش عمومی فقط `active/sold/expired` (`lib/market/live`) |
| باشگاه | `clubs` (`isActive`، `ownerId`، `slug`) | |
| پروفایل‌های حرفه‌ای | `profiles` (`kind`: coach، referee، seller، manufacturer، technician، player) | |
| تنظیمات پلتفرم | `app_settings` (کلید/مقدار) | فهرست سفید در `app/api/admin/settings` |
| محتوا | `news`، `events`، `rankings`، `media_items` | `lib/admin/content` |
| مالی | جدول‌های رزرو، بازپرداخت، تسویه + توابع `bh_*` | `lib/finance`؛ کرون سرور برای تسویه |
| ممیزی | `audit_logs` | `audit()` در `lib/finance/db`؛ خطا را می‌بلعد |

## کش و همگام‌سازی

- وضعیت حساب: ۱۰ ثانیه در proxy و ۵ ثانیه در `permissionsOf`. مسدودسازی حداکثر با این تأخیر روی نشست‌های موجود اثر می‌کند.
- `getSetting` (`lib/ads/quota`) کش ندارد و اثر تغییر تنظیمات بی‌درنگ است. کش پرچم قابلیت‌ها موقع ذخیره پاک می‌شود (`invalidateFeatureCache`).
- خبر: `revalidateTag('news')` بعد از هر تغییر.

## آزمون‌ها

- `scripts/test-*.mjs`. دو نوع دارد:
  - **ایستا:** کد را می‌خواند (enforcement، guards، lock، tournaments، streaming، …).
  - **ادغامی:** با `SUPABASE_SERVICE_ROLE_KEY` به دیتابیس پیکربندی‌شده و `localhost:3000` وصل می‌شود و داده می‌سازد و حذف می‌کند (profiles-flow، content-flow، ads-admin، business-admin، financial-invariants، commission-admin، …).
- چون دیتابیس پیکربندی‌شده همان دیتابیس زنده است، نوع دوم در این ممیزی اجرا نشد.
- اسکریپت `npm test` سراسری وجود ندارد.
