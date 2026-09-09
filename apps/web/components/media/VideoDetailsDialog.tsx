'use client'

/* ─────────────────────────────────────────────────────────────
   مشخصات ویدیو پیش از انتشار — مثل صفحه‌ی «Details» یوتیوب.

   ── چرا هست ──
   تا امروز عنوان ویدیو *نام فایل* بود و همان به بیلیارد مدیا
   می‌رفت. یعنی کلیپی با محتوای عالی زیر نام
   «screen record 04-14-2026» می‌نشست: برای بیننده بی‌معنا و برای
   گوگل بی‌ارزش. عنوان مهم‌ترین سیگنال جست‌وجو برای ویدیوست و
   نباید از نام فایل بیاید.

   ── فرق عمدی با یوتیوب ──
   یوتیوب فایل را همان لحظه‌ی انتخاب بالا می‌فرستد و فرم را حین
   آپلود نشان می‌دهد. این‌جا برعکس: اول فرم، بعد آپلود. مخاطب ما
   روی شبکه‌ی موبایل ایران است و سقف فایل ۲۵ مگابایت — اگر کاربر
   وسط فرم پشیمان شود، نباید حجمش رفته باشد.

   ⚠️ منطق خالص (اعتبارسنجی عنوان، تایپ) در `lib/media/video-details`
   است، نه این‌جا: هفت صفحه‌ی نقش هم به آن نیاز دارند و نباید برای یک
   تابع رشته‌ای یک کامپوننت React ایمپورت کنند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Clapperboard, Check, Loader2 } from 'lucide-react'
import { MEDIA_CATEGORIES } from '@/lib/media-data'
import { toFaDigits } from '@/lib/jalali'
import { titleFromFile, weakTitle, type VideoDetail } from '@/lib/media/video-details'
import './video-details.css'

/** یک ردیف فرم: یا فایلی که تازه انتخاب شده، یا ویدیویی که از قبل
 *  منتشر شده و فقط مشخصاتش عوض می‌شود. */
export interface DetailTarget {
  /** چیزی که زیر پیش‌نمایش نوشته می‌شود (نام فایل یا عنوان فعلی) */
  name: string
  /** فقط در حالت آپلود — برای ساختن پیش‌نمایش محلی */
  file?: File
  /** فقط در حالت ویرایش — بندانگشتی ویدیوی منتشرشده */
  poster?: string
}

