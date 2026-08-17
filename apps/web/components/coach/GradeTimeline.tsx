'use client'

/* ─────────────────────────────────────────────────────────────
   مسیرِ مربیگری — درجه‌ها روی یک خطِ زمان.

   داده از قبل تاریخ‌دار بود (`CoachGrade { key, label, year }`) ولی
   به‌شکلِ شش خطِ بولت در یک کارتِ کناری نمایش داده می‌شد. همان داده
   روی یک خطِ زمان، «مسیرِ پیشرفت» را نشان می‌دهد نه فهرستِ مدارک —
   و این تنها چیزی است که یک مربی را از مربیِ دیگر متمایز می‌کند.

   بالاترین درجه اولِ فهرست است و نشانِ «اکنون» می‌گیرد.
   ───────────────────────────────────────────────────────────── */

import { toFaDigits } from '@/lib/jalali'

export interface GradeItem { label: string; year: string }

export default function GradeTimeline({ items, freeCoach = false }: { items: GradeItem[]; freeCoach?: boolean }) {
  if (items.length === 0) {
    /* «مربی آزاد» یک انتخابِ صریح در پنل است، نه پروفایلِ ناتمام؛
       متنِ «هنوز ثبت نشده» او را ناقص جلوه می‌داد. */
    return (
      <p className="ch-empty">
        {freeCoach
          ? 'این مربی به‌عنوان مربی آزاد فعالیت می‌کند و مدرکِ فدراسیونی ثبت نکرده است.'
          : 'هنوز درجه‌ای ثبت نشده است.'}
      </p>
    )
  }

  return (
    <ol className="ch-tl">
      {items.map((g, i) => (
        <li key={`${g.label}-${g.year}`} className="ch-tl-item" data-now={i === 0 ? '1' : undefined}>
          <span className="ch-tl-dot" aria-hidden />
          <span className="ch-tl-year" dir="auto">{g.year ? toFaDigits(g.year) : ''}</span>
          {/* برچسب می‌تواند حرفِ لاتین داشته باشد؛ جدا نگه داشته
              می‌شود تا سال وسطش نیفتد. */}
          <span className="ch-tl-label ch-iso" dir="auto">{g.label}</span>
          {i === 0 && <span className="ch-tl-badge">بالاترین درجه</span>}
        </li>
      ))}
    </ol>
  )
}
