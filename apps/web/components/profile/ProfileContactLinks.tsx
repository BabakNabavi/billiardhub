'use client'

/* ─────────────────────────────────────────────────────────────
   ردیفِ راه‌های ارتباطیِ پروفایل.

   مربی و داور هر دو همین چهار دکمه را داشتند — با همان مسیرِ
   اینلاینِ واتساپ، کپی‌شده. یک نسخه می‌ماند.

   ⚠️ هر دکمه فقط آیکون دارد، پس `aria-label` اجباری است.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'
import { Phone, Send } from 'lucide-react'

export interface ProfileContactLinksProps {
  phone?: string
  whatsapp?: string
  instagram?: string
  telegram?: string
  /** وقتی هیچ راهی ثبت نشده چه نشان داده شود. نبودنش یعنی هیچ. */
  empty?: ReactNode
}

/* ⚠️ تشخیصِ «خالی» فقط این‌جاست. اگر صفحه خودش هم همان شرط را
   دوباره بنویسد، روزی که این تابع سخت‌گیرتر شود (مثلا شماره‌ی
   فقط‌فاصله را نپذیرد) صفحه نه لینک نشان می‌دهد نه حالتِ خالی. */
export default function ProfileContactLinks({ phone, whatsapp, instagram, telegram, empty }: ProfileContactLinksProps) {
  if (!phone && !whatsapp && !instagram && !telegram) return <>{empty ?? null}</>
  return (
    <div className="ch-links ch-links--row">
      {phone && (
        <a href={`tel:${phone}`} className="ch-link" aria-label="تماس تلفنی">
          <Phone size={17} aria-hidden />
        </a>
      )}
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
          className="ch-link" aria-label="واتساپ">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z" />
          </svg>
        </a>
      )}
      {instagram && (
        <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer"
          className="ch-link" aria-label="اینستاگرام">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
        </a>
      )}
      {telegram && (
        <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer"
          className="ch-link" aria-label="تلگرام">
          <Send size={17} aria-hidden />
        </a>
      )}
    </div>
  )
}
