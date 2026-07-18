# Billiard Hub — project rules

## استان و شهر — منبعِ واحد (single source of truth)

هرجا در این پروژه از کاربر خواسته می‌شود **شهر** (و در صورت نیاز **استان**) را وارد یا
انتخاب کند، باید **حتماً** از کامپوننت `ProvinceCitySelect` استفاده شود و **هرگز** لیست
استان‌ها/شهرها به‌صورت دستی یا مجدد ساخته نشود.

- **کامپوننت:** `apps/web/components/ProvinceCitySelect.tsx`
  (دراپ‌داونِ زنجیره‌ایِ استان → شهر، سرچ‌دار، controlled).
- **داده:** `apps/web/data/iran-geo.json` (۳۱ استان، ۱۱۹۳ شهر — از
  `sajaddp/list-of-cities-in-Iran`, نسخه‌ی `cities-filtered`).
- **لودر:** `apps/web/lib/iran-geo.ts` — `getProvinces()`, `getProvinceNames()`,
  `getCities(province)`, `provinceOfCity(city)`.

### قواعد
1. برای گرفتنِ شهر از کاربر، `<input>` متنی یا `<select>` با لیستِ هاردکد **نساز**.
   به‌جایش:
   ```tsx
   import ProvinceCitySelect from '@/components/ProvinceCitySelect' // یا مسیر نسبی
   const [geo, setGeo] = useState({ province: '', city: '' })
   <ProvinceCitySelect value={geo} onChange={setGeo} required />
   ```
2. اگر فرم قبلاً فقط `city` را نگه می‌داشت، یک فیلد `province` هم کنارش اضافه کن و هر
   دو را به همان state/store قبلی وصل کن. برای داده‌ی قدیمیِ فقط‌شهر، استان را با
   `provinceOfCity(city)` بک‌فیل کن.
3. لیستِ شهرِ هاردکد در هیچ فایلِ جدیدی مجاز نیست. لیست‌های قدیمی (مثلاً `CITIES`،
   `iranCities`، `IRAN_PROVINCES`) در حال حذف‌اند — اگر به یکی برخوردی، با
   `ProvinceCitySelect` جایگزینش کن.
4. فیلترهای لیست (مثلاً «فیلتر فروشگاه‌ها بر اساس شهر») ورودیِ کاربر نیستند و اجباری
   نیست از این کامپوننت استفاده کنند، ولی ترجیحاً از `getCities`/`getProvinceNames`
   همین لودر بخوانند تا لیست‌ها یکی بمانند.

## Stack (خلاصه)
- Next.js 16 App Router · React 19 · TypeScript · Tailwind 3.4 + inline styles · RTL فارسی
- فرانت `apps/web`، بک‌اند `apps/api` (NestJS، محلی). دیتای نمونه در localStorage.
- جزئیات بیشتر در حافظه‌ی خودکار: `~/.claude/projects/.../memory/`.
