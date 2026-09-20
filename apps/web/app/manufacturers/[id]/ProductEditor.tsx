'use client'

/* ─────────────────────────────────────────────────────────────
   افزودن و ویرایشِ محصولِ تولیدی — از روی خودِ صفحه‌ی تولیدکننده.

   ── چرا این‌جا و نه در پنل ──
   تا امروز محصول فقط از /dashboard/manufacturer اضافه می‌شد: آپلود،
   ذخیره، برگشتن به صفحه‌ی عمومی برای دیدنِ نتیجه. حالا همان‌جا که
   گالری عکس و ویدیو اضافه می‌شود، محصول هم اضافه می‌شود — با همان
   دکمه‌ی +، و فقط صاحبِ پروفایل آن را می‌بیند.

   ⚠️ «فقط مالک می‌بیند» تصمیمِ نمایش است نه مجوز: مسیرِ ذخیره روی
   سرور دوباره مالکیت را می‌سنجد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Images, Trash2 } from 'lucide-react'
import { compressImage } from '../../../lib/seller-store'
import { faNum } from '../../sellers/[id]/shared'
import { MAX_PRODUCT_IMAGES, productImages, type MfrProduct } from '../../../lib/manufacturers-data'
import './product-editor.css'

const rid = () => Math.random().toString(36).slice(2, 9)
const MAX_SPECS = 20
/* فایلِ خام — جلوی HEICِ آیفون را پیش از رمزگشایی می‌گیرد */
const MAX_FILE_BYTES = 8 * 1024 * 1024
/* رشته‌ی نهایی، با حاشیه‌ای زیرِ سقفِ ۳ مگابایتیِ `checkProfileData` */
const MAX_DATA_URL = 2_400_000

export interface ProductEditorProps {
  /** محصولِ موجود برای ویرایش؛ نبودنش یعنی «محصول تازه» */
  product?: MfrProduct | null
  busy?: boolean
  /* خطای ذخیره از صفحه — پنجره خودش از نتیجه‌ی سرور خبر ندارد */
  error?: string
  onSave: (p: MfrProduct) => void | Promise<void>
  onClose: () => void
}

