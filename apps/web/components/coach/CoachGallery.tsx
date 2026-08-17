'use client'

/* ─────────────────────────────────────────────────────────────
   گالریِ پروفایل مربی — شبکه‌ی ادیتوریال، نه بندانگشتی.

   ── چه چیزی عوض شد ──
   نسخه‌ی قبلی شش ستونِ مربعِ ۷۱ پیکسلی بود؛ با دو عکس، دو تمبرِ کوچک
   کنارِ یک کارتِ خالی دیده می‌شد. حالا اولین تصویر بزرگ‌تر است و
   شبکه با تعدادِ واقعیِ عکس‌ها تنظیم می‌شود.

   ── تبِ «آلبوم‌ها» برداشته شد ──
   وضعیتش فقط در همین صفحه زندگی می‌کرد (`useState`) و هیچ مسیرِ
   ذخیره‌ای نداشت؛ پنلِ مربی اصلاً فیلدِ آلبوم ندارد. رابطی که کارش
   ذخیره نمی‌شود، قابلیت نیست.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Images, Clapperboard } from 'lucide-react'
import ProfileVideoCard from '../ProfileVideoCard'
import { useTabKeys } from '@/hooks/use-tab-keys'
import { toFaDigits } from '@/lib/jalali'

export interface GalleryImage { id: string; url: string; caption: string }
export interface GalleryVideo { id: string; url?: string; thumbnail: string; title: string; duration: string }

const TABS = ['photos', 'videos'] as const
type Tab = typeof TABS[number]

export default function CoachGallery({
  images, videos, onOpenImage,
}: {
  images: GalleryImage[]
  videos: GalleryVideo[]
  /** کلِ فهرست + اندیس، تا داخلِ نما بشود بعدی/قبلی رفت */
  onOpenImage: (urls: string[], index: number, meta: { title: string; alt: string }) => void
}) {
  const [tab, setTab] = useState<Tab>(images.length === 0 && videos.length > 0 ? 'videos' : 'photos')

  /* ── چرا تبِ پیش‌فرض یک‌بار حساب‌شدن کافی نیست ──
     صفحه اول از `localStorage` پر می‌شود و پاسخِ سرور یک تیک بعد
     می‌رسد. اگر نسخه‌ی محلی خالی باشد، مقدارِ اولیه «تصاویر» می‌ماند
     و بازدیدکننده پنلِ خالی می‌بیند درحالی‌که مربی فقط ویدیو دارد.
     `picked` نگه می‌دارد که کاربر خودش تبی انتخاب کرده یا نه — بعد از
     انتخابِ او دیگر چیزی زیرِ دستش عوض نمی‌شود. */
  const picked = useRef(false)
  const choose = useCallback((k: Tab) => { picked.current = true; setTab(k) }, [])

  useEffect(() => {
    if (picked.current) return
    if (images.length === 0 && videos.length > 0) setTab('videos')
    else if (videos.length === 0 && images.length > 0) setTab('photos')
  }, [images.length, videos.length])

  /* `choose` داده می‌شود نه `setTab`: با `setTab` انتخابِ کیبوردی ثبت
     نمی‌شد و افکتِ بالا می‌توانست تبِ کاربر را پس بگیرد. */
  const onTabKey = useTabKeys(TABS, tab, choose, 'chtab-')

  return (
    <section aria-labelledby="ch-gallery-h">
      <div className="ch-sec-head">
        <h2 id="ch-gallery-h">گالری</h2>
        <span className="en">GALLERY</span>
        <span className="rule" aria-hidden />
      </div>

      <div className="lq-seg ch-gal-tabs" role="tablist" aria-label="بخش‌های گالری" onKeyDown={onTabKey}>
        {([['photos', 'تصاویر', images.length], ['videos', 'ویدیوها', videos.length]] as const).map(([k, label, n]) => (
          <button key={k} type="button" role="tab" id={`chtab-${k}`}
            aria-selected={tab === k} aria-controls={`chpanel-${k}`} tabIndex={tab === k ? 0 : -1}
            onClick={() => choose(k)}>
            {label}{n > 0 && <span className="ch-gal-n">{toFaDigits(n)}</span>}
          </button>
        ))}
      </div>

      {/* هر دو پنل همیشه در DOM‌اند و غیرفعال `hidden` می‌گیرد:
          `aria-controls` نباید به شناسه‌ای اشاره کند که وجود ندارد. */}
      <div id="chpanel-photos" role="tabpanel" aria-labelledby="chtab-photos" hidden={tab !== 'photos'}>
        {images.length === 0 ? (
          <div className="ch-gal-empty">
            <Images size={30} aria-hidden />
            <p>هنوز تصویری اضافه نشده است.</p>
          </div>
        ) : (
          <div className="ch-gal-grid" data-few={images.length <= 4 ? '1' : undefined}>
            {images.map((g, i) => (
              <button key={g.id} type="button" className="ch-gal-cell" data-lead={i === 0 ? '1' : undefined}
                onClick={() => onOpenImage(images.map(x => x.url), i, { title: g.caption || 'تصویر', alt: g.caption || 'تصویر گالری' })}>
                <img src={g.url} alt={g.caption || 'تصویر گالری'} loading="lazy" decoding="async" />
                {g.caption && <span className="ch-gal-cap">{g.caption}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div id="chpanel-videos" role="tabpanel" aria-labelledby="chtab-videos" hidden={tab !== 'videos'}>
        {videos.length === 0 ? (
          <div className="ch-gal-empty">
            <Clapperboard size={30} aria-hidden />
            <p>هنوز ویدیویی اضافه نشده است.</p>
          </div>
        ) : (
          <div className="ch-vid-grid">
            {videos.map(v => <ProfileVideoCard key={v.id} v={v} />)}
          </div>
        )}
      </div>
    </section>
  )
}
