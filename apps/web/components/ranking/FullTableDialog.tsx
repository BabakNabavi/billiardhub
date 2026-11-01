'use client'

/* ─────────────────────────────────────────────────────────────
   «نمایش جدول کلی» — فقط موبایل و تبلت (زیرِ ۱۰۲۴px).

   جدولِ کاملِ دسکتاپ را مثلِ یک عکس تمام‌صفحه نشان می‌دهد. پیش‌فرض
   «کل جدول در یک نگاه» است (هم‌عرضِ صفحه). یک ضربه روی تصویر آن را
   به اندازه‌ی واقعی می‌برد و دو جهت اسکرول می‌شود، و ضربه‌ی دوم
   برش می‌گرداند — همان رفتارِ نمایشگرِ عکس.

   `<dialog>`ِ بومی: فوکوس داخلِ پنجره می‌ماند و Esc می‌بندد. اسکرولِ
   صفحه‌ی پشت را iOS خودش قفل نمی‌کند، پس `overflow` بدنه بسته می‌شود.
   تصویر فقط وقتی پنجره باز است ساخته می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { Table2, X } from 'lucide-react'
import type { RankingPlayer, RankingStage } from '@/lib/rankings-store'
import { buttonClasses } from '@/components/ui/button-classes'
import { FULL_TABLE_W, FullTableSvg } from './FullTableSvg'

interface Props { title: string; stages: RankingStage[]; players: RankingPlayer[]; updatedLabel?: string }

export function FullTableDialog(props: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!ref.current?.open) ref.current?.showModal()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const close = () => ref.current?.close()

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
        className={buttonClasses({ size: 'lg', className: 'mt-6 w-full lg:hidden' })}>
        <Table2 size={18} aria-hidden /> نمایش جدول کلی
      </button>

      <dialog ref={ref} aria-label={props.title}
        /* `close` هم از دکمه می‌آید و هم از Esc — یک‌جا وضعیت برمی‌گردد */
        onClose={() => { setOpen(false); setZoom(false) }}
        className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-ink p-0 text-white backdrop:bg-black/70">
        {open && (
          <div className="flex h-full flex-col"
            /* نصب‌شده روی صفحه‌ی اصلی (standalone): زیرِ ناچ و نوارِ خانه نرود —
               در آیفونِ افقی ناچ کنار است، پس چپ و راست هم */
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-bold">{props.title}</p>
                <p className="m-0 text-xs text-white/60">{zoom ? 'برای دیدن کل جدول، دوباره روی آن بزنید' : 'برای بزرگ‌نمایی روی جدول بزنید'}</p>
              </div>
              <button type="button" onClick={close} aria-label="بستن جدول"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className={`min-h-0 flex-1 overscroll-contain ${zoom ? 'overflow-auto' : 'overflow-y-auto overflow-x-hidden'} px-3 pb-4`}>
              {/* برچسبِ ثابت + aria-pressed: برچسبِ عوض‌شونده کنارِ «انتخاب‌شده» دوگانه خوانده می‌شد */}
              <button type="button" onClick={() => setZoom(z => !z)} aria-pressed={zoom} aria-label="بزرگ‌نمایی"
                style={zoom ? { width: FULL_TABLE_W } : undefined}
                className={`block rounded-card border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${zoom ? 'max-w-none cursor-zoom-out' : 'w-full cursor-zoom-in'}`}>
                <FullTableSvg {...props} />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
