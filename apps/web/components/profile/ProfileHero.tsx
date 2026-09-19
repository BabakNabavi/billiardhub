/* ─────────────────────────────────────────────────────────────
   هیروی پروفایل نقش‌های حرفه‌ای — تیره، سینمایی، ادیتوریال.

   ── چرا مشترک است ──
   برای صفحه‌ی مربی نوشته شد و بعد صفحه‌ی داور هم
   دقیقا همین را خواست. کپی دوم یعنی دو طرحی که از فردا آرام از هم
   دور می‌شوند؛ پس همان‌جا که یکی بود، یکی ماند. تنها تفاوت دو نقش
   `roleGlyph` و رنگ پوستر پیش‌فرض است.

   ── چه چیزی عمدا این‌جا نیست ──
   امتیاز، تعداد شاگرد، ستاره. هیچ‌کدام داده‌ی واقعی ندارند و عدد
   ساختگی روی پروفایل یک آدم واقعی، جعل اعتبار است.

   برچسب «PROFESSIONAL COACH» هم برداشته شد: عنوان ثابتی که برای
   همه یکی بود و چیزی درباره‌ی این آدم نمی‌گفت.

   ── چرا دکمه‌های تماس این‌جا نیستند ──
   تماس و واتساپ از هیرو برداشته شدند. راه‌های ارتباطی جای خودشان را
   در ستون کناری دارند و تکرارشان روی کاور، هیرو را از «معرفی یک
   آدم» به «نوار دکمه» تبدیل می‌کرد.
   ───────────────────────────────────────────────────────────── */

'use client'
import { Fragment, useEffect, useState } from 'react'
import { useCopyUrl } from '@/hooks/use-copy-url'
import Link from 'next/link'
import { MapPin, Check, Link2 as LinkIcon } from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'
import CoverPoster from './CoverPoster'
import RoleGlyph, { type RoleGlyphKind } from './RoleGlyph'
import { toFaDigits } from '@/lib/jalali'
import { keepLatinProps } from '@/lib/text-fa'

/* ── نردبانِ عرضِ هر پوستر ──
   ⚠️ هیچ پله‌ای بالاتر از رزولوشنِ بومیِ فایل نباشد: پله‌ی ناموجود
   یعنی ۴۰۴ و هدرِ سیاهِ خالی، و پله‌ی بزرگ‌تر از منبع یعنی تحویلِ
   پیکسلِ ساختگی با هزینه‌ی بایت. هر پوسترِ تازه باید این‌جا ثبت شود. */
export type PosterBase = 'coach' | 'referee'

const POSTER_SIZES: Record<PosterBase, { wide: readonly number[]; tall: readonly number[] }> = {
  coach:   { wide: [768, 1024, 1264, 1920], tall: [480, 640, 848, 1170] },
  /* منبعِ پوسترِ داور خودش ۱۲۶۴×۸۴۸ است؛ پله‌ی بالاتر پیکسلِ
     ساختگی می‌شد، پس نردبان این‌جا تمام می‌شود. */
  referee: { wide: [768, 1024, 1264],       tall: [480, 640, 848] },
}

