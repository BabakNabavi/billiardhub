# Billiard Plus — فایل هندآف کامل
> تاریخ آخرین بروزرسانی: ۱۴۰۵/۰۴/۰۷ (2026-06-28)

---

## اطلاعات پروژه

| کلید | مقدار |
|------|-------|
| **Repo** | https://github.com/BabakNabavi/billiard-plus |
| **Live** | https://billiardhub.vercel.app |
| **مسیر محلی** | `I:\Billiard Plus\billiard-plus` |
| **نوع** | Turborepo monorepo |
| **Frontend** | `apps/web` — Next.js 16.2 روی Vercel |
| **Backend** | `apps/api` — NestJS (محلی، هنوز deploy نشده) |
| **DB** | PostgreSQL روی Supabase |

### اجرای محلی
```bash
# Frontend
cd apps/web && npm run dev   # http://localhost:3000

# Backend
cd apps/api && npm run start:dev

# TypeScript check
npx tsc --noEmit -p apps/web/tsconfig.json
```

---

## احراز هویت

| | |
|---|---|
| **روش** | شماره موبایل + پسورد (bcrypt، JWT 7 روز) |
| **ادمین** | موبایل: `09121327283` / پسورد: `Admin1234` |
| **UUID ادمین** | `eba4e069-81c5-42ac-90c0-dbe188d56b98` |
| **localStorage key** | `auth-storage` (Zustand persist) |

```typescript
// خواندن توکن
function authHeader(): Record<string, string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null
    if (!raw) return {}
    const token = JSON.parse(raw)?.state?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch { return {} }
}
```

---

## Supabase

| | |
|---|---|
| **Project ID** | در `.env.local` / تنظیماتِ Vercel |
| **URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **JWT Secret** | `JWT_SECRET` — ⚠️ هرگز در این فایل نوشته نشود |
| **DATABASE_URL** | `DATABASE_URL` — ⚠️ هرگز در این فایل نوشته نشود |
| **API** | Next.js API routes وصل به Supabase (`NEXT_PUBLIC_API_URL=/api`) |

> **قاعده:** این سند در مخزنِ **عمومیِ** گیت‌هاب است. هیچ رمز، کلید،
> توکن یا رشته‌ی اتصالی نباید این‌جا نوشته شود — فقط **نامِ** متغیرِ
> محیطی. مقادیرِ واقعی جای‌شان `.env.local` (محلی) و Environment
> Variables در Vercel (پروداکشن) است.
| **جداول** | `users`, `clubs`, `products`, `bookings`, `role_requests` |
| **داده** | 4 باشگاه، 8 محصول نمونه |

---

## طراحی و استایل

- **تم:** Dark — لهجه سبز نئون
- **رنگ‌ها:** bg=`#0a0f0d` / surface=`#111a15` / neon=`#10b981` / text=`#e2e8f0` / muted=`#64748b`
- **فونت:** Vazirmatn (Google Fonts)
- **آیکون:** Lucide React + Tabler Icons CDN
- **استایل:** **فقط inline style — بدون Tailwind**
- **جهت:** RTL کامل (`direction: 'rtl'`)
- **orb:** radial-gradient سبز fixed در گوشه بالا-راست هر صفحه

```tsx
// الگوی صفحه جدید
'use client'
export default function Page() {
  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={{ minHeight:'100vh', background:'#0a0f0d', fontFamily:'Vazirmatn,Tahoma,sans-serif', direction:'rtl' }}>
        <div style={{ position:'fixed', width:360, height:360, background:'radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%)', top:-100, right:-80, filter:'blur(55px)', zIndex:0, pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:480, margin:'0 auto', padding:'36px 16px 100px' }}>
          {/* محتوا */}
        </div>
      </div>
    </>
  )
}
```

---

## نکات فنی مهم

- **Next.js 16:** params در route handlers باید `await` شوند: `const { id } = await context.params`
- همه `route.ts`‌ها باید `export const dynamic = 'force-dynamic'` داشته باشند
- **اعداد فارسی:** `String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)`
- `Instagram`, `Edit3`, `Zap` در lucide-react موجود نیستند — از Tabler یا SVG inline استفاده شود
- `noUncheckedIndexedAccess: true` در tsconfig — دسترسی به آرایه با index نیاز به `!` یا fallback دارد
- **Deploy:** push به GitHub → Vercel auto-deploy

---

## سیستم نقش‌ها (8 نقش)

