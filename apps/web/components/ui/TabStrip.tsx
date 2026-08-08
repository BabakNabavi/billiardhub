'use client'

/* ─────────────────────────────────────────────────────────────
   نوارِ تب — یک ردیف، همیشه.

   ── مشکلی که این را ساخت ──
   تقریباً هر صفحه‌ی پنلِ ادمین یک ردیفِ تب داشت با
   `display:flex; flexWrap:'wrap'` و `gap: 8`. روی موبایل، سومی یا
   چهارمی به خطِ دوم می‌افتاد و ردیف نصفه‌نیمه دیده می‌شد — در
   حالی که با فاصله‌ی کمتر هر چهار تا در یک خط جا می‌شدند.

   بدتر: هر صفحه استایلِ خودش را داشت. نوزده صفحه، نوزده ردیفِ
   کمی‌متفاوت. یک تغییرِ ظاهری یعنی نوزده ویرایش.

   ── راهِ حل ──
   یک نوارِ مشترک: هرگز نمی‌شکند، فاصله‌ها فشرده‌اند، و اگر واقعاً
   جا نشد کشیده می‌شود (درگ با ماوس، سوایپ روی موبایل) — همان
   الگویی که پنلِ باشگاه دارد.
   ───────────────────────────────────────────────────────────── */

import DragScroll from './DragScroll'

const GOLD_D = '#9A6E38', MUT = '#6B7280', LINE = '#F0EDE8'

export interface TabItem {
  key: string
  label: string
  /** عددِ کنارِ برچسب — مثلاً تعدادِ موارد */
  count?: number
  /** رنگِ اختصاصی برای حالتِ فعال (وضعیت‌هایی که رنگ دارند) */
  fg?: string
  bg?: string
}

const faNum = (n: number) => n.toLocaleString('fa-IR')

export default function TabStrip({
  tabs, value, onChange, style,
}: {
  tabs: TabItem[]
  value: string
  onChange: (key: string) => void
  style?: React.CSSProperties
}) {
  return (
    <DragScroll style={{
      display: 'flex', gap: 4, marginBottom: 16,
      background: '#fff', borderRadius: 14, padding: 4,
      border: `1px solid ${LINE}`,
      ...style,
    }}>
      {tabs.map(t => {
        const on = value === t.key
        const fg = t.fg ?? GOLD_D
        const bg = t.bg ?? 'rgba(199,166,106,0.14)'
        return (
          <button key={t.key} type="button" onClick={() => onChange(t.key)} style={{
            /* هیچ تبی نه کوچک می‌شود نه برچسبش دو خط — دو دلیلِ
               اصلیِ شکستنِ ردیف در نسخه‌های قبلی. */
            flex: '0 0 auto', whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', borderRadius: 20,
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-base)',
            border: `1px solid ${on ? fg + '55' : 'transparent'}`,
            background: on ? bg : 'transparent',
            color: on ? fg : MUT,
            transition: 'background .15s, color .15s',
          }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: on ? fg : '#9CA3AF',
                background: on ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.05)',
                borderRadius: 999, padding: '1px 6px', minWidth: 18, textAlign: 'center',
              }}>{faNum(t.count)}</span>
            )}
          </button>
        )
      })}
    </DragScroll>
  )
}