export interface ProfileHeroProps {
  name: string
  /** نام لاتین برای متن توخالی پس‌زمینه — نبودنش یعنی کشیده نشود */
  nameLatin?: string
  city: string
  sinceYear?: string
  photo?: string
  cover?: string
  /* ── چند کاور به‌جای یکی ──
     فروشگاه می‌تواند چند بنر آپلود کند و نسخه‌ی قبلیِ هدرش آن‌ها را
     می‌چرخاند. با یک `cover` ثابت، بنرهای دوم به بعد بی‌صدا حذف
     می‌شدند. کمتر از دو تا یعنی همان مسیر تک‌کاور. */
  coverSlides?: readonly string[]
  /* ── حلقه‌ی استوری ──
     وقتی داده شود، حلقه‌ی طلاییِ آواتار جایش را به حلقه‌ی رنگیِ
     استوری می‌دهد و کلیک روی آواتار به‌جای بزرگ‌نمایی، استوری را
     باز می‌کند.
     ⚠️ بر `onOpenPhoto` مقدم است: یک آواتار دو کنش ندارد. حلقه‌ی
     رنگی استوری را وعده می‌دهد، پس همان باید باز شود. */
  story?: { onOpen: () => void; label?: string }
  verified: boolean
  /** برچسب درجه و تعداد نقطه‌ها — از `badgeFromGrades` */
  grade?: { label: string; dots: number }
  /** چیپ رشته‌ها. خنثی است: تنها تأکید رنگی هیرو، طلایی درجه است. */
  disciplines: { label: string }[]
  /** بزرگ‌نمایی عکس پروفایل — نبودنش یعنی آواتار کلیک‌شدنی نباشد */
  onOpenPhoto?: (url: string) => void
  /** نقش صاحب پروفایل: نشان جای‌گزین آواتار و رنگ پوستر */
  role: RoleGlyphKind
  /** مسیر بردکرامب: [نشانی، برچسب] */
  backHref: string
  backLabel: string
  /** آدرس اختصاصی — روی هیرو هم دیده و کپی می‌شود */
  publicUrl: string
  /* ⚠️ کنشِ اصلیِ صفحه داخلِ خودِ هدر. اختیاری است چون صفحه‌ی داور
     کنشی ندارد و نباید جای خالی بگیرد. */
  actions?: React.ReactNode
  /* ⚠️ آمار داخلِ خودِ هدر می‌نشیند — همان کاری که پروفایلِ راننده در
     F1 و پروفایلِ بازیکن در WST می‌کنند. نوارِ جدا زیرِ هدر، صفحه را
     دو تکه می‌کرد و هیچ‌کدام قوی نبود. */
  stats?: React.ReactNode
  /* نامِ پایه‌ی پوسترِ نقش، بدون عرض و پسوند. اگر ندهی، پوسترِ
     برداریِ ساخته‌شده رندر می‌شود. */
  posterBase?: PosterBase
  /* پوسترِ پیش‌فرضِ اختصاصیِ همین نقش — وقتی نه کاور هست نه
     `posterBase`. بدون این، همه‌ی نقش‌ها به `CoverPoster` می‌رسند و
     صحنه‌ی «سه توپ روی نمد» برای کارگاهِ تولیدی حرفی نمی‌زند. */
  posterNode?: React.ReactNode
}

/* عنوانِ تیکِ تأیید. پیش‌تر یک سه‌تایی بود («مربی» اگر coach وگرنه
   «داور»)، پس صفحه‌ی تولیدکننده و فروشگاه هم «داور تأیید شده»
   می‌گرفتند. */
const ROLE_LABEL: Record<RoleGlyphKind, string> = {
  coach: 'مربی',
  referee: 'داور',
  manufacturer: 'تولیدکننده',
  seller: 'فروشگاه',
}

const SLIDE_MS = 5200

/* ⚠️ نشانی از کاربر می‌آید (بنرِ آپلودشده). یک `)` یا `"` در نام
   فایل، اعلانِ CSS را می‌شکند و در بدترین حالت اجازه‌ی تزریق
   می‌دهد. نقل‌قول + کدگذاری، هر دو. */
function cssUrl(u: string): string {
  return `url("${encodeURI(u).replace(/["\\]/g, c => encodeURIComponent(c))}")`
}

