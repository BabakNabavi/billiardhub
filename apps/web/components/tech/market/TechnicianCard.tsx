'use client'

/* ─────────────────────────────────────────────────────────────
   کارتِ متخصص.

   ⚠️ کارتِ *اعتماد* است نه کارتِ محصول: باید در دو-سه ثانیه خوانده
   شود. پس حداکثر پنج قلم اطلاعات و بس.

   ── چه چیزی نشان داده می‌شود و چرا ──
   هر قلم فقط وقتی می‌آید که داده‌اش **واقعاً** وجود دارد:
   • امتیاز       ← ستون‌های `rating_avg`/`rating_count` روی
                     `profiles` (تریگرِ مهاجرتِ ۰۸۹). صفر یعنی
                     هیچ نظری ثبت نشده ⟵ اصلاً نمایش نمی‌دهیم.
   • تیکِ تأیید   ← ستونِ `verified`، فقط ادمین می‌دهد
   • اعزام/کارگاه ← `onsite` و `workshop` از خودِ پروفایل
   • شهر و تخصص   ← داده‌ی ثبت‌شده‌ی خودِ متخصص

   ⚠️ «قیمت از…»، «سال سابقه»، «زمانِ پاسخ» و «فاصله» این‌جا نیستند
   چون هیچ‌کدام ستونی در دیتابیس ندارند. عددِ ساختگی روی پروفایلِ یک
   آدمِ واقعی، جعلِ اعتبار است.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { MapPin, Star, Home, Wrench } from 'lucide-react'
import VerifiedBadge from '../../VerifiedBadge'
import { toFaDigits } from '@/lib/jalali'
import type { Technician } from '@/lib/technicians-data'

/** حداکثر تخصصی که روی کارت می‌آید — بقیه «+n» می‌شوند */
const MAX_CHIPS = 3

export interface TechnicianCardProps {
  tech: Technician
  /** میانگینِ امتیاز — فقط وقتی `ratingCount > 0` معنا دارد */
  ratingAvg?: number
  ratingCount?: number
}

export function TechnicianCard({ tech, ratingAvg = 0, ratingCount = 0 }: TechnicianCardProps) {
  const href = `/services/${tech.id}`
  const chips = tech.services.slice(0, MAX_CHIPS)
  const rest = tech.services.length - chips.length
  const hasCity = Boolean(tech.city && tech.city !== '—')

  return (
    <article className="tm-card">
      <span className="tm-ava" aria-hidden>
        {tech.photo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={tech.photo} alt="" loading="lazy" decoding="async" />
          : tech.name.slice(0, 1)}
      </span>

      <div className="tm-card-b">
        <h3 className="tm-card-name">
          {/* ⚠️ کلِ کارت لینک نیست: داخلش دو دکمه‌ی دیگر هست و لینکِ
              تودرتو در HTML نامعتبر است. لینک روی خودِ نام. */}
          <Link href={href}>{tech.name}</Link>
          {tech.verified && <VerifiedBadge title="متخصص تأیید شده" />}
        </h3>

        {tech.title && <p className="tm-card-title">{tech.title}</p>}

        <div className="tm-card-meta">
          {ratingCount > 0 && (
            <span className="tm-rate">
              <Star size={14} aria-hidden fill="currentColor" />
              {toFaDigits(ratingAvg.toFixed(1))}
              <small>({toFaDigits(String(ratingCount))} نظر)</small>
            </span>
          )}
          {hasCity && <span><MapPin size={13} aria-hidden />{tech.city}</span>}
          {tech.onsite && <span><Home size={13} aria-hidden />اعزام به محل</span>}
          {tech.workshop && <span><Wrench size={13} aria-hidden />پذیرش در کارگاه</span>}
        </div>

        {chips.length > 0 && (
          <ul className="tm-chips">
            {chips.map(s => <li key={s} className="tm-chip">{s}</li>)}
            {rest > 0 && (
              <li className="tm-chip tm-chip--more">+{toFaDigits(String(rest))}</li>
            )}
          </ul>
        )}
      </div>

      <div className="tm-card-act">
        <Link className="tm-btn tm-btn--outline tm-btn--sm" href={href}>مشاهده پروفایل</Link>
        {tech.phone && (
          <a className="tm-btn tm-btn--gold tm-btn--sm" href={`tel:${tech.phone}`}>درخواست خدمت</a>
        )}
      </div>
    </article>
  )
}

/** اسکلتِ بارگذاری — هم‌ارتفاعِ کارتِ واقعی تا صفحه نپرد */
export function TechnicianCardSkeleton() {
  return (
    <div className="tm-card tm-skel" aria-hidden>
      <span className="tm-ava tm-skel-b" />
      <div className="tm-card-b">
        <span className="tm-skel-b" style={{ inlineSize: '38%', blockSize: 16 }} />
        <span className="tm-skel-b" style={{ inlineSize: '58%', blockSize: 12 }} />
        <span className="tm-skel-b" style={{ inlineSize: '46%', blockSize: 12 }} />
      </div>
    </div>
  )
}
