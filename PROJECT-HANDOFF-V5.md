# Billiard Plus — Project Handoff for Claude Code
**تاریخ:** تیر ۱۴۰۴

---

## ساختار پروژه

```
I:\Billiard Plus\billiard-plus\          ← Turborepo monorepo
├── apps\
│   ├── api\                             ← NestJS بک‌اند (فقط محلی، هنوز deploy نشده)
│   │   └── src\
│   │       ├── modules\
│   │       │   ├── auth\               ← login, register, JWT, verify (کد ملی + OTP)
│   │       │   ├── user\               ← user entity, profile
│   │       │   ├── club\               ← باشگاه‌ها
│   │       │   ├── product\            ← محصولات
│   │       │   ├── booking\            ← رزرو
│   │       │   └── role\               ← سیستم نقش‌ها
│   │       └── bookings\
│   └── web\                            ← Next.js 16.2 فرانت‌اند (deploy روی Vercel)
│       ├── app\
│       │   ├── api\                    ← Next.js API routes (وصل به Supabase)
│       │   │   ├── auth\
│       │   │   │   ├── login\
│       │   │   │   ├── register\
│       │   │   │   └── verify\         ← جدید: کد ملی + OTP
│       │   │   │       ├── national-id\
│       │   │   │       └── otp\
│       │   │   │           ├── send\
│       │   │   │           └── confirm\
│       │   │   ├── products\
│       │   │   ├── clubs\
│       │   │   ├── bookings\
│       │   │   ├── roles\              ← جدید: سیستم نقش‌ها
│       │   │   └── users\
│       │   ├── profile\
│       │   │   ├── role\               ← انتخاب نقش (multi-select)
│       │   │   ├── verify\             ← احراز هویت کد ملی + OTP
│       │   │   ├── setup\             ← پر کردن پروفایل تخصصی
│       │   │   ├── me\                ← پروفایل کاربر عادی
│       │   │   └── [userId]\          ← صفحه عمومی پروفایل
│       │   ├── admin\
│       │   │   └── roles\             ← پانل ادمین تأیید نقش‌ها
│       │   ├── shop\                  ← بیلیارد بازار (بازطراحی شده)
│       │   ├── clubs\
│       │   ├── players\
│       │   ├── dashboard\
│       │   └── ...
│       ├── lib\
│       │   ├── roles.ts               ← تعریف همه نقش‌ها و فیلدهای تخصصی
│       │   └── supabase-server.ts
│       └── store\
│           └── auth.store.ts          ← Zustand + persist (کلید: auth-storage)
```

---

## لینک‌های مهم

- **GitHub:** https://github.com/BabakNabavi/billiard-plus
- **Vercel:** https://billiard-plus.vercel.app
- **Supabase Project ID:** bxnomfjjvhdtbnqvgjmh
- **Supabase URL:** https://bxnomfjjvhdtbnqvgjmh.supabase.co

---

## دیتابیس

**نوع:** PostgreSQL روی Supabase

### جداول موجود:
```
users           ← کاربران
clubs           ← باشگاه‌ها
products        ← محصولات بیلیارد بازار
bookings        ← رزرو میز
role_requests   ← درخواست‌های نقش (pending/approved/rejected)
```

### فیلدهای مهم جدول users:
```sql
id                    UUID PK
firstName             VARCHAR
lastName              VARCHAR
phone                 VARCHAR (unique)
password              VARCHAR (bcrypt)
email                 VARCHAR
primaryRole           VARCHAR default 'user'
secondaryRoles        TEXT[]
verificationStatus    VARCHAR default 'unverified'
isProfileComplete     BOOLEAN default false
avatar                VARCHAR
bio                   TEXT
province              VARCHAR
city                  VARCHAR
birthDate             VARCHAR
gender                VARCHAR
instagram             VARCHAR
national_id           VARCHAR(10)
national_id_verified  BOOLEAN default false
phone_verified        BOOLEAN default false
email_verified        BOOLEAN default false
otp_code              VARCHAR(6)
otp_expires_at        TIMESTAMPTZ
otp_attempts          INTEGER default 0
club_id               UUID FK clubs
club_name_manual      VARCHAR
bank_card             VARCHAR(16)
bank_card_owner       VARCHAR
playerProfile         JSONB
coachProfile          JSONB
refereeProfile        JSONB
manufacturerProfile   JSONB
installerProfile      JSONB
sellerProfile         JSONB
```

---

## محیط و تنظیمات

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SUPABASE_URL=https://bxnomfjjvhdtbnqvgjmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bm9tZmpqdmhkdGJucXZnam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDMyMTYsImV4cCI6MjA5NDE3OTIxNn0.at-yUpRT5pD2ghcqsXdE8mp8HXdunqX0yWlBwMQCLGs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bm9tZmpqdmhkdGJucXZnam1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYwMzIxNiwiZXhwIjoyMDk0MTc5MjE2fQ.mG8qphHXexdzeAhk6wVGW4gmrVavsP3TOT-i3q4ZdnY
JWT_SECRET=billiard-plus-super-secret-key-2026
# بعداً اضافه کن:
APIIR_KEY=
KAVENEGAR_API_KEY=
```

### apps/api/.env
```
DATABASE_URL=postgresql://postgres.bxnomfjjvhdtbnqvgjmh:Billiard2026%3F%21@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
JWT_SECRET=billiard-plus-super-secret-key-2026
```

---

## احراز هویت

- **روش:** موبایل + پسورد (نه OTP، نه ایمیل برای ورود)
- **توکن:** JWT با عمر ۷ روز
- **ذخیره توکن:** Zustand persist با کلید `auth-storage` در localStorage
- **ادمین:** موبایل `09121327283` / پسورد `Admin1234` / UUID: `eba4e069-81c5-42ac-90c0-dbe188d56b98`

### خواندن توکن (مهم):
```typescript
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