| value | label | رنگ |
|-------|-------|-----|
| `user` | کاربر عادی | #94a3b8 |
| `player` | بازیکن رنکینگی | #10b981 |
| `coach` | مربی | #a78bfa |
| `referee` | داور | #f59e0b |
| `technician` | خدمات فنی | #06b6d4 |
| `seller` | فروشنده | #f97316 |
| `manufacturer` | تولیدکننده | #ef4444 |
| `club_owner` | باشگاه‌دار | #3b82f6 |

**جریان نقش:** `/profile/role` → آپلود مدرک → pending در `role_requests` → ادمین در `/admin/roles` تایید → approved → `/profile/setup`

---

## وضعیت صفحات

### ✅ کامل

| صفحه | توضیح |
|------|-------|
| `/` | صفحه اصلی |
| `/login` | ورود |
| `/register` | ثبت‌نام |
| `/clubs` | لیست باشگاه‌ها |
| `/clubs/[id]` | جزئیات باشگاه (hero بدون فلش، دکمه‌ها بالاتر) |
| `/booking/[clubId]` | رزرو میز |
| `/shop` | فروشگاه (liquid dark) |
| `/shop/[id]` | جزئیات محصول |
| `/shop/new` | ثبت محصول جدید |
| `/shop/edit/[id]` | ویرایش محصول |
| `/cart` | سبد خرید |
| `/checkout` | پرداخت |
| `/players` | رنکینگ بازیکنان |
| `/players/[id]` | پروفایل بازیکن |
| `/profile/me` | پروفایل کاربر |
| `/profile/role` | انتخاب نقش (multi-select) |
| `/profile/verify` | احراز هویت کد ملی + OTP |
| `/profile/setup` | فرم تخصصی نقش |
| `/profile/[userId]` | پروفایل عمومی |
| `/admin` | پانل ادمین اصلی |
| `/admin/roles` | تایید نقش‌ها |
| `/admin/users` | مدیریت کاربران |
| `/admin/products` | مدیریت محصولات |
| `/admin/news` | مدیریت اخبار |
| `/admin/events` | مدیریت رویدادها |
| `/admin/verifications` | تایید مدارک |
| `/admin/ads` | آگهی‌ها |
| `/admin/rankings` | رنکینگ ادمین |
| `/coaches` + `/coaches/[id]` | مربیان |
| `/referees` + `/referees/[id]` | داوران |
| `/referees/dashboard` | داشبورد داور |
| `/sellers` + `/sellers/[id]` | فروشندگان |
| `/manufacturers` + `/manufacturers/[id]` | تولیدکنندگان |
| `/installers` + `/installers/[id]` | نصب‌کاران |
| `/services` + `/services/[id]` | خدمات |
| `/news` + `/news/[id]` | اخبار |
| `/events` + `/events/[id]` | رویدادها |
| `/live` + `/live/[id]` | نتایج زنده عمومی |
| `/ranking` | رنکینگ |
| `/results` | نتایج |
| `/education` | آموزش |
| `/about` | درباره ما |
| `/contact` | تماس |
| `/messages` | پیام‌ها |
| `/tournaments` | لیست مسابقات |
| `/tournaments/[id]` | جزئیات مسابقه |
| `/tournaments/new` | ایجاد مسابقه |
| `/tournaments/[id]/register` | ثبت‌نام (بدون تکراری) |
| `/tournaments/[id]/bracket` | جدول مسابقات |
| `/tournaments/[id]/live` | جدول زنده (کامل‌ترین صفحه) |
| `/tournaments/[id]/admin` | پنل ادمین مسابقه |
| `/tournaments/[id]/results` | نتایج مسابقه |
| `/dashboard/club` | داشبورد باشگاه |
| `/dashboard/shop` | داشبورد فروشگاه |
| `/users/[id]` | پروفایل کاربر (عمومی) |
| `/seller/[id]` | صفحه فروشنده |
| `/shop/brands` + `/shop/brands/[id]` | برندها |
| `/clubs/new` | ایجاد باشگاه |

### ⚠️ کار شده — هنوز mock data

| صفحه | مشکل |
|------|------|
| `/dashboard` | داده‌های رزرو، آمار و اعلان‌ها هنوز mock هستند. فقط بخش ثبت‌نام مسابقات از localStorage می‌خواند (فیلتر بر اساس phone کاربر) |

---

## کارهای انجام‌شده در session‌های اخیر

### `/clubs/[id]`
- حذف دکمه‌های فلش چپ/راست از hero slider
- بالا بردن ۱۰٪ دکمه‌های "باشگاه‌ها"، "بسته/باز"، "BILLIARD CLUB"