function DetailRow({ i, target, preview, needCat, value, err, showErr, onChange, inputRef }: {
  i: number
  target: DetailTarget
  preview: string
  needCat: boolean
  value: VideoDetail
  err: string
  showErr: boolean
  onChange: (patch: Partial<VideoDetail>) => void
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const eid = `vd-e-${i}`
  const bad = showErr && !!err
  return (
    <section className="vd-item">
      <div className="vd-head">
        {target.poster
          ? <img className="vd-prev" src={target.poster} alt="" loading="lazy" decoding="async" />
          : <video className="vd-prev" src={preview} muted playsInline preload="metadata" aria-hidden />}
        {/* ⚠️ در ویرایش این‌جا عنوان *فارسی* فعلی می‌نشیند؛ `dir="ltr"`
            و فونت لاتین همان چیزی است که قاعده‌ی RTL منعش می‌کند. */}
        {target.file
          ? <span className="vd-file bh-latin" dir="ltr" title={target.name}>{target.name}</span>
          : <span className="vd-file" title={target.name}>{target.name}</span>}
      </div>

      <label className="cg-lab" htmlFor={`vd-t-${i}`}>عنوان</label>
      <input id={`vd-t-${i}`} className="cg-in" value={value.title} maxLength={100} ref={inputRef}
        aria-invalid={bad} aria-describedby={bad ? eid : undefined}
        placeholder="مثلا: آموزش ضربه‌ی کشویی برای مبتدی‌ها"
        onChange={e => onChange({ title: e.target.value.slice(0, 100) })} />

      <label className="cg-lab" htmlFor={`vd-c-${i}`}>دسته‌بندی</label>
      <div className="vd-selwrap">
        <select id={`vd-c-${i}`} className="cg-in vd-sel" value={value.category}
          aria-invalid={showErr && needCat && !value.category}
          onChange={e => onChange({ category: e.target.value })}>
          <option value="">{needCat ? 'انتخاب کنید…' : 'بدون تغییر'}</option>
          {MEDIA_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      <label className="cg-lab" htmlFor={`vd-d-${i}`}>توضیح (اختیاری)</label>
      <textarea id={`vd-d-${i}`} className="cg-in vd-area" value={value.description} rows={2} maxLength={600}
        placeholder="در این ویدیو چه چیزی نشان می‌دهید؟ چند جمله به دیده‌شدنش کمک می‌کند."
        onChange={e => onChange({ description: e.target.value.slice(0, 600) })} />

      {bad && <p id={eid} role="alert" className="cg-err">{err}</p>}
    </section>
  )
}

export default function VideoDetailsDialog({
  targets, initial, mode = 'create', busy = false, error = '', onDone, onSkip, onClose,
}: {
  targets: DetailTarget[]
  /** ذخیره در جریان است — دکمه باید حالت لودینگ داشته باشد */
  busy?: boolean
  /** خطای ذخیره — پنجره باز می‌ماند تا نوشته‌ی کاربر از دست نرود */
  error?: string
  /** مقدار اولیه — در حالت ویرایش، مشخصات فعلی ویدیو */
  initial?: VideoDetail[]
  /** `create` = پیش از آپلود · `edit` = ویدیوی منتشرشده */
  mode?: 'create' | 'edit'
  /** کاربر مشخصات را داد — به ترتیب همان `targets` */
  onDone: (d: VideoDetail[]) => void
  /** «فقط در گالری بماند» — عنوان نوشته‌شده می‌ماند، فقط منتشر نمی‌شود */
  onSkip?: (d: VideoDetail[]) => void
  /** انصراف */
  onClose: () => void
}) {
  const [items, setItems] = useState<VideoDetail[]>(() =>
    targets.map((tg, i) => initial?.[i]
      ?? { title: titleFromFile(tg.name), category: '', description: '', publish: true }))
  /* ⚠️ عنوان پیش‌پر برای دقیقا همان فایل‌هایی که هدف این قابلیت‌اند
     از اول نامعتبر است. اگر خطا را تا اولین تایپ پنهان کنیم، کاربر یک
     دکمه‌ی طلایی مرده می‌بیند بی‌آنکه بداند چرا. */
  const [touched, setTouched] = useState(() =>
    targets.some((tg, i) => !!weakTitle(initial?.[i]?.title ?? titleFromFile(tg.name))))
  const [previews, setPreviews] = useState<string[]>([])
  const boxRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)

  /* ⚠️ ساختن blob در بدنه‌ی رندر عارضه‌ی جانبی است و رندر دورریخته
     (StrictMode) نشتی می‌ساخت. در افکت ساخته و همان‌جا آزاد می‌شود. */
  useEffect(() => {
    const urls = targets.map(tg => (tg.file ? URL.createObjectURL(tg.file) : ''))
    setPreviews(urls)
    return () => urls.forEach(u => { if (u) URL.revokeObjectURL(u) })
  }, [targets])

  /* ⚠️ افکت فوکوس نباید به *هویت* کالبک وابسته باشد. `onClose` در
     والد یک آروی درجاست، پس هر رندر والد افکت را از نو می‌دواند و
     `focus() + select()` دوباره اجرا می‌شود: مکان‌نما از فیلدی که
     کاربر در آن تایپ می‌کند بیرون می‌پرد و عنوان تمام‌انتخاب می‌شود —
     یعنی نویسه‌ی بعدی همه‌اش را پاک می‌کند. صفحه‌ی باشگاه اسلایدشو
     دارد و هر ۴٫۵ ثانیه رندر می‌شود؛ یعنی هر ۴٫۵ ثانیه. */
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return }
      if (e.key !== 'Tab' || !boxRef.current) return
      const f = boxRef.current.querySelectorAll<HTMLElement>('button,input,textarea,select')
      if (!f.length) return
      const first = f[0]!, last = f[f.length - 1]!
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    const lock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstRef.current?.focus()
    firstRef.current?.select()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = lock; prev?.focus() }
  }, [])

  const set = useCallback((i: number, patch: Partial<VideoDetail>) => {
    setTouched(true)
    setItems(list => list.map((it, k) => (k === i ? { ...it, ...patch } : it)))
  }, [])

  /* ⚠️ در ویرایش، دسته‌بندی فعلی در دسترس ما نیست؛ اجباری‌کردنش
     یعنی کاربر مجبور شود چیزی را که نمی‌بیند دوباره انتخاب کند و هر
     تغییر نام، دسته‌بندی درست را بی‌صدا عوض کند. */
  const needCat = mode === 'create'
  const errs = items.map(it => weakTitle(it.title) || (!needCat || it.category ? '' : 'دسته‌بندی را انتخاب کنید'))
  const ready = errs.every(e => !e)

  /* ⚠️ عنوان نوشته‌شده حتی وقتی منتشر نمی‌شود باید بماند. نسخه‌ی اول
     در مسیر «فقط گالری» عنوان را از نو از نام فایل می‌ساخت — یعنی
     همان چیزی که این قابلیت برای حذفش آمده. */
  const kept = (publish: boolean) => items.map((it, i) => ({
    ...it, publish,
    title: it.title.trim() || titleFromFile(targets[i]!.name),
  }))

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="cg-back vd-back" role="presentation" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={boxRef} className="cg-box vd-box" role="dialog" aria-modal="true" aria-labelledby="vd-title">
        <button type="button" className="cg-x" onClick={onClose} disabled={busy} aria-label="بستن">
          <X size={17} />
        </button>

        <span className="cg-icon" aria-hidden><Clapperboard size={20} /></span>
        <h2 id="vd-title" className="cg-title">
          {mode === 'edit' ? 'ویرایش مشخصات ویدیو'
            : targets.length === 1 ? 'مشخصات ویدیو' : `مشخصات ${toFaDigits(targets.length)} ویدیو`}
        </h2>
        <p className="cg-sub">
          {mode === 'edit'
            ? 'عنوان تازه هم در گالری و هم در بیلیارد مدیا می‌نشیند. نشانی قبلی هم کار می‌کند.'
            : 'عنوان همان چیزی است که بیننده و گوگل می‌بینند. نام فایل عنوان نیست.'}
        </p>

        <form onSubmit={e => { e.preventDefault(); if (ready && !busy) onDone(kept(true)) }}>
          <div className="vd-list">
            {items.map((it, i) => (
              <DetailRow key={i} i={i} target={targets[i]!} preview={previews[i] ?? ''}
                needCat={needCat}
                value={it} err={errs[i] ?? ''} showErr={touched}
                onChange={patch => set(i, patch)}
                inputRef={i === 0 ? firstRef : undefined} />
            ))}
          </div>

          {error && <p role="alert" className="cg-err">{error}</p>}

          <div className="cg-actions">
            <button type="submit" className="cg-go" disabled={!ready || busy}>
              {busy
                ? <><Loader2 size={15} className="vd-spin" aria-hidden /> در حال ذخیره…</>
                : <><Check size={15} aria-hidden /> {mode === 'edit' ? 'ذخیره‌ی تغییرات' : 'بارگذاری و انتشار'}</>}
            </button>
          </div>
        </form>

        {onSkip && (
          <button type="button" className="cg-skip" onClick={() => onSkip(kept(false))}>
            بدون انتشار در مدیا — فقط در گالری بماند
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
