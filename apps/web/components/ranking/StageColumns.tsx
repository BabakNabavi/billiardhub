/* ─────────────────────────────────────────────────────────────
   ستون‌های مرحله در جدولِ رنکینگ — فقط دسکتاپ.

   همان چیدمانِ جدولِ فدراسیون: پنج مرحله و بعد «جمع امتیازات».
   عرضِ هر خانه ثابت است (`.rk-stg`) تا ستون‌ها در هر ۳۲ ردیف و در
   سرستون دقیقاً روی هم بیفتند. زیرِ ۱۰۲۴px پنهان‌اند و ردیف همان
   ردیفِ موبایل است: فقط جمع.
   ───────────────────────────────────────────────────────────── */

import type { RankingStage } from '@/lib/rankings-store'
import { toFaDigits } from '@/lib/jalali'

/** سرستون: نامِ مرحله، شهر، تاریخ — هم‌ردیف با خانه‌های `StageCells` */
export function StageHead({ stages }: { stages: RankingStage[] }) {
  return (
    <div className="rk-head" aria-hidden>
      {/* همان خانه‌های ردیف با همان عرض‌ها: چیپِ رتبه، عکس، نام، شهر، چیپِ صعود */}
      <span className="rk-head-rank">رتبه</span>
      <span className="rk-head-gap rk-head-portrait" />
      <span className="rk-head-lbl">بازیکن</span>
      <span className="rk-head-city">شهر</span>
      <span className="rk-head-gap rk-head-trend" />
      <span className="rk-stgs">
        {stages.map((s, i) => (
          <span key={i} className="rk-stg rk-stg-h">
            <span className="rk-stg-t">{s.title}</span>
            <span className="rk-stg-c">{s.city}</span>
            <span className="rk-stg-d">{toFaDigits(s.date)}</span>
          </span>
        ))}
      </span>
      <span className="rk-head-total">جمع امتیازات</span>
    </div>
  )
}

/** امتیازِ هر مرحله در ردیفِ بازیکن. `null` ⟵ «—» (ثبت نشده)، صفر ⟵ «۰» */
export function StageCells({ stages, values }: { stages: RankingStage[]; values?: (number | null)[] }) {
  return (
    <span className="rk-stgs">
      {stages.map((s, i) => {
        /* سطرها از `rankings_board`ِ بی‌طرح می‌آیند — فقط عدد عدد است */
        const raw = values?.[i]
        const v = typeof raw === 'number' && Number.isFinite(raw) ? raw : null
        return (
          <span key={i} className={`rk-stg${v === 0 ? ' is-zero' : ''}`}>
            {/* سرستون aria-hidden است؛ نامِ مرحله این‌جا به صفحه‌خوان می‌رسد
                (`aria-label` روی span بی‌نقش خوانده نمی‌شود، پس متنِ پنهان) */}
            <span className="sr-only">{s.title}: </span>
            {v === null ? <><span aria-hidden>—</span><span className="sr-only">ثبت نشده</span></> : toFaDigits(v)}
          </span>
        )
      })}
    </span>
  )
}
