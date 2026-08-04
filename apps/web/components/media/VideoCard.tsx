'use client'

import Link from 'next/link'
import { Eye, Play } from 'lucide-react'
import { mediaCategoryOf, compactViews, type MediaVideo, type MediaCategoryKey } from '../../lib/media-data'

/* ─────────────────────────────────────────────────────────────
   کارتِ ویدیو.

   ساختارش همان چیزی است که هر کاربری از پلتفرم‌های ویدیو می‌شناسد —
   بندانگشتیِ بزرگ، مدت روی گوشه، عنوان، سازنده، بازدید — چون آشناییِ
   الگو خودش بخشی از کاربردپذیری است. ولی هیچ‌چیزِ ظاهری قرض گرفته
   نشده: پس‌زمینه‌ی روشن، طلاییِ برند، گوشه‌های نرم و تایپوگرافیِ
   فارسیِ همین سایت.

   ── دو تصمیمِ کوچک که layout را نجات می‌دهند ──
   · نسبتِ ۱۶:۹ روی *قاب* قفل است، نه روی عکس. بندانگشتی با هر ابعادی
     که باشد `object-fit: cover` می‌شود؛ بدونِ آن، یک عکسِ عمودی کلِ
     شبکه را به‌هم می‌ریزد.
   · عنوان دو خط بیشتر نمی‌شود. کارت‌های هم‌ردیف باید هم‌قد بمانند.
   ───────────────────────────────────────────────────────────── */

export default function VideoCard({ v, priority = false }: { v: MediaVideo; priority?: boolean }) {
  const cat = mediaCategoryOf(v.category as MediaCategoryKey)
  return (
    <Link href={`/media/${encodeURIComponent(v.id)}`} className="bh-vc" aria-label={v.title}>
      <div className="bh-vc-tn">
        {v.thumb
          ? <img src={v.thumb} alt="" loading={priority ? 'eager' : 'lazy'}
              decoding="async" fetchPriority={priority ? 'high' : 'auto'} />
          : <span className="bh-vc-noimg"><Play size={20} /></span>}
        {v.duration && <span className="bh-vc-dur">{v.duration}</span>}
        <span className="bh-vc-play"><Play size={17} /></span>
      </div>

      <div className="bh-vc-body">
        <h3 className="bh-vc-title">{v.title}</h3>
        <div className="bh-vc-meta">
          <span className="bh-vc-creator">{v.creator.name}</span>
          {v.views > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="bh-vc-views"><Eye size={11} /> {compactViews(v.views)}</span>
            </>
          )}
        </div>
        {cat && (
          <span className="bh-vc-cat">
            <i style={{ background: cat.dot }} aria-hidden="true" />{cat.label}
          </span>
        )}
      </div>
    </Link>
  )
}
