'use client'

/* ─────────────────────────────────────────────────────────────
   انتخابِ شهر برای فیلترِ دایرکتوری.

   ⚠️ فهرست از `lib/iran-geo` می‌آید — همان منبعِ واحدی که
   `ProvinceCitySelect` و همه‌ی فرم‌ها از آن می‌خوانند. نسخه‌ی قبلی
   فقط شهرهای *متخصصانِ موجود* را نشان می‌داد؛ یعنی تا وقتی کسی در
   اصفهان ثبت‌نام نکرده بود، «اصفهان» اصلاً در فهرست نبود و کاربر
   فکر می‌کرد شهرش پشتیبانی نمی‌شود.

   ⚠️ شهرها زیرِ نامِ استان `optgroup` می‌شوند: ۱۱۵۶ گزینه‌ی تختِ
   بی‌گروه غیرقابلِ استفاده است، و گروه‌بندی هم جست‌وجوی تایپی
   مرورگر را حفظ می‌کند.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import { getProvinces } from '@/lib/iran-geo'

export interface CityFilterSelectProps {
  id: string
  value: string
  onChange: (v: string) => void
  className?: string
  /** شهرهایی که دستِ‌کم یک متخصص دارند */
  withTechnicians?: readonly string[]
}

/* ⚠️ یک‌بار برای کلِ ماژول، نه به‌ازای هر نمونه: این فهرست به هیچ
   propی وابسته نیست و صفحه سه جا (سرلوحه، ستونِ فیلتر، شیتِ موبایل)
   همین کامپوننت را سوار می‌کند.

   ⚠️ نامِ تکراری بینِ استان‌ها حذف می‌شود (سردشت در چهار استان،
   فیروزآباد در سه، و ۲۴ نامِ دیگر). فیلتر فقط *نامِ* شهر را مقایسه
   می‌کند، پس دو گزینه با `value`ِ یکسان هیچ تفاوتی در نتیجه
   نمی‌سازند — ولی `select`ِ کنترل‌شده همیشه *اولین* گزینه‌ی هم‌مقدار
   را انتخاب می‌کند، و کاربر می‌دید انتخابش به گروهِ استانِ دیگری
   می‌پرد. اولین استان برنده است، هم‌سو با `provinceOfCity`. */
const GROUPS: ReadonlyArray<{ id: number; name: string; cities: readonly string[] }> = (() => {
  const seen = new Set<string>()
  return getProvinces()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'fa'))
    .map(p => ({
      id: p.id,
      name: p.name,
      cities: p.cities.filter(c => !seen.has(c) && (seen.add(c), true)),
    }))
    .filter(p => p.cities.length > 0)
})()

const KNOWN = new Set(GROUPS.flatMap(p => p.cities))

const EMPTY: readonly string[] = []

export function CityFilterSelect({
  id, value, onChange, className = 'tm-select', withTechnicians = EMPTY,
}: CityFilterSelectProps) {
  /* ⚠️ ۱۱۵۶ گزینه × سه نمونه یعنی بیش از سه هزار گرهِ DOM روی *هر*
     بازدید از دایرکتوری — روی گوشیِ ضعیف که مخاطبِ اصلیِ ماست
     هزینه‌ی واقعی دارد و بیشترِ کاربرها اصلاً این فیلتر را باز
     نمی‌کنند. تا اولین تماس، فقط «همه شهرها» و مقدارِ فعلی رندر
     می‌شود.

     ⚠️ `pointerdown` نه `click`: React به‌روزرسانیِ رویدادهای گسسته
     را پیش از کنشِ پیش‌فرضِ مرورگر همگام تخلیه می‌کند، پس تا وقتی
     فهرستِ بومی باز شود گزینه‌ها سرِ جایشان‌اند. `focus` هم برای
     مسیرِ صفحه‌کلید لازم است. */
  const [full, setFull] = useState(false)
  const open = () => setFull(true)

  const have = useMemo(() => new Set(withTechnicians), [withTechnicians])

  return (
    <select
      id={id} className={className} value={value}
      onChange={e => onChange(e.target.value)}
      onPointerDown={open} onFocus={open} onKeyDown={open}
    >
      <option value="all">همه شهرها</option>

      {/* ⚠️ مقدارِ فعلی همیشه باید یک گزینه داشته باشد — چه هنوز
          فهرستِ کامل نیامده باشد، چه مقدارِ ذخیره‌شده اصلاً در
          داده‌ی جغرافیا نباشد. بدونِ این، `select` بی‌صدا به «همه
          شهرها» می‌پرد و فیلترِ کاربر گم می‌شود. */}
      {value !== 'all' && (!full || !KNOWN.has(value)) && (
        <option value={value}>{value}</option>
      )}

      {full && GROUPS.map(p => (
        <optgroup key={p.id} label={p.name}>
          {p.cities.map(c => (
            /* ⚠️ نشانه‌ی تصویری (مثلاً «●») بدونِ راهنما رمزگشایی
               نمی‌شود و صفحه‌خوان هم فقط «دایره» می‌گوید؛ متن
               خودش را توضیح می‌دهد. */
            <option key={`${p.id}-${c}`} value={c}>
              {have.has(c) ? `${c} — متخصص دارد` : c}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
