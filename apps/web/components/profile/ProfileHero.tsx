/* ─────────────────────────────────────────────────────────────
   هیروی پروفایلِ نقش‌های حرفه‌ای — تیره، سینمایی، ادیتوریال.

   ── چرا مشترک است ──
   برای صفحه‌ی مربی نوشته شد و بعد صفحه‌ی داور هم
   دقیقاً همین را خواست. کپیِ دوم یعنی دو طرحی که از فردا آرام از هم
   دور می‌شوند؛ پس همان‌جا که یکی بود، یکی ماند. تنها تفاوتِ دو نقش
   `roleGlyph` و رنگِ پوسترِ پیش‌فرض است.

   ── چه چیزی عمداً این‌جا نیست ──
   امتیاز، تعدادِ شاگرد، ستاره. هیچ‌کدام داده‌ی واقعی ندارند و عددِ
   ساختگی روی پروفایلِ یک آدمِ واقعی، جعلِ اعتبار است.

   برچسبِ «PROFESSIONAL COACH» هم برداشته شد: عنوانِ ثابتی که برای
   همه یکی بود و چیزی درباره‌ی این آدم نمی‌گفت.

   ── چرا دکمه‌های تماس این‌جا نیستند ──
   تماس و واتساپ از هیرو برداشته شدند. راه‌های ارتباطی جای خودشان را
   در ستونِ کناری دارند و تکرارشان روی کاور، هیرو را از «معرفیِ یک
   آدم» به «نوارِ دکمه» تبدیل می‌کرد.
   ───────────────────────────────────────────────────────────── */

'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Check, Link2 as LinkIcon } from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'
import CoverPoster from './CoverPoster'
import RoleGlyph, { type RoleGlyphKind } from './RoleGlyph'
import { toFaDigits } from '@/lib/jalali'
import { keepLatinProps } from '@/lib/text-fa'

export interface ProfileHeroProps {
  name: string
  /** نامِ لاتین برای متنِ توخالیِ پس‌زمینه — نبودنش یعنی کشیده نشود */
  nameLatin?: string
  city: string
  sinceYear?: string
  photo?: string
  cover?: string
  verified: boolean
  /** برچسبِ درجه و تعدادِ نقطه‌ها — از `badgeFromGrades` */
  grade?: { label: string; dots: number }
  /** چیپِ رشته‌ها. خنثی است: تنها تأکیدِ رنگیِ هیرو، طلاییِ درجه است. */
  disciplines: { label: string }[]
  /** بزرگ‌نماییِ عکسِ پروفایل — نبودنش یعنی آواتار کلیک‌شدنی نباشد */
  onOpenPhoto?: (url: string) => void
  /** نقشِ صاحبِ پروفایل: نشانِ جای‌گزینِ آواتار و رنگِ پوستر */
  role: RoleGlyphKind
  /** مسیرِ بردکرامب: [نشانی، برچسب] */
  backHref: string
  backLabel: string
  /** آدرسِ اختصاصی — روی هیرو هم دیده و کپی می‌شود */
  publicUrl: string
}

