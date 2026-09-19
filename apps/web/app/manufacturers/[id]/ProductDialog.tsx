'use client'

/* ─────────────────────────────────────────────────────────────
   جزئیاتِ یک محصولِ تولیدی.

   ── چرا پنجره و نه صفحه‌ی جدا ──
   این‌ها آگهیِ بازار نیستند؛ کاتالوگِ تولیدی‌اند و داخلِ خودِ
   پروفایل ذخیره می‌شوند، پس نشانیِ عمومیِ `/shop/[id]` ندارند.
   تا امروز کارت‌ها اصلا باز نمی‌شدند: بازدیدکننده عکس و نام را
   می‌دید و `description` و بقیه‌ی `specs` هیچ‌جا دیده نمی‌شدند.

   ── چه چیزی این‌جا نیست ──
   قیمت و دکمه‌ی خرید. محصولِ کاتالوگ قیمت ندارد؛ راهِ ادامه، تماس
   با خودِ تولیدکننده است و همان دکمه پایین می‌نشیند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { MfrProduct } from '../../../lib/manufacturers-data'
import './product-dialog.css'

export interface ProductDialogProps {
  product: MfrProduct
  /** نامِ تولیدکننده — عنوانِ فرعیِ پنجره */
  maker: string
  /** شماره‌ی آماده‌ی شماره‌گیری، با کدِ شهر */
  telHref?: string
  telText?: string
  onClose: () => void
}

export default function ProductDialog({ product, maker, telHref, telText, onClose }: ProductDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  /* ⚠️ `onClose` را در ref نگه می‌داریم: فراخوان آن را در هر رندر از
     نو می‌سازد و اگر وابستگیِ افکت باشد، هر رندرِ صفحه (رسیدنِ
     آگهی‌ها، تغییرِ وضعیتِ ویرایش، …) دوباره فوکوس را می‌دزدد و
     پنجره‌ی اسکرول‌شده را به بالا برمی‌گرداند. */
  const closeFn = useRef(onClose)
  closeFn.current = onClose

  /* پرتال لازم است چون نوارِ بالای سایت `position: fixed` با
     z-index ۲۰۰ است؛ پنجره‌ای که داخلِ درختِ صفحه بماند زیرِ آن
     می‌افتد و روی موبایل دکمه‌ی بستن اصلا کلیک‌پذیر نیست. */
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => { setHost(document.body) }, [])

  /* Escape ببندد، تا پنجره باز است صفحه‌ی پشت اسکرول نشود، و Tab از
     پنجره بیرون نرود. فوکوسِ قبلی هم موقعِ بسته‌شدن برمی‌گردد —
     وگرنه کاربرِ کیبورد جایش را در گریدِ محصولات گم می‌کند. */
  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeFn.current(); return }
      if (e.key !== 'Tab') return
      const box = boxRef.current
      if (!box) return
      const items = box.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (items.length === 0) return
      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement
      if (e.shiftKey && (active === first || !box.contains(active))) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus()
      }
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

  if (!host) return null

  return createPortal((
    <div
      className="pdlg"
      role="dialog" aria-modal="true" aria-labelledby="pdlg-name"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="pdlg-box" ref={boxRef}>
        <button ref={closeRef} type="button" className="pdlg-x" onClick={onClose} aria-label="بستن">
          <X size={18} aria-hidden />
        </button>

        <div className="pdlg-media">
          {product.image
            ? <img src={product.image} alt={product.name} decoding="async" />
            : <span className="pdlg-noimg">بدون تصویر</span>}
          {product.badge && <span className="pdlg-badge">{product.badge}</span>}
        </div>

        <div className="pdlg-body">
          {product.category && <span className="pdlg-cat">{product.category}</span>}
          <h2 id="pdlg-name" className="pdlg-name">{product.name}</h2>
          <p className="pdlg-maker">ساختِ {maker}</p>

          {product.description && <p className="pdlg-desc">{product.description}</p>}

          {product.specs.length > 0 && (
            <>
              <h3 className="pdlg-h3">مشخصات</h3>
              <ul className="pdlg-specs">
                {product.specs.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}

          {telHref && (
            <a className="pdlg-cta" href={`tel:${telHref}`}>
              استعلام و سفارش
              {telText && <span dir="ltr" className="pdlg-tel">{telText}</span>}
            </a>
          )}
        </div>
      </div>
    </div>
  ), host)
}
