'use client'

/* ─────────────────────────────────────────────────────────────
   نردبانِ اعتبارنامه‌ی داور.

   ── چرا این‌جا با مربی فرق دارد ──
   مربی شاگرد می‌گیرد، پس صفحه‌اش «مرا رزرو کن» است. داور هیچ‌کدام
   را نمی‌فروشد؛ سرمایه‌اش *صلاحیت* است. در پلتفرم‌های ورزشیِ
   معتبر هم پروفایلِ داور دقیقا همین است: FIFA/UEFA سطحِ نشان و
   سالِ دریافتش را محورِ صفحه می‌کنند، Referee.Observer اعتبارنامه‌ها
   و وضعیتِ فعال را بالای همه‌چیز می‌گذارد، و LinkedIn در بخشِ
   «Licenses & certifications» مرجعِ صادرکننده و سال را کنارِ هر
   مدرک می‌آورد. هیچ‌کدام «تعداد شاگرد» ندارند.

   ── چرا نردبان و نه خطِ زمان ──
   خطِ زمانِ مربی فقط چیزی را که *گرفته* نشان می‌دهد. برای داور،
   خودِ ساختارِ درجات معنا دارد: بیننده باید ببیند این آدم کجای
   نردبانِ هشت‌پله‌ی فدراسیون ایستاده. پس همه‌ی پله‌ها رندر
   می‌شوند — گرفته‌ها با سال و پررنگ، بقیه کم‌رنگ به‌عنوان مسیر.

   ⚠️ استایلِ این کامپوننت زیرِ `.ch-rf` قفل است؛ بیرونِ آن ظرف
   بی‌استایل رندر می‌شود.

   ⚠️ هیچ عددِ ساختگی: «تعداد مسابقات»، «فینال‌ها» و «فصل‌ها» در
   این پروژه داده ندارند و ساخته نمی‌شوند.
   ───────────────────────────────────────────────────────────── */

import { Check, ShieldCheck } from 'lucide-react'
import { GRADES } from '@/lib/referee-store'
import { toFaDigits } from '@/lib/jalali'
import { keepLatinProps } from '@/lib/text-fa'

export interface RefereeLadderProps {
  /** کلیدِ درجه ⟵ سالِ دریافت. کلیدهای ناشناخته نادیده گرفته می‌شوند. */
  earned: ReadonlyMap<string, string>
  /** مدرک نزد ادمین ثبت شده و تأیید گرفته؟ */
  verified: boolean
}

export default function RefereeLadder({ earned, verified }: RefereeLadderProps) {
  /* بالاترین پله‌ای که گرفته شده — مرزِ «رسیده» و «پیشِ رو» */
  let topIndex = -1
  GRADES.forEach((g, i) => { if (earned.has(g.key)) topIndex = i })

  if (topIndex < 0) {
    return <p className="ch-empty">هنوز درجه‌ای برای این داور ثبت نشده است</p>
  }

  return (
    <ol className="rf-ladder">
      {GRADES.map((g, i) => {
        const year = earned.get(g.key)
        const has = earned.has(g.key)
        const isTop = i === topIndex
        return (
          <li key={g.key} className="rf-step"
            data-has={has ? '1' : undefined}
            style={{ ['--c' as string]: g.color }}>
            <span className="rf-step-mark" aria-hidden>
              {has ? <Check size={13} strokeWidth={3} /> : <i className="rf-step-dot" />}
            </span>

            <span className="rf-step-body">
              {/* برچسب می‌تواند تماما لاتین باشد (`ACBS Gold Referee`)؛
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
