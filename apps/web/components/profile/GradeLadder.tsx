/* ─────────────────────────────────────────────────────────────
   نردبانِ درجه‌ها — مشترکِ داور و مربی.

   ── چرا نردبان و نه خطِ زمان ──
   خطِ زمانِ قبلی فقط چیزی را نشان می‌داد که *گرفته* شده. ولی
   ساختارِ خودِ درجاتِ فدراسیون معنا دارد: بیننده باید ببیند این
   آدم کجای مسیر ایستاده و چه پیشِ رو دارد. پس همه‌ی پله‌ها رندر
   می‌شوند — گرفته‌ها با سال و رنگ، بقیه کم‌رنگ به‌عنوان مسیر.

   این همان شکلی است که صفحه‌ی داور داشت و حالا صفحه‌ی مربی هم
   می‌گیرد؛ پس یک کامپوننت، نه دو نسخه‌ی موازی.

   ⚠️ استایلش زیرِ `.ch-ladder` در `profile-page.css` است. بیرونِ
   آن ظرف بی‌استایل رندر می‌شود.

   ⚠️ هیچ عددِ ساختگی: «تعداد مسابقه»، «شاگرد» و «فصل» در این
   پروژه داده ندارند و ساخته نمی‌شوند.
   ───────────────────────────────────────────────────────────── */

import { Check, ShieldCheck } from 'lucide-react'
import { toFaDigits } from '@/lib/jalali'
import { keepLatinProps } from '@/lib/text-fa'

export interface LadderGrade {
  key: string
  label: string
  dots: number
  /** رنگِ پله. نبودنش یعنی از `dots` ساخته شود. */
  color?: string
}

/* ── رنگ وقتی منبع رنگ ندارد ──
   درجاتِ مربی (`lib/coach-store`) فقط `dots` دارند. به‌جای رنگِ
   تصادفی، همان نردبانِ معناییِ داور تکرار می‌شود: هرچه بالاتر،
   گرم‌تر و پررنگ‌تر. */
const BY_DOTS = ['#64748b', '#16A34A', '#C2410C', '#8F6531', '#7C3AED'] as const
const colorOf = (g: LadderGrade) => g.color ?? BY_DOTS[Math.min(Math.max(g.dots, 1), 5) - 1]

export interface GradeLadderProps {
  /** همه‌ی پله‌ها، از پایین به بالا */
  grades: readonly LadderGrade[]
  /** کلیدِ درجه ⟵ سالِ دریافت. کلیدِ ناشناخته باید پیش از این فیلتر شود. */
  earned: ReadonlyMap<string, string>
  /** مدرک نزد ادمین تأیید شده؟ نشانِ بالاترین پله به این بند است. */
  verified: boolean
  /** وقتی هیچ درجه‌ای ثبت نشده چه نوشته شود. */
  emptyText: string
}

export default function GradeLadder({ grades, earned, verified, emptyText }: GradeLadderProps) {
  /* بالاترین پله‌ای که گرفته شده — مرزِ «رسیده» و «پیشِ رو» */
  let topIndex = -1
  grades.forEach((g, i) => { if (earned.has(g.key)) topIndex = i })

  if (topIndex < 0) return <p className="ch-empty">{emptyText}</p>

  return (
    <ol className="rf-ladder">
      {grades.map((g, i) => {
        const year = earned.get(g.key)
        const has = earned.has(g.key)
        const isTop = i === topIndex
        return (
          <li key={g.key} className="rf-step"
            data-has={has ? '1' : undefined}
            style={{ ['--c' as string]: colorOf(g) }}>
            <span className="rf-step-mark" aria-hidden>
              {has ? <Check size={13} strokeWidth={3} /> : <i className="rf-step-dot" />}
            </span>

            <span className="rf-step-body">
              {/* برچسب می‌تواند تماما لاتین باشد (`WPBSA Level 3`)؛
                  بدونِ جداسازی، IRANSansX آن را faux-bold می‌کند. */}
              <span dir="auto" {...keepLatinProps(g.label, 'rf-step-label ch-iso')}>{g.label}</span>
              <span className="rf-step-meta">
                <span className="rf-step-dots" aria-hidden>
                  {Array.from({ length: 5 }, (_, d) => (
                    <i key={d} data-on={d < g.dots ? '1' : undefined} />
                  ))}
                </span>
                {has
                  ? <span className="rf-step-year">{year ? toFaDigits(year) : 'ثبت‌شده'}</span>
                  : <span className="rf-step-next">پیشِ رو</span>}
                {isTop && verified && (
                  <span className="rf-step-badge">
                    <ShieldCheck size={13} aria-hidden />
                    مدرک تأیید شده
                  </span>
                )}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
