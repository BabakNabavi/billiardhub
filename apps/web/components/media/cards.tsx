'use client'

/* ─────────────────────────────────────────────────────────────
   کارت‌های بیلیارد مدیا.

   سلسله‌مراتب هر کارت ثابت است و از آن تخطی نمی‌شود:
   ویدیو ⟵ عنوان ⟵ سازنده ⟵ متادیتا. هیچ نشان تزئینی، هیچ حاشیه،
   هیچ سایه.

   ⚠️ هر تکه‌ی متادیتا فقط وقتی رندر می‌شود که واقعا وجود داشته
   باشد: «۰ بازدید» نوشته نمی‌شود، مدت ثبت‌نشده جای خالی نمی‌گذارد،
   و تاریخ نامعلوم «—» نمی‌گیرد.
   ───────────────────────────────────────────────────────────── */

import { useState } from 'react'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { compactViews, type MediaVideo } from '../../lib/media-data'
import { ThumbsUp, MessageCircle, Eye } from 'lucide-react'
import { faDate, toFaDigits } from '../../lib/jalali'
import type { ShelfChannel } from '../../lib/media/shelf'

const href = (v: MediaVideo) => `/media/${encodeURIComponent(v.id)}`

/* ── بندانگشتی ──
   ⚠️ «نشانی دارد» با «بار می‌شود» یکی نیست: ویدیوهای زنده نشانی
   بندانگشتی ۴۰۴ داشتند و مرورگر آیکن عکس شکسته را روی کارت
   می‌گذاشت. `key` روی خود نشانی است تا با عوض‌شدن آن، پرچم شکست
   صفر شود. */
/* ⚠️ `sizes` برداشته شد: بدون `srcSet` هیچ اثری ندارد و فقط
   وانمود می‌کند تصویر واکنش‌گراست. بندانگشتی‌ها یک فایل ذخیره‌شده
   دارند و نسخه‌ی چندگانه‌شان کار لایه‌ی Storage است، نه این‌جا. */
export function Thumb({
  v, priority = false, progress,
}: { v: MediaVideo; priority?: boolean; progress?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="mx-tn">
      {v.thumb && !failed ? (
        <img
          key={v.thumb} src={v.thumb} alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async" onError={() => setFailed(true)}
        />
      ) : (
        <span className="mx-tn-none" aria-hidden><Play size={22} /></span>
      )}
      {v.duration && <span className="mx-dur">{v.duration}</span>}
      {progress != null && progress > 0 && (
        <span className="mx-prog" aria-hidden><i style={{ inlineSize: `${Math.round(progress * 100)}%` }} /></span>
      )}
    </div>
  )
}

const initial = (s: string) => (s || '؟').trim().charAt(0)

export function Avatar({ name, src }: { name: string; src?: string }) {
  return (
    <span className="mx-ava" aria-hidden>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : initial(name)}
    </span>
  )
}

/* متادیتای زیر عنوان — هر تکه فقط اگر واقعی باشد.

   ⚠️ صفر نمایش داده نمی‌شود. ویدیویی که کسی ندیده «۰ بازدید»
   نمی‌گیرد؛ جای خالی صادق‌تر از صفر است. */
export function SubMeta({ v }: { v: MediaVideo }) {
  const bits: React.ReactNode[] = []
  if (v.views > 0) bits.push(<><Eye size={12} aria-hidden /> {compactViews(v.views)}</>)
  if (v.likes > 0) bits.push(<><ThumbsUp size={12} aria-hidden /> {compactViews(v.likes)}</>)
  if (v.comments > 0) bits.push(<><MessageCircle size={12} aria-hidden /> {compactViews(v.comments)}</>)
  if (v.ts > 0) bits.push(faDate(new Date(v.ts)))
  if (bits.length === 0) return null
  return <div className="mx-sub">{bits.map((b, i) => <span key={i}>{b}</span>)}</div>
}