## سیستم نقش‌ها

### ۸ نقش:
| value | label | رنگ | نیاز به مدرک |
|-------|-------|-----|-------------|
| user | کاربر عادی | #94a3b8 | ✗ |
| player | بازیکن رنکینگی | #10b981 | ✓ |
| coach | مربی | #a78bfa | ✓ |
| referee | داور | #f59e0b | ✓ |
| technician | خدمات فنی | #06b6d4 | ✗ |
| seller | فروشنده | #f97316 | ✓ |
| manufacturer | تولیدکننده | #ef4444 | ✓ |
| club_owner | باشگاه‌دار | #3b82f6 | ✓ |

### جریان نقش:
```
کاربر → /profile/role → انتخاب نقش → آپلود مدرک
→ status=pending در role_requests
→ ادمین /admin/roles → تأیید/رد
→ approved → /profile/setup → فرم تخصصی
→ /profile/[userId] صفحه عمومی
```

---

## احراز هویت کاربر عادی

### جریان:
```
/profile/verify
مرحله ۱: کد ملی + نام → POST /api/auth/verify/national-id
مرحله ۲: ارسال OTP  → POST /api/auth/verify/otp/send
مرحله ۳: تأیید OTP  → POST /api/auth/verify/otp/confirm
→ phone_verified=true, verificationStatus='verified'
```

### حالت Mock (بدون API key):
- کد ملی: نام رو با firstName/lastName در DB مقایسه می‌کنه
- OTP: کد رو مستقیم در response برمی‌گردونه

---

## تم و طراحی

- **تم:** Dark با لهجه سبز نئون `#10b981`
- **فونت:** Vazirmatn (Google Fonts)
- **RTL:** کامل
- **آیکون:** Tabler Icons CDN (`https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css`)
- **استایل:** inline style — بدون Tailwind
- **رنگ‌ها:** bg=#0a0f0d / surface=#111a15 / neon=#10b981 / text=#e2e8f0 / muted=#64748b

### الگوی صفحه جدید:
```tsx
'use client'
export default function Page() {
  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={{ minHeight:'100vh', background:'#0a0f0d', fontFamily:'Vazirmatn,Tahoma,sans-serif', direction:'rtl' }}>
        {/* orb */}
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

### Next.js 16 — params باید await بشه:
```typescript
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
}
```

### همه route.ts ها:
```typescript
export const dynamic = 'force-dynamic'
```

### اعداد فارسی:
```typescript
const toFa = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
```

### آیکون‌های ناموجود در lucide-react:
```
Instagram, Edit3, Zap → از Tabler یا SVG inline استفاده کن
```

---

## صفحات — وضعیت کامل

| صفحه | وضعیت | نکته |
|------|--------|-------|
| `/` | ✅ | صفحه اصلی |
| `/clubs` | ✅ | لیست باشگاه‌ها |
| `/clubs/[id]` | ✅ | جزئیات باشگاه |
| `/booking/[clubId]` | ✅ | رزرو میز |
| `/shop` | ✅ | بازطراحی liquid dark |
| `/shop/[id]` | ✅ | جزئیات محصول |
| `/players` | ✅ | رنکینگ |
| `/players/[id]` | ✅ | پروفایل بازیکن |
| `/profile/role` | ✅ | انتخاب نقش multi-select |
| `/profile/verify` | ✅ | احراز هویت |
| `/profile/me` | ✅ | پروفایل کاربر عادی |
| `/profile/setup` | ✅ | فرم تخصصی نقش |
| `/profile/[userId]` | ✅ | صفحه عمومی |
| `/admin/roles` | ✅ | پانل ادمین |
| `/login` `/register` | ✅ | |
| `/dashboard` | ⚠️ | هنوز mock data |

---

## اولویت‌های بعدی

### فوری:
1. لینک دادن `/profile/verify` بعد از انتخاب نقش user
2. داشبورد واقعی (وصل به API)

### مهم:
3. صفحات تخصصی هر نقش (عمومی + پنل مدیریت)
4. deploy بک‌اند NestJS روی Railway

### بعدی:
5. پیامک Kavenegar (بعد از خرید key)
6. استعلام کد ملی api.ir (بعد از خرید key)
7. سیستم چت بین خریدار و فروشنده
8. اعلان‌ها
9. امتیازدهی به باشگاه

---

## اجرای محلی

```powershell
# بک‌اند:
cd "I:\Billiard Plus\billiard-plus\apps\api"
npm run start:dev

# فرانت:
cd "I:\Billiard Plus\billiard-plus\apps\web"
npm run dev
```

## دیپلوی
```powershell
git add .
git commit -m "..."
git push origin main
# Vercel خودکار deploy می‌کنه
```