export default function ProfileHero({
  name, nameLatin, city, sinceYear, photo, cover, coverSlides, story, verified,
  grade, disciplines, onOpenPhoto,
  role, backHref, backLabel, publicUrl, actions, stats, posterBase, posterNode,
}: ProfileHeroProps) {
  const sizes = posterBase ? POSTER_SIZES[posterBase] : POSTER_SIZES.coach

  /* ⚠️ شرط روی *وجودِ* عکس است نه روی «دو تا به بالا». نسخه‌ی اول
     `length > 1` می‌گرفت و فروشگاهی که فقط یک بنر دارد — یعنی
     حالتِ رایج — بنرش را از دست می‌داد و پوسترِ پیش‌فرض می‌گرفت.
     چیزی که به دو تا نیاز دارد چرخش است، نه نمایش. */
  const slides = coverSlides && coverSlides.length ? coverSlides : null
  /* ⚠️ کلیدِ محتوایی، نه شناسه‌ی آرایه: اگر فراخوان آرایه را داخلِ
     رندر بسازد (`.map()` یا لیترال)، وابستگیِ شناسه‌ای هر رندر
     تایمر را از نو می‌سازد و اسلاید هیچ‌وقت جلو نمی‌رود. */
  const slideKey = slides ? slides.join('|') : ''
  const [slide, setSlide] = useState(0)
  /* کاربر که خودش بنری را انتخاب کرد، چرخشِ خودکار می‌ایستد
     (WCAG 2.2.2: محتوای خودکارِ بیش از پنج ثانیه باید مکث داشته
     باشد). */
  const [pinned, setPinned] = useState(false)

  /* فهرست که عوض شد، نشانگر هم باید سر جای اول برگردد: وگرنه
     `slide` از انتهای فهرستِ تازه بیرون می‌ماند. */
  useEffect(() => { setSlide(0); setPinned(false) }, [slideKey])

  useEffect(() => {
    const n = slideKey ? slideKey.split('|').length : 0
    if (n < 2 || pinned) return
    /* بی‌حرکتی درخواستِ کاربر است نه سلیقه: بدون این، «محوشدنِ
       خاموش» به پرشِ ناگهانیِ هر ۵ ثانیه تبدیل می‌شد. */
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setSlide(s => (s + 1) % n), SLIDE_MS)
    return () => window.clearInterval(t)
  }, [slideKey, pinned])

  /* ⚠️ همین مقدارِ مهارشده هم به لایه‌ی روشن می‌رود هم به شرط‌های
     پایین: اگر لایه `slide` خام بگیرد و این `slide % n`، در فاصله‌ی
     کوتاه‌شدنِ فهرست هیچ لایه‌ای روشن نمی‌ماند و هدر سیاه می‌شود. */
  const active = slides ? slide % slides.length : 0
  /* ⚠️ شرط‌های پایین روی این می‌نشینند نه روی `cover` خام: وگرنه
     صفحه‌ای که فقط `coverSlides` می‌دهد، پرده‌ی «پوستر» را می‌گرفت
     و کاور واقعی زیرش گم می‌شد. */
  const coverUrl = slides ? slides[active] : cover
  /* ── آدرس اختصاصی روی هیرو ──
     همان چیزی که در ستون کناری هست، این‌بار جایی که بازدیدکننده
     اول نگاه می‌کند. کپی همان‌جا انجام می‌شود تا کسی مجبور نباشد
     تا پایین صفحه اسکرول کند. */
  /* ⚠️ نسخه‌ی قبلی `catch` را خالی می‌گذاشت و بعدش بی‌قیدوشرط
     `setCopied(true)` می‌زد: وقتی مرورگر اجازه نمی‌داد — سافاری
     بیرونِ ژستِ کاربر، مبدأِ ناامن، یا ردِ مجوز — کاربر ✓ «کپی شد»
     می‌دید در حالی که هیچ‌چیز کپی نشده بود. هوکِ مشترک سه حالت
     دارد و حالتِ شکست را هم اعلام می‌کند. */
  const { state: copyState, copy } = useCopyUrl('ch-hero-url', `https://${publicUrl}`)
  const copied = copyState === 'ok'
  /* نبود عکس دیگر یک حرف تنها نیست */
  const avatar = photo
    ? <img src={photo} alt={`عکس ${name}`} loading="eager" decoding="async" />
    : <RoleGlyph kind={role} />

  /* نام به «همه‌چیز جز واژه‌ی آخر» و «واژه‌ی آخر» تقسیم می‌شود تا
     فقط دومی به تیک بچسبد — دلیلش پایین همین فایل. */
  const parts = name.trim().split(/\s+/)
  const tail  = parts.pop() ?? name
  const head  = parts.join(' ')

  return (
    <header className={'ch-hero' + (!coverUrl && posterBase ? ' ch-hero--photo' : '')}>
      {/* کاور واقعی اگر هست، وگرنه پوستر ساخته‌شده — نه عکس قرضی
          یک میز اسنوکر اتفاقی که روی پروفایل همه می‌نشست. */}
      {slides
        ? slides.map((u, i) => (
            /* همه‌ی بنرها روی هم رندر می‌شوند و فقط شفافیتشان عوض
               می‌شود — محو نرم به‌جای پرشِ ناگهانیِ backgroundImage. */
            <Fragment key={u}>
              <div className="ch-hero-fill ch-hero-slide" data-on={i === active ? '1' : undefined}
                style={{ backgroundImage: cssUrl(u) }} />
              <div className="ch-hero-img ch-hero-slide" data-on={i === active ? '1' : undefined}
                style={{ backgroundImage: cssUrl(u) }} />
            </Fragment>
          ))
        : coverUrl
        ? <>
            <div className="ch-hero-fill" style={{ backgroundImage: cssUrl(coverUrl) }} />
            <div className="ch-hero-img" style={{ backgroundImage: cssUrl(coverUrl) }} />
          </>
        : posterBase
          ? (
            /* ⚠️ دو ترکیب: قابِ افقیِ دسکتاپ و قابِ عمودیِ موبایل. یک
               عکسِ افقی روی گوشی فقط یک نوارِ باریکِ میانی نشان می‌دهد.
               سوژه در هر دو سمتِ چپ است. ⚠️ سمتِ راست خودِ عکس تیره
               *نیست* — پارچه‌ی سبز تا لبه می‌آید؛ چیزی که متن را
               خوانا می‌کند توقفِ ۹۲٪ِ پرده است، نه خودِ قاب. پرده را
               به اعتمادِ «عکس آن‌جا تیره است» ضعیف نکن. */
            <picture>
              <source media="(max-width: 699px)" type="image/avif"
                srcSet={sizes.tall.map(w => `/images/coaches/${posterBase}-tall-${w}.avif ${w}w`).join(', ')} sizes="100vw" />
              <source media="(max-width: 699px)" type="image/webp"
                srcSet={sizes.tall.map(w => `/images/coaches/${posterBase}-tall-${w}.webp ${w}w`).join(', ')} sizes="100vw" />
              <source type="image/avif"
                srcSet={sizes.wide.map(w => `/images/coaches/${posterBase}-wide-${w}.avif ${w}w`).join(', ')} sizes="100vw" />
              <img className="ch-hero-photo" alt="" decoding="async" fetchPriority="high"
                src={`/images/coaches/${posterBase}-wide-1024.webp`}
                srcSet={sizes.wide.map(w => `/images/coaches/${posterBase}-wide-${w}.webp ${w}w`).join(', ')} sizes="100vw" />
            </picture>
          )
          : posterNode ?? <CoverPoster tone={role} />}
      <div className="ch-hero-scrim" data-poster={coverUrl ? undefined : '1'} data-photo={!coverUrl && posterBase ? '1' : undefined} />

      {/* نقطه‌های بنر — هم می‌گویند چند بنر هست، هم راهِ ایستاندنِ
          چرخشِ خودکارند. انتخابِ کاربر تایمر را خاموش می‌کند و
          دیگر روشن نمی‌شود. */}
      {slides && slides.length > 1 && (
        <div className="ch-hero-dots" role="group" aria-label="بنرهای صفحه">
          {slides.map((u, i) => (
            <button key={u} type="button"
              onClick={() => { setSlide(i); setPinned(true) }}
              aria-current={i === active ? 'true' : undefined}
              aria-label={`بنر ${toFaDigits(i + 1)} از ${toFaDigits(slides.length)}`}>
              <i aria-hidden />
            </button>
          ))}
        </div>
      )}
      {nameLatin && <div className="ch-hero-ghost" aria-hidden>{nameLatin}</div>}

      <div className="ch-wrap ch-hero-body">
        <nav aria-label="مسیر" className="ch-crumb">
          <Link href="/">خانه</Link><span aria-hidden>/</span>
          <Link href={backHref}>{backLabel}</Link><span aria-hidden>/</span>
          <span aria-current="page">{name}</span>
        </nav>

        <div className="ch-hero-row">
          {/* بزرگ‌نمایی فقط وقتی عکس واقعی هست — دکمه‌ای که یک نشان
              پیش‌فرض را باز کند، وعده‌ی توخالی است. */}
          {/* ⚠️ حلقه یک لایه‌ی جداست، نه `border` روی خودِ آواتار:
              گرادیانِ مخروطی را نمی‌شود روی border گذاشت، و اگر
              `background` خودِ دکمه شود، عکس رویش می‌افتد و حلقه
              دیده نمی‌شود. */}
          {/* استوری بر بزرگ‌نمایی مقدم است: وقتی استوری هست، کلیک
              روی آواتار همان چیزی را باز می‌کند که حلقه‌ی رنگی
              وعده‌اش را می‌دهد. */}
          <span className="ch-avatar-ring" data-story={story ? '1' : undefined}>
            {story
              ? <button type="button" className="ch-avatar" data-glyph={photo ? undefined : '1'}
                  onClick={story.onOpen} aria-label={story.label ?? 'مشاهده استوری'}>{avatar}</button>
              : photo && onOpenPhoto
              ? <button type="button" className="ch-avatar" onClick={() => onOpenPhoto(photo)}
                  aria-label="بزرگ‌نمایی عکس پروفایل">{avatar}</button>
              : <div className="ch-avatar" data-glyph={photo ? undefined : '1'}>{avatar}</div>}
          </span>

          <div className="ch-hero-id">
            {/* ── تیک چسبیده به نام ──
                ⚠️ اول کل نام در یک `nowrap` بود. آن نسخه تیک را کنار
                نام نگه می‌داشت ولی نام بلند را — چون هیرو `overflow:
                hidden` است — می‌برید، و در RTL اولین چیزی که از لبه
                بیرون می‌افتاد خود تیک بود. حالا فقط *آخرین واژه* به
                تیک چسبیده است: نام آزادانه می‌شکند و تیک هرگز تنها
                نمی‌ماند.
                اندازه و فاصله اینلاین داده می‌شود نه با کلاس: خود
                `VerifiedBadge` استایل اینلاین می‌گذارد و کلاس در
                برابرش می‌بازد. */}
            <h1 className="ch-name">
              {head && <>{head} </>}
              <span className="ch-name-tail">
                {tail}
                {verified && (
                  <VerifiedBadge
                    title={`${ROLE_LABEL[role]} تأیید شده`}
                    style={{ width: '0.56em', height: '0.56em', marginInlineStart: '0.16em', verticalAlign: '-0.06em' }}
                  />
                )}
              </span>
            </h1>

            <ul className="ch-chips">
              {grade && (
                <li className="ch-chip ch-chip-grade">
                  {/* برچسب درجه می‌تواند تماما لاتین باشد
                      (`ACBS Gold Referee`). بدون این، IRANSansX آن را
                      faux-bold می‌کند — همان تله‌ای که پنل ادمین از
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

            {/* ⚠️ متا و نامک یک ردیفِ روان شدند: قبلا سه بلوکِ جدا
                بودند و ارتفاعِ هدر را بی‌دلیل بالا می‌بردند. */}
            <div className="ch-hero-meta">
            <p className="ch-meta">
              <MapPin size={13} aria-hidden />{city || '—'}
              {/* ⚠️ شرط روی *وجودِ propِ دیگر* نباشد: با `!stats` روزی
                  که صفحه‌ی داور نوارِ آمار بگیرد، این خط بی‌صدا و
                  بدونِ هیچ تغییرِ کدی ناپدید می‌شد. تصمیم مالِ خودِ
                  فراخوان است — صفحه‌ی مربی `sinceYear` را اصلا
                  نمی‌فرستد چون در نوارِ آمارش هست. */}
              {sinceYear && <><span className="ch-sep" aria-hidden />از سال {toFaDigits(sinceYear)}</>}
            </p>

            <button type="button" onClick={copy} className="ch-addr"
              aria-label={copied ? `آدرس اختصاصی کپی شد: ${publicUrl}`
                : copyState === 'manual' ? `مرورگر اجازه‌ی کپی نداد؛ نشانی انتخاب شد: ${publicUrl}`
                : `کپی آدرس اختصاصی: ${publicUrl}`}>
              {copied ? <Check size={13} aria-hidden /> : <LinkIcon size={13} aria-hidden />}
              <code id="ch-hero-url" dir="ltr">{publicUrl}</code>
            </button>
            {/* ⚠️ حالتِ شکست باید شنیده شود، وگرنه دکمه بی‌صدا هیچ
                کاری نمی‌کند. */}
            </div>
            <span aria-live="polite" className="ch-sr-live">
              {copyState === 'ok' ? 'نشانی در کلیپ‌بورد کپی شد'
                : copyState === 'manual' ? 'مرورگر اجازه‌ی کپی نداد؛ نشانی انتخاب شد — با Ctrl+C بردارید' : ''}
            </span>

            {actions && <div className="ch-hero-act">{actions}</div>}
          </div>

        </div>

        {stats && <div className="ch-hero-stats">{stats}</div>}
      </div>
    </header>
  )
}
