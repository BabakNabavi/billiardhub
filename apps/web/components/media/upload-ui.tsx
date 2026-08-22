'use client'

/* ─────────────────────────────────────────────────────────────
   واژگانِ ظاهریِ پنجره‌ی آپلودِ مدیا.

   ── چرا این فایل ساخته شد ──
   `MediaUpload` یک پنجره‌ی قدیمیِ تماماً inline-style است و دو صفحه‌ی
   بی‌ربط را در خود داشت (مرحله‌ی کانال، فرمِ ویدیو). با اضافه‌شدنِ
   انتخابگرِ چندکاناله از ۳۳۶ به بیش از ۴۵۰ خط رسید. مرحله‌ی کانال
   جدا شد و این رنگ‌ها/ورودی‌ها بینِ دو فایل مشترک‌اند.

   ⚠️ عمداً Tailwind نشد: بقیه‌ی همان پنجره inline است و نیم‌کاسه
   کردنش، پنجره‌ای می‌ساخت که نیمی از یک زبان و نیمی از زبانِ دیگر
   استایل می‌گیرد. تبدیلِ کاملِ پنجره کارِ جداست، نه ضمیمه‌ی این تغییر.
   ───────────────────────────────────────────────────────────── */

import type { CSSProperties, ReactNode } from 'react'

export const INK = '#1C1B17', SEC = '#5B564B', MUT = '#6F6A5C', LINE = '#EAE5DA'
export const GOLD = '#C7A66A', GOLD_D = '#8F6531'

export const inp: CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px', borderRadius: 11, border: `1px solid ${LINE}`,
  background: '#FAF8F3', fontSize: 13.5, fontFamily: 'inherit', color: INK, outline: 'none',
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  )
}

/* چرخشِ لودر — پیش‌تر عیناً در هر دو شاخه‌ی همان پنجره تکرار شده بود */
export const SPIN_CSS = '@keyframes bmspin { to { transform: rotate(360deg); } } .bm-spin { animation: bmspin 1s linear infinite; }'