### `/dashboard`
- فیلتر ثبت‌نام‌ها فقط بر اساس `phone` کاربر جاری
- حذف خودکار ثبت‌نام‌های تکراری با `Map<phone, entry>` در localStorage

### `/tournaments/[id]/register`
- جلوگیری از ثبت‌نام تکراری با یک شماره — ۳ لایه چک: mount، pay click، save
- نمایش صفحه "قبلاً ثبت‌نام کرده‌اید"

### `/tournaments/[id]/admin`
- deduplicate ثبت‌نام‌های تکراری در localStorage با `Map<phone, Registration>`

### `/tournaments/[id]/bracket`
- فرمت شماره بازیکن: از `#1` به `1- نام بازیکن`

### `/tournaments/[id]/live` (بیشترین تغییرات)
- **Best of X:** `winsNeeded = Math.ceil(bestOf/2)` — Bo3=۲ فریم، Bo5=۳، Bo7=۴
- **دایره چشمک‌زن** کنار "زنده" — انیمیشن `livePulse`
- **HighestBreakPanel:** موقعیت `marginTop: '70%'`، سایز ۵۰٪ بزرگتر، ستاره هر دو طرف، وسط‌چین
- **شروع مسابقه توسط ادمین:** فقط ادمین می‌تواند کلیک کند؛ تغییر status از `waiting` به `in_progress` خودکار نیست
- **شماره میز:** هر بازی شماره میز جداگانه دارد — ادمین از modal ثبت می‌کند
- **میرور نیمه راست:** prop `mirror` روی LiveCard — اسم/آیکون نیمه راست معکوس می‌شود
- **بنر قهرمان:** بالای کارت فینال، رنگ طلایی `#C7A66A`، انیمیشن `champGlow`
- **ذخیره دائمی:** lazy initializer — `localStorage.getItem('bracket-${id}')` قبل از اولین render
- **FrameScoringModal:**
  - حذف "Best of X" از subtitle
  - چراغ‌ها به تعداد `winsNeeded` (نه `bestOf`)
  - اسم و فامیل کامل در دکمه‌های فریم

---

## اولویت‌های باقی‌مانده

### 🔴 فوری
1. **داشبورد واقعی** — وصل کردن بخش‌های رزرو، آمار، اعلان‌ها به Supabase (API آماده است)
2. **لینک `/profile/verify`** بعد از انتخاب نقش `user` — این پیوند UI هنوز نیست

### 🟡 مهم
3. **صفحات تخصصی هر نقش** (پنل مربی، داور، فروشنده، باشگاه‌دار — محتوای واقعی)
4. **Deploy بک‌اند NestJS** روی Railway
5. **مسابقات واقعی** — فعلاً `SAMPLE_TOURNAMENTS` و `SAMPLE_LIVE_BRACKET` در `lib/mock-tournaments.ts` است

### 🟢 بعدی
6. پیامک Kavenegar (بعد از خرید API key)
7. استعلام کد ملی api.ir
8. سیستم چت بین خریدار/فروشنده
9. اعلان‌های real-time
10. امتیازدهی به باشگاه

---

## فایل‌های مهم

| فایل | نقش |
|------|-----|
| `apps/web/lib/mock-tournaments.ts` | single source of truth برای mock data مسابقات |
| `apps/web/store/auth.store.ts` | Zustand auth state |
| `apps/web/store/cart.store.ts` | Zustand cart state |
| `apps/web/components/AuthGuard.tsx` | محافظت صفحات private |
| `apps/web/components/ScrollReveal/` | انیمیشن scroll |
| `apps/web/app/api/` | Next.js API routes وصل به Supabase |

### localStorage keys مهم
| key | محتوا |
|-----|-------|
| `auth-storage` | توکن JWT + user info (Zustand) |
| `tournament-regs-${tournamentId}` | آرایه ثبت‌نام‌ها با فیلد `phone` |
| `bracket-${id}` | state کامل جدول مسابقه (TournamentMatch[]) |
| `matchFormat_${id}` | فرمت بازی انتخابی (bo3/bo5/...) |
| `highestBreak-${id}` | بالاترین برک `{name, break}` |

---

## TournamentMatch interface (از mock-tournaments.ts)
```typescript
interface TournamentMatch {
  id: string;
  round: number;
  position: number;
  player1?: { id: string; name: string; rank?: number };
  player2?: { id: string; name: string; rank?: number };
  score1?: number;
  score2?: number;
  status: 'waiting' | 'in_progress' | 'completed';
  winner?: { id: string; name: string };
  nextMatchId?: string;
  nextSlot?: 1 | 2;
  frames?: Array<1 | 2>;
  tableNumber?: number;
}
```