/* ═══ کارت استاندارد ویدیو ═══ */
export function VideoCard({
  v, priority = false, progress, flat = false,
}: { v: MediaVideo; priority?: boolean; progress?: number; flat?: boolean }) {
  return (
    <Link className="mx-card" href={href(v)}>
      <Thumb v={v} priority={priority} progress={progress} />
      <div className={`mx-card-b${flat ? ' mx-card-b--flat' : ''}`}>
        {!flat && <Avatar name={v.creator.name} />}
        <div>
          <h3 className="mx-ttl">{v.title}</h3>
          {v.creator.name && <div className="mx-by">{v.creator.name}</div>}
          <SubMeta v={v} />
        </div>
      </div>
    </Link>
  )
}

/* ═══ کارت فشرده (ریل «بعدی» و ستون کنار شاخص) ═══ */
export function MiniCard({ v, progress }: { v: MediaVideo; progress?: number }) {
  return (
    <Link className="mx-mini" href={href(v)}>
      <Thumb v={v} progress={progress} />
      <div>
        <h3>{v.title}</h3>
        {v.creator.name && <div className="mx-by">{v.creator.name}</div>}
        <SubMeta v={v} />
      </div>
    </Link>
  )
}

/* ═══ کارت Shorts ═══
   ⚠️ نسبت ۹:۱۶ و بدون آواتار: قفسه‌ی Shorts باید سریع اسکن شود،
   نه اینکه هر کارت پنج تکه متادیتا داشته باشد. */
/* ⚠️ همیشه لینک است، حتی وقتی نمایشگر عمودی باز می‌شود:
     · `<button>` نمی‌تواند `<h3>` در خود داشته باشد (مدل محتوا)
     · کارت دکمه‌ای نه ایندکس می‌شود، نه با کلیک وسط در تب تازه
       باز می‌شود، نه نشانی‌اش کپی‌شدنی است
   کلیک ساده جلوی ناوبری را می‌گیرد و نمایشگر را باز می‌کند؛ اگر
   جاوااسکریپت نبود، لینک به صفحه‌ی ویدیو می‌رود. */
export function ShortCard({ v, onOpen }: { v: MediaVideo; onOpen?: () => void }) {
  const inner = (
    <>
      <div className="mx-short-tn">
        {v.thumb
          ? <img src={v.thumb} alt="" loading="lazy" decoding="async" />
          : <span className="mx-tn-none" aria-hidden><Play size={20} /></span>}
      </div>
      <h3>{v.title}</h3>
      {v.views > 0 && <p>{compactViews(v.views)} بازدید</p>}
    </>
  )
  return (
    <Link
      className="mx-short" href={href(v)}
      onClick={onOpen ? e => { e.preventDefault(); onOpen() } : undefined}
    >
      {inner}
    </Link>
  )
}

/* ═══ کارت کانال ═══
   ⚠️ «دنبال‌کننده» نشان داده نمی‌شود چون جدولی برایش نیست. آنچه
   نشان داده می‌شود شمارش واقعی ویدیوهای منتشرشده است. */
export function ChannelCard({ c }: { c: ShelfChannel }) {
  return (
    <Link className="mx-chan" href={`/media/channel/${encodeURIComponent(c.handle)}`}>
      <Avatar name={c.name} src={c.poster || undefined} />
      <h3>{c.name}</h3>
      <p dir="ltr">@{c.handle}</p>
      <p>{toFaDigits(c.videoCount)} ویدیو</p>
    </Link>
  )
}

/* ═══ اسکلتون ═══ */
export function CardSkeleton() {
  return (
    <div aria-hidden>
      <div className="mx-sk mx-sk-tn" />
      <div className="mx-sk mx-sk-l mx-sk-l--w" />
      <div className="mx-sk mx-sk-l mx-sk-l--n" />
    </div>
  )
}

export function GridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="mx-grid">
      {Array.from({ length: n }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}
