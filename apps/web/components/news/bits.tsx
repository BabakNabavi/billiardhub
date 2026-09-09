/* ─────────────────────────────────────────────────────────────
   اجزای ریزِ تحریریه — کیکر، نشان، متادیتا، قابِ عکس.

   ⚠️ همه Server Component‌اند: هیچ‌کدام state یا رویداد ندارند، پس
   هیچ‌کدام نباید وزنی به باندلِ کلاینت اضافه کنند. مخاطبِ اصلی
   موبایلِ ایرانی با شبکه‌ی کند است.
   ───────────────────────────────────────────────────────────── */

import { sectionLabel } from '@/lib/news/sections'
import { stamp, dateOf, iso, readTime } from '@/lib/news/format'
import type { Article } from '@/lib/news/server'

export function Kicker({ a, urgent = false }: { a: Article; urgent?: boolean }) {
  return (
    <span className={`nr-kicker${urgent ? ' nr-kicker--urgent' : ''}`}>
      {urgent ? 'فوری' : sectionLabel(a.section)}
    </span>
  )
}

/* ── نشان‌های اعتبار ──
   ⚠️ هیچ‌کدام ساختگی نیست: «اختصاصی» فقط با برچسبِ ویراستار می‌آید و
   «به‌روزرسانی شد» فقط وقتی `updated_at` واقعاً بعد از انتشار است. */
export function Flags({ a }: { a: Article }) {
  if (!a.exclusive && !a.updatedTs) return null
  return (
    <>
      {a.exclusive && <span className="nr-flag nr-flag--gold">اختصاصی</span>}
      {a.updatedTs && <span className="nr-flag">به‌روزرسانی شد</span>}
    </>
  )
}

/** متادیتا — هر تکه فقط وقتی می‌آید که واقعاً وجود داشته باشد. */
export function Meta({ a, withAuthor = false }: { a: Article; withAuthor?: boolean }) {
  const rt = readTime(a.readMinutes)
  /* ⚠️ نویسنده فقط اگر خبر به کاربری وصل باشد. «تحریریه بیلیارد هاب»
     هم ننویس مگر واقعاً بدانی چه کسی نوشته — نامِ جای‌گیر همان
     جعلِ داده است با لباسِ مؤدب. */
  const bits = [
    withAuthor && a.author ? a.author : null,
    a.ts ? <time key="t" dateTime={iso(a.ts)}>{stamp(a.ts)}</time> : null,
    rt || null,
  ].filter(Boolean)
  if (bits.length === 0) return null
  return (
    <div className="nr-meta">
      {bits.map((b, i) => <span key={i}>{b}</span>)}
    </div>
  )
}

/* ── قابِ عکس ──
   ⚠️ خبرِ بی‌عکس قابِ خالیِ خاکستری نمی‌گیرد. پنلِ ادمین تا امروز
   اصلاً فیلدِ عکس نداشت، پس بیشترِ خبرها بی‌عکس‌اند و یک شبکه‌ی پر از
   مستطیلِ خالی بدتر از چیدمانِ متنی است. `null` برمی‌گردد و چیدمان
   خودش را جمع می‌کند. */
export function Cover({
  a, ratio = '16x9', sizes, priority = false,
}: {
  a: Article
  ratio?: '16x9' | '3x2' | '1x1' | '4x5'
  sizes?: string
  priority?: boolean
}) {
  if (!a.cover) return null
  return (
    <div className={`nr-fig nr-fig--${ratio}`}>
      <img
        src={a.cover}
        alt=""
        sizes={sizes}
        /* ⚠️ خبرِ صدر بالای خطِ تاست و lazy کردنش فقط LCP را عقب
           می‌اندازد؛ بقیه lazy می‌مانند. */
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </div>
  )
}

/** تاریخِ کاملِ خوانا — برای صفحه‌ی خبر */
export const FullDate = ({ ts }: { ts: number }) =>
  ts ? <time dateTime={iso(ts)}>{dateOf(ts)}</time> : null
