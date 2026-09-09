'use client'

/* ─────────────────────────────────────────────────────────────
   کارت «پروفایل نیست» و اسکلت بارگذاری صفحه‌های عمومی.

   ── چرا مشترک شد ──
   چهار صفحه (بازیکن، خدمات فنی، تولیدکننده، داور) عملا یک کارت
   داشتند با آیکون و متن متفاوت — همان پالت، همان ابعاد، همان دکمه.
   نسخه‌ی پنجم لازم شد و به‌جای پنج تکرار، یکی شد.

   ── حالت دومی که نبود ──
   هر چهار صفحه خطای شبکه را «پیدا نشد» می‌خواندند: `fetchProfile` با
   `null` هم «نیست» و هم «نرسید» را نشان می‌داد. روی موبایل ایرانی که
   درخواست تایم‌اوت می‌شود، به کاربر می‌گفتیم این آدم وجود ندارد.
   حالا `netFail` پیام خودش را می‌گیرد و راه تلاش دوباره دارد —
   بازگشت به فهرست هم می‌ماند، چون شاید شبکه اصلا برنگردد.

   ── چرا اسکلت هم این‌جاست ──
   «تلاش دوباره» حالت بارگذاری را *دوباره* قابل دیدن کرد. پیش‌تر فقط
   در اولین رنگ‌آمیزی رخ می‌داد و یک `<p>` بی‌نقش کافی به‌نظر می‌رسید؛
   حالا کاربر خودش آن را احضار می‌کند و باید اعلام شود.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { ArrowRight, RotateCw, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'

const TEXT = '#1C1B17'
const MUT  = '#6F6A5C'
const LINE = '#E7E2D6'
const BG   = '#F7F7F5'

const SHELL: React.CSSProperties = {
  minHeight: '70vh', background: BG, display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif', padding: 20,
}

/** حالت بارگذاری همان صفحه‌ها — با نقش، چون «تلاش دوباره» احضارش می‌کند */
export function ProfileLoading({ label = 'در حال بارگذاری…' }: { label?: string }) {
  return (
    <div dir="rtl" style={SHELL} role="status" aria-busy="true">
      <p style={{ fontSize: 14, fontWeight: 600, color: MUT }}>{label}</p>
    </div>
  )
}

export interface ProfileMissingProps {
  /** آیکون ویژه‌ی همان نقش — در حالت خطای شبکه نادیده گرفته می‌شود */
  icon: ReactNode
  /** «بازیکن پیدا نشد» و مانندش */
  title: string
  message: string
  backHref: string
  backLabel: string
}

/* ── چرا یونیون تفکیک‌شده ──
   `netFail` و `onRetry` جدا که باشند، ترکیب «خطای شبکه بدون دکمه»
   ممکن می‌شود: متن می‌گوید دوباره تلاش کنید و دکمه‌ای نیست. حالا
   تایپ‌چکر جلویش را می‌گیرد. */
type RetryState =
  | { netFail: true; onRetry: () => void }
  | { netFail?: false; onRetry?: never }

export function ProfileMissing({
  icon, title, message, backHref, backLabel, netFail, onRetry,
}: ProfileMissingProps & RetryState) {
  return (
    <div dir="rtl" style={SHELL}>
      <div style={{
        textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`,
        borderRadius: 18, padding: '40px 34px', maxWidth: 380,
      }}>
        <div style={{ color: MUT, opacity: 0.5, marginBottom: 10 }} aria-hidden>
          {netFail ? <WifiOff size={34} /> : icon}
        </div>
        {/* `h1` بود نه `p`: در این حالت صفحه هیچ عنوان دیگری ندارد و
            خواننده‌ی صفحه چیزی برای لنگر انداختن پیدا نمی‌کرد. */}
        <h1 style={{ fontSize: 17, fontWeight: 900, color: TEXT, margin: '0 0 8px' }}>
          {netFail ? 'بارگذاری نشد' : title}
        </h1>
        <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.8 }}>
          {netFail
            ? 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.'
            : message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {netFail && (
            <button type="button" onClick={onRetry} className="lq-cta">
              <RotateCw size={14} aria-hidden />تلاش دوباره
            </button>
          )}
          {/* لینک بازگشت در حالت خطا هم می‌ماند — شاید شبکه برنگردد */}
          <Link href={backHref} className="lq-cta">
            {backLabel}
            {/* در RTL فلش «بازگشت» به راست است */}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
}