export default function ProfileHero({
  name, nameLatin, city, sinceYear, photo, cover, verified,
  grade, disciplines, onOpenPhoto,
  role, backHref, backLabel, publicUrl,
}: ProfileHeroProps) {
  /* ── آدرسِ اختصاصی روی هیرو ──
     همان چیزی که در ستونِ کناری هست، این‌بار جایی که بازدیدکننده
     اول نگاه می‌کند. کپی همان‌جا انجام می‌شود تا کسی مجبور نباشد
     تا پایینِ صفحه اسکرول کند. */
  const [copied, setCopied] = useState(false)
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (tRef.current) clearTimeout(tRef.current) }, [])
  const copy = async () => {
    try { await navigator.clipboard.writeText(`https://${publicUrl}`) } catch { /* اجازه نبود */ }
    setCopied(true)
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(() => setCopied(false), 1800)
  }
  /* نبودِ عکس دیگر یک حرفِ تنها نیست */
  const avatar = photo
    ? <img src={photo} alt={`عکس ${name}`} loading="eager" decoding="async" />
    : <RoleGlyph kind={role} />

  /* نام به «همه‌چیز جز واژه‌ی آخر» و «واژه‌ی آخر» تقسیم می‌شود تا
     فقط دومی به تیک بچسبد — دلیلش پایینِ همین فایل. */
  const parts = name.trim().split(/\s+/)
  const tail  = parts.pop() ?? name
  const head  = parts.join(' ')

  return (
    <header className="ch-hero">
      {/* کاورِ واقعی اگر هست، وگرنه پوسترِ ساخته‌شده — نه عکسِ قرضیِ
          یک میزِ اسنوکرِ اتفاقی که روی پروفایلِ همه می‌نشست. */}
      {cover
        ? <div className="ch-hero-img" style={{ backgroundImage: `url(${cover})` }} />
        : <CoverPoster tone={role} />}
      <div className="ch-hero-scrim" data-poster={cover ? undefined : '1'} />
      {nameLatin && <div className="ch-hero-ghost" aria-hidden>{nameLatin}</div>}

      <div className="ch-wrap ch-hero-body">
        <nav aria-label="مسیر" className="ch-crumb">
          <Link href="/">خانه</Link><span aria-hidden>/</span>
          <Link href={backHref}>{backLabel}</Link><span aria-hidden>/</span>
          <span aria-current="page">{name}</span>
        </nav>

        <div className="ch-hero-row">
          {/* بزرگ‌نمایی فقط وقتی عکسِ واقعی هست — دکمه‌ای که یک نشانِ
              پیش‌فرض را باز کند، وعده‌ی توخالی است. */}
          {photo && onOpenPhoto
            ? <button type="button" className="ch-avatar" onClick={() => onOpenPhoto(photo)}
                aria-label="بزرگ‌نمایی عکس پروفایل">{avatar}</button>
            : <div className="ch-avatar" data-glyph={photo ? undefined : '1'}>{avatar}</div>}

          <div className="ch-hero-id">
            {/* ── تیک چسبیده به نام ──
                ⚠️ اول کلِ نام در یک `nowrap` بود. آن نسخه تیک را کنارِ
                نام نگه می‌داشت ولی نامِ بلند را — چون هیرو `overflow:
                hidden` است — می‌بُرید، و در RTL اولین چیزی که از لبه
                بیرون می‌افتاد خودِ تیک بود. حالا فقط *آخرین واژه* به
                تیک چسبیده است: نام آزادانه می‌شکند و تیک هرگز تنها
                نمی‌ماند.
                اندازه و فاصله اینلاین داده می‌شود نه با کلاس: خودِ
                `VerifiedBadge` استایلِ اینلاین می‌گذارد و کلاس در
                برابرش می‌بازد. */}
            <h1 className="ch-name">
              {head && <>{head} </>}
              <span className="ch-name-tail">
                {tail}
                {verified && (
                  <VerifiedBadge
                    title={`${role === 'coach' ? 'مربی' : 'داور'} تأیید شده`}
                    style={{ width: '0.56em', height: '0.56em', marginInlineStart: '0.16em', verticalAlign: '-0.06em' }}
                  />
                )}
              </span>
            </h1>

            <ul className="ch-chips">
              {grade && (
                <li className="ch-chip ch-chip-grade">
                  {/* برچسبِ درجه می‌تواند تماماً لاتین باشد
                      (`ACBS Gold Referee`). بدونِ این، IRANSansX آن را
                      faux-bold می‌کند — همان تله‌ای که پنلِ ادمین از
                      قبل با همین هلپر دورش زده بود. */}
                  <span dir="auto" {...keepLatinProps(grade.label, 'ch-iso')}>{grade.label}</span>
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

            <button type="button" onClick={copy} className="ch-addr"
              aria-label={copied ? 'آدرس اختصاصی کپی شد' : 'کپی آدرس اختصاصی'}>
              {copied ? <Check size={13} aria-hidden /> : <LinkIcon size={13} aria-hidden />}
              <code dir="ltr">{publicUrl}</code>
              <span className="ch-addr-act">{copied ? 'کپی شد' : 'کپی'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}