export default function ProductEditor({ product, busy = false, error = '', onSave, onClose }: ProductEditorProps) {
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [specs, setSpecs] = useState((product?.specs ?? []).join('\n'))
  const [images, setImages] = useState<string[]>(product ? productImages(product) : [])
  const [err, setErr] = useState('')
  const [reading, setReading] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  /* فراخوان در هر رندر تابعِ تازه می‌سازد؛ در ref که باشد، افکتِ
     mount یک‌بار اجرا می‌شود و فوکوس را نمی‌دزدد. */
  const closeFn = useRef(onClose)
  closeFn.current = onClose

  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => { setHost(document.body) }, [])

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeFn.current(); return } // خودِ صفحه هنگام ذخیره جلویش را می‌گیرد
      if (e.key !== 'Tab') return
      const box = boxRef.current
      if (!box) return
      const items = box.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type="file"]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!items.length) return
      const first = items[0]!
      const last = items[items.length - 1]!
      const act = document.activeElement
      if (e.shiftKey && (act === first || !box.contains(act))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      returnTo?.focus?.()
    }
  }, [])

  /* ── افزودن عکس ──
     ⚠️ سقف روی *مجموع* است نه روی هر انتخاب: کاربر می‌تواند چند بار
     انتخاب کند و بدونِ این، یازدهمی هم می‌نشست.

     ⚠️ مهارِ اندازه اجباری است: `compressImage` وقتی مرورگر نتواند
     فایل را رمزگشایی کند — HEIC مستقیم از آیفون، PNGِ ۱۶ بیتی —
     همان دیتا-یوآرالِ *فشرده‌نشده* را برمی‌گرداند. یک فایلِ ۵
     مگابایتی می‌شود ~۶٫۸ مگابایت base64 و از سقفِ ۳ مگابایتیِ هر
     رشته در `checkProfileData` رد می‌شود؛ آن‌وقت کلِ ذخیره‌ی
     پروفایل با ۴۰۰ برمی‌گردد. جلوی همان‌جا گرفته می‌شود که کاربر
     می‌تواند کاری بکند. */
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    const room = MAX_PRODUCT_IMAGES - images.length
    if (room <= 0) { setErr(`حداکثر ${faNum(MAX_PRODUCT_IMAGES)} عکس`); return }
    setReading(true); setErr('')
    try {
      const next: string[] = []
      let tooBig = 0
      for (const f of files.slice(0, room)) {
        if (f.size > MAX_FILE_BYTES) { tooBig++; continue }
        const url = await compressImage(f, 1200, 0.72)
        if (url.length > MAX_DATA_URL) { tooBig++; continue }
        next.push(url)
      }
      if (next.length) setImages(prev => [...prev, ...next].slice(0, MAX_PRODUCT_IMAGES))
      if (tooBig) setErr(`${faNum(tooBig)} عکس بیش از حد بزرگ بود و اضافه نشد. عکس کوچک‌تری انتخاب کنید.`)
      else if (files.length > room) setErr(`فقط ${faNum(room)} عکس جا داشت؛ بقیه اضافه نشد.`)
    } catch {
      setErr('عکس خوانده نشد.')
    } finally {
      setReading(false)
    }
  }

  const submit = () => {
    if (!name.trim()) { setErr('نام محصول لازم است.'); return }
    if (!category.trim()) { setErr('دسته‌ی محصول لازم است.'); return }
    const list = specs.split('\n').map(s => s.trim()).filter(Boolean).slice(0, MAX_SPECS)
    void onSave({
      id: product?.id ?? rid(),
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      specs: list,
      /* `image` برای سازگاری با ردیف‌های قدیمی می‌ماند و همیشه
         عکسِ نخست است؛ `images` منبعِ واقعی. */
      image: images[0] ?? '',
      images,
      ...(product?.badge ? { badge: product.badge } : {}),
    })
  }

  if (!host) return null

  return createPortal((
    <div
      className="pedit" role="dialog" aria-modal="true" aria-labelledby="pedit-h"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="pedit-box" ref={boxRef}>
        <div className="pedit-head">
          <h2 id="pedit-h">{product ? 'ویرایش محصول' : 'افزودن محصول'}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="بستن"><X size={18} aria-hidden /></button>
        </div>

        <div className="pedit-body">
          <label>
            <span>نام محصول *</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: میز اسنوکر ۱۲ فوت" />
          </label>
          <label>
            <span>دسته *</span>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="مثال: میز اسنوکر" />
          </label>
          <label className="pedit-wide">
            <span>توضیحات</span>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="هرچه خریدار باید درباره‌ی این محصول بداند…" rows={5}
            />
          </label>
          <label className="pedit-wide">
            <span>مشخصات (هر خط یک مورد)</span>
            <textarea
              value={specs} onChange={e => setSpecs(e.target.value)} rows={5}
              placeholder={'ابعاد: ۱۲ فوت\nجنس بدنه: چوب راش\nسنگ: ۳۰ میلی‌متر ایتالیایی'}
            />
          </label>

          <div className="pedit-wide">
            <span className="pedit-lbl">عکس‌ها — تا {faNum(MAX_PRODUCT_IMAGES)} تصویر</span>
            <div className="pedit-imgs">
              {images.map((src, i) => (
                <div key={`${i}-${src.slice(-24)}`} className="pedit-img">
                  <img src={src} alt="" />
                  {i === 0 && <span className="pedit-cover">جلد</span>}
                  <button
                    type="button" aria-label={`حذف تصویر ${i + 1}`}
                    onClick={() => setImages(prev => prev.filter((_, x) => x !== i))}
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </div>
              ))}
              {images.length < MAX_PRODUCT_IMAGES && (
                <button type="button" className="pedit-add" onClick={() => fileRef.current?.click()} disabled={reading || busy}>
                  <Images size={17} aria-hidden />
                  <span>{reading ? 'در حال خواندن…' : 'افزودن عکس'}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden tabIndex={-1} aria-hidden="true" onChange={pick} />
          </div>
        </div>

        {(err || error) && <p role="alert" className="pedit-err">{err || error}</p>}

        <div className="pedit-foot">
          <button type="button" className="pedit-save" onClick={submit} disabled={busy || reading}>
            {busy ? 'در حال ذخیره…' : product ? 'ذخیره‌ی تغییرات' : 'افزودن محصول'}
          </button>
          <button type="button" className="pedit-cancel" onClick={onClose} disabled={busy}>انصراف</button>
        </div>
      </div>
    </div>
  ), host)
}
