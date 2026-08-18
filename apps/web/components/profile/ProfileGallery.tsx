'use client'

/* ─────────────────────────────────────────────────────────────
   گالریِ پروفایل (مربی و داور) — شبکه‌ی ادیتوریال، نه بندانگشتی.

   ── چه چیزی عوض شد ──
   نسخه‌ی قبلی شش ستونِ مربعِ ۷۱ پیکسلی بود؛ با دو عکس، دو تمبرِ کوچک
   کنارِ یک کارتِ خالی دیده می‌شد. حالا شبکه یکنواخت است و خانه‌ها
   کوچک — «نمونه‌کار»، نه دیوارِ عکس.

   ── تبِ «آلبوم‌ها» ──
   ⚠️ یک‌بار حذف شد و حالا برگشته — ولی نه به آن شکل. نسخه‌ی قدیمی
   یک `albums: {id, name, imageIds[]}` بود که فقط در `useState` این
   صفحه زندگی می‌کرد: هیچ مسیرِ ذخیره‌ای نداشت و می‌توانست به عکسِ
   حذف‌شده اشاره کند. حالا آلبوم فقط یک *نام روی خودِ رسانه* است
   (`media.album`)، پس گروه‌بندی از داده‌ی واقعی درمی‌آید، آلبومِ
   یتیم ممکن نیست، و پنل هم همان یک فیلد را می‌نویسد.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Images, Clapperboard, FolderOpen, ArrowRight, Plus, Loader2 } from 'lucide-react'
import ProfileVideoCard from '../ProfileVideoCard'
import { useTabKeys } from '@/hooks/use-tab-keys'
import { toFaDigits } from '@/lib/jalali'

export interface GalleryImage { id: string; url: string; caption: string; album?: string }
export interface GalleryVideo { id: string; url?: string; thumbnail: string; title: string; duration: string; album?: string }

const TABS = ['photos', 'videos', 'albums'] as const
type Tab = typeof TABS[number]

export default function ProfileGallery({
  images, videos, onOpenImage,
  canEdit = false, busy = false, onAddImages, onAddVideo, onNewAlbum,
}: {
  images: GalleryImage[]
  videos: GalleryVideo[]
  /** کلِ فهرست + اندیس، تا داخلِ نما بشود بعدی/قبلی رفت */
  onOpenImage: (urls: string[], index: number, meta: { title: string; alt: string }) => void
  /* ── ویرایشِ درجا ──
     فقط صاحبِ پروفایل این‌ها را می‌گیرد؛ نبودنشان یعنی دکمه‌ی «+»
     اصلاً رندر نشود. با این‌ها لازم نیست برای یک عکس تا داشبورد
     برود و برگردد. */
  canEdit?: boolean
  busy?: boolean
  onAddImages?: (files: FileList) => void | Promise<void>
  onAddVideo?: () => void | Promise<void>
  onNewAlbum?: () => void | Promise<void>
}) {
  /* ── آلبوم‌ها از خودِ رسانه‌ها ساخته می‌شوند ── */
  const albums = useMemo(() => {
    const map = new Map<string, { name: string; images: GalleryImage[]; videos: GalleryVideo[] }>()
    const put = (name: string) => {
      const key = name.trim()
      if (!map.has(key)) map.set(key, { name: key, images: [], videos: [] })
      return map.get(key)!
    }
    for (const g of images) { const n = (g.album ?? '').trim(); if (n) put(n).images.push(g) }
    for (const v of videos) { const n = (v.album ?? '').trim(); if (n) put(n).videos.push(v) }
    return [...map.values()]
  }, [images, videos])

  const [tab, setTab] = useState<Tab>(images.length === 0 && videos.length > 0 ? 'videos' : 'photos')
  const [openAlbum, setOpenAlbum] = useState<string | null>(null)

  /* ── چرا تبِ پیش‌فرض یک‌بار حساب‌شدن کافی نیست ──
     صفحه اول از `localStorage` پر می‌شود و پاسخِ سرور یک تیک بعد
     می‌رسد. اگر نسخه‌ی محلی خالی باشد، مقدارِ اولیه «تصاویر» می‌ماند
     و بازدیدکننده پنلِ خالی می‌بیند درحالی‌که مربی فقط ویدیو دارد.
     `picked` نگه می‌دارد که کاربر خودش تبی انتخاب کرده یا نه — بعد از
     انتخابِ او دیگر چیزی زیرِ دستش عوض نمی‌شود. */
  const fileRef = useRef<HTMLInputElement>(null)
  const picked = useRef(false)
  const choose = useCallback((k: Tab) => { picked.current = true; setOpenAlbum(null); setTab(k) }, [])

  useEffect(() => {
    if (picked.current) return
    if (images.length === 0 && videos.length > 0) setTab('videos')
    else if (videos.length === 0 && images.length > 0) setTab('photos')
  }, [images.length, videos.length])

  /* `choose` داده می‌شود نه `setTab`: با `setTab` انتخابِ کیبوردی ثبت
     نمی‌شد و افکتِ بالا می‌توانست تبِ کاربر را پس بگیرد. */
  const onTabKey = useTabKeys(TABS, tab, choose, 'chtab-')

  const cell = (g: GalleryImage, list: GalleryImage[], i: number) => (
    <button key={g.id} type="button" className="ch-gal-cell"
      onClick={() => onOpenImage(list.map(x => x.url), i, { title: g.caption || 'تصویر', alt: g.caption || 'تصویر گالری' })}>
      {/* عنوان جای دیگری است: `alt` و عنوانِ نمای تمام‌صفحه.
          نوارِ روی خانه‌ی ۱۱۶ پیکسلی نصفِ تصویر را می‌پوشاند. */}
      <img src={g.url} alt={g.caption || 'تصویر گالری'} loading="lazy" decoding="async" />
    </button>
  )

  /* ── «+» یک خانه است، نه دکمه‌ای بیرونِ باکس ──
     هم‌اندازه‌ی بقیه‌ی خانه‌ها و همیشه اولِ شبکه. برچسبِ متنی ندارد
     چون تبِ فعال خودش می‌گوید چه چیزی اضافه می‌شود؛ نامِ دسترس‌پذیر
     را `aria-label` می‌دهد. */
  const addTile = (label: string, onClick: () => void, cls = 'ch-gal-cell') => (
    <button type="button" className={`${cls} ch-add-tile`} onClick={onClick}
      disabled={busy} aria-label={label} title={label}>
      {busy ? <Loader2 size={22} className="ch-spin" aria-hidden /> : <Plus size={26} aria-hidden />}
    </button>
  )

  const empty = (icon: React.ReactNode, text: string) => (
    <div className="ch-gal-empty">{icon}<p>{text}</p></div>
  )

  const current = openAlbum ? albums.find(a => a.name === openAlbum) ?? null : null

  return (
    <section aria-labelledby="ch-gallery-h">
      <div className="ch-sec-head">
        <h2 id="ch-gallery-h">گالری</h2>
        <span className="en">GALLERY</span>
        <span className="rule" aria-hidden />
      </div>

      <div className="lq-seg ch-gal-tabs" role="tablist" aria-label="بخش‌های گالری" onKeyDown={onTabKey}>
        {([['photos', 'تصاویر', images.length], ['videos', 'ویدیوها', videos.length], ['albums', 'آلبوم‌ها', albums.length]] as const).map(([k, label, n]) => (
          <button key={k} type="button" role="tab" id={`chtab-${k}`}
            aria-selected={tab === k} aria-controls={`chpanel-${k}`} tabIndex={tab === k ? 0 : -1}
            onClick={() => choose(k)}>
            {label}{n > 0 && <span className="ch-gal-n">{toFaDigits(n)}</span>}
          </button>
        ))}
      </div>

      {/* ورودیِ فایل بیرون از شبکه می‌ماند — پنهان است و جا نمی‌گیرد */}
      {canEdit && (
        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={e => { if (e.target.files?.length) void onAddImages?.(e.target.files); e.target.value = '' }} />
      )}

      {/* هر سه پنل همیشه در DOM‌اند و غیرفعال `hidden` می‌گیرد:
          `aria-controls` نباید به شناسه‌ای اشاره کند که وجود ندارد. */}
      <div id="chpanel-photos" role="tabpanel" aria-labelledby="chtab-photos" hidden={tab !== 'photos'}>
        {images.length === 0 && !canEdit
          ? empty(<Images size={30} aria-hidden />, 'هنوز تصویری اضافه نشده است.')
          : (
            <div className="ch-gal-grid">
              {canEdit && addTile('افزودن تصویر', () => fileRef.current?.click())}
              {images.map((g, i) => cell(g, images, i))}
            </div>
          )}
      </div>

      <div id="chpanel-videos" role="tabpanel" aria-labelledby="chtab-videos" hidden={tab !== 'videos'}>
        {videos.length === 0 && !canEdit
          ? empty(<Clapperboard size={30} aria-hidden />, 'هنوز ویدیویی اضافه نشده است.')
          : (
            <div className="ch-vid-grid">
              {canEdit && addTile('افزودن ویدیو', () => void onAddVideo?.(), 'ch-vid-add')}
              {videos.map(v => <ProfileVideoCard key={v.id} v={v} />)}
            </div>
          )}
      </div>

      <div id="chpanel-albums" role="tabpanel" aria-labelledby="chtab-albums" hidden={tab !== 'albums'}>
        {albums.length === 0 && !canEdit ? (
          empty(<FolderOpen size={30} aria-hidden />, 'هنوز آلبومی ساخته نشده است.')
        ) : current ? (
          <>
            <div className="ch-alb-head">
              <button type="button" className="ch-alb-back" onClick={() => setOpenAlbum(null)}>
                <ArrowRight size={15} aria-hidden />همه‌ی آلبوم‌ها
              </button>
              <h3>{current.name}</h3>
            </div>
            {current.images.length > 0 && (
              <div className="ch-gal-grid">{current.images.map((g, i) => cell(g, current.images, i))}</div>
            )}
            {current.videos.length > 0 && (
              <div className="ch-vid-grid" style={{ marginTop: current.images.length ? 12 : 0 }}>
                {current.videos.map(v => <ProfileVideoCard key={v.id} v={v} />)}
              </div>
            )}
          </>
        ) : (
          <div className="ch-alb-grid">
            {canEdit && addTile('آلبوم تازه', () => void onNewAlbum?.(), 'ch-alb')}
            {albums.map(a => {
              const cover = a.images[0]?.url ?? a.videos[0]?.thumbnail
              const n = a.images.length + a.videos.length
              return (
                <button key={a.name} type="button" className="ch-alb" onClick={() => setOpenAlbum(a.name)}>
                  <span className="ch-alb-cover">
                    {cover
                      ? <img src={cover} alt="" loading="lazy" decoding="async" />
                      : <FolderOpen size={22} aria-hidden />}
                  </span>
                  <span className="ch-alb-meta">
                    <span className="ch-alb-name">{a.name}</span>
                    <span className="ch-alb-n">{toFaDigits(n)} مورد</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
