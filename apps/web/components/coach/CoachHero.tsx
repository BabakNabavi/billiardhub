'use client'

/* ─────────────────────────────────────────────────────────────
   هیروی پروفایل مربی — تیره، سینمایی، ادیتوریال.

   ── چرا از نو ──
   نسخه‌ی قبلی یک کارتِ سفید بود میان کارت‌های سفیدِ دیگر: نام در
   ۲۶ پیکسل، عکسِ کاور پشتِ یک بریدگی، و هیچ چیزی که بگوید این
   صفحه‌ی یک آدم است نه یک ردیفِ جدول. صفحه ۱۶۷۳ پیکسل بلند بود و
   نیمی‌اش خالی.

   الگو از پروفایل‌های ورزشیِ بین‌المللی گرفته شده: یک نوارِ تیره‌ی
   تمام‌عرض، نامِ یادمانی، و واقعیت‌ها به‌صورتِ نوارِ آمار — نه فهرستِ
   عمودیِ برچسب‌ها.

   ── چه چیزی عمداً این‌جا نیست ──
   امتیاز، تعدادِ شاگرد، ستاره. هیچ‌کدام داده‌ی واقعی ندارند و عددِ
   ساختگی روی پروفایلِ یک آدمِ واقعی، جعلِ اعتبار است.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'
import { toFaDigits } from '@/lib/jalali'

export interface CoachHeroProps {
  name: string
  /** نامِ لاتین برای متنِ توخالیِ پس‌زمینه — نبودنش یعنی کشیده نشود */
  nameLatin?: string
  city: string
  sinceYear?: string
  photo?: string
  cover?: string
  verified: boolean
  /** برچسبِ درجه و رنگش — از `badgeFromGrades` */
  grade?: { label: string; dots: number }
  /** ── چرا رشته‌ها رنگ ندارند ──
     پیش‌تر هرکدام رنگِ اشباعِ خودش را داشت و کنارِ طلاییِ صفحه
     چهار تأکیدِ هم‌زمان می‌شد. بدتر: جدولِ رنگ سه نسخه داشت و
     هم‌نظر نبودند — اسنوکر این‌جا سبز بود و در فهرست بنفش. حالا
     برچسب از `disciplineLabel` می‌آید و چیپ خنثی است. */
  disciplines: { label: string }[]
  phone?: string
  whatsapp?: string
  /** بزرگ‌نماییِ عکسِ پروفایل — نبودنش یعنی آواتار کلیک‌شدنی نباشد */
  onOpenPhoto?: (url: string) => void
}

const FALLBACK_COVER = '/images/shop/snooker-table.webp'

export default function CoachHero({
  name, nameLatin, city, sinceYear, photo, cover, verified,
  grade, disciplines, phone, whatsapp, onOpenPhoto,
}: CoachHeroProps) {
  const avatar = photo
    ? <img src={photo} alt={`عکس ${name}`} loading="eager" decoding="async" />
    : <span aria-hidden>{name.trim().charAt(0)}</span>
  return (
    <header className="ch-hero">
      <div className="ch-hero-img" style={{ backgroundImage: `url(${cover || FALLBACK_COVER})` }} />
      <div className="ch-hero-scrim" />
      {nameLatin && <div className="ch-hero-ghost" aria-hidden>{nameLatin}</div>}

      <div className="ch-wrap ch-hero-body">
        <nav aria-label="مسیر" className="ch-crumb">
          <Link href="/">خانه</Link><span aria-hidden>/</span>
          <Link href="/coaches">مربیان</Link><span aria-hidden>/</span>
          <span aria-current="page">{name}</span>
        </nav>

        <div className="ch-hero-row">
          {/* بزرگ‌نمایی فقط وقتی عکسِ واقعی هست — دکمه‌ای که حرفِ اولِ
              نام را باز کند، وعده‌ی توخالی است. */}
          {photo && onOpenPhoto
            ? <button type="button" className="ch-avatar" onClick={() => onOpenPhoto(photo)}
                aria-label="بزرگ‌نمایی عکس پروفایل">{avatar}</button>
            : <div className="ch-avatar">{avatar}</div>}

          <div className="ch-hero-id">
            <p className="ch-eyebrow">PROFESSIONAL COACH</p>
            <h1 className="ch-name">
              {name}{verified && <VerifiedBadge size={22} title="مربی تأیید شده" />}
            </h1>

            <ul className="ch-chips">
              {grade && (
                <li className="ch-chip ch-chip-grade">
                  <span dir="auto" className="ch-iso">{grade.label}</span>
                  <span className="ch-dots" aria-hidden>
                    {Array.from({ length: 5 }, (_, i) => (
                      <i key={i} data-on={i < grade.dots ? '1' : undefined} />
                    ))}
                  </span>
                </li>
              )}
              {disciplines.map(d => (
                <li key={d.label} className="ch-chip">{d.label}</li>
              ))}
            </ul>

            <p className="ch-meta">
              <MapPin size={13} aria-hidden />{city || '—'}
              {sinceYear && <><span className="ch-sep" aria-hidden />از سال {toFaDigits(sinceYear)}</>}
            </p>
          </div>

          {(phone || whatsapp) && (
            <div className="ch-cta">
              {phone && (
                <a href={`tel:${phone}`} className="ch-btn ch-btn-gold">
                  <Phone size={15} aria-hidden />تماس با مربی
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="ch-btn ch-btn-ghost">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z" />
                  </svg>
                  واتساپ
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
