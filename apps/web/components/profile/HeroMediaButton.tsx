'use client'

/* ─────────────────────────────────────────────────────────────
   دکمه‌ی دوربینِ هدر — تعویض و حذفِ عکسِ پروفایل یا کاور.

   ── چرا منو و نه فقط یک دکمه ──
   نسخه‌ی اول فقط فایل‌پیکر را باز می‌کرد: صاحبِ پروفایل می‌توانست
   عکس را عوض کند ولی راهی برای *برداشتنش* نداشت. یک دکمه‌ی سطلِ
   دوم کنارِ دوربین، گوشه‌ی هدر را شلوغ می‌کرد و روی دایره‌ی آواتار
   اصلا جا نمی‌شد. پس همان الگوی هر اپِ موبایلی: دوربین را بزن،
   «تغییر» یا «حذف» را انتخاب کن.

   ⚠️ تا وقتی عکسی نیست، منویی هم در کار نیست — کلیک مستقیم
   فایل‌پیکر را باز می‌کند. منویی که تنها گزینه‌ی معنادارش یکی است،
   فقط یک کلیکِ اضافه است.

   ── چرا پرتال ──
   `.ch-hero` مقدار `overflow: hidden` دارد و دکمه‌ی آواتار ته
   هیرو می‌نشیند؛ منوی معمولی از لبه‌ی پایین بریده می‌شد. پرتال روی
   `body` با مختصاتِ گرفته‌شده از خودِ دکمه، از هر قابِ برنده‌ای
   مستقل است.

   ⚠️ این فایل خودش `profile-page.css` را وارد می‌کند. بدونِ آن،
   `.ch-file` وجود ندارد و ورودیِ فایلِ بومی **دیده می‌شود** — و
   دکمه هم بی‌اندازه و بی‌جا رندر می‌شود. تا امروز آن شیت را فقط
   صفحه‌ها وارد می‌کردند و همین یک‌بار در پیش‌نمایش گیرمان انداخت.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { ask } from '@/lib/ui/dialogs'
import './profile-page.css'

export interface HeroMediaButtonProps {
  /** جایگاه — همان دو حالتی که CSS برایشان قاعده دارد */
  variant: 'cover' | 'avatar'
  /** عکسی هست که بشود حذفش کرد */
  hasImage: boolean
  /** آپلود یا حذفِ قبلی هنوز تمام نشده */
  busy?: boolean
  onPick: (file: File) => void | Promise<void>
  /** نبودنش یعنی فقط تعویض، بدونِ گزینه‌ی حذف */
  onRemove?: () => void | Promise<void>
  /** «عکس پروفایل» یا «تصویر پس‌زمینه» */
  noun: string
  /** متنِ تأییدِ حذف */
  removeBody: string
}

/* ⚠️ مختصات **فیزیکی**، نه منطقی. نسخه‌ی اول فاصله را از لبه‌ی
   راستِ صفحه می‌سنجید و روی `inset-inline-end` می‌گذاشت — که در
   RTL یعنی چپ. نتیجه: منو از لبه‌ی راست بیرون می‌زد و بریده
   می‌شد. اندازه‌گیری و خاصیت باید یک زبان حرف بزنند. */
interface Anchor { top: number; right: number; flip: boolean; ready: boolean }

const GAP = 8
const EDGE = 8

export default function HeroMediaButton({
  variant, hasImage, busy, onPick, onRemove, noun, removeBody,
}: HeroMediaButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)

  const hasMenu = hasImage && !!onRemove
  const close = () => setAnchor(null)
  /* بستن و برگرداندنِ فوکوس به خودِ دکمه — وگرنه هر مسیری جز
     Escape کاربرِ کیبورد را روی `body` رها می‌کرد. */
  const closeAndReturn = () => { close(); btnRef.current?.focus() }

  /* ⚠️ `value` پاک می‌شود وگرنه انتخابِ دوباره‌ی *همان* فایل رویداد
     change نمی‌دهد و کاربر فکر می‌کند دکمه خراب است. */
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void onPick(f)
  }

  const openPicker = () => { closeAndReturn(); fileRef.current?.click() }

  const removeNow = async () => {
    if (!onRemove) return
    /* فوکوس پیش از باز شدنِ پنجره‌ی تأیید برمی‌گردد سرِ دکمه: پنجره‌ی
       `ask` خودش فوکوس را داخل نمی‌برد، پس اگر این‌جا رها شود کاربر
       با فوکوسِ روی `body` می‌ماند. */
    closeAndReturn()
    /* حذف برگشت‌ناپذیر است و از روی صفحه‌ی عمومی انجام می‌شود، پس
       مثل هر حذفِ دیگرِ این پروژه یک تأیید می‌گیرد. */
    if (!(await ask(`${noun} حذف شود؟`, { body: removeBody, confirmLabel: 'حذف' }))) return
    await onRemove()
  }

  const toggle = () => {
    if (!hasMenu) { fileRef.current?.click(); return }
    if (anchor) { closeAndReturn(); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    /* جای موقت؛ اندازه‌ی واقعیِ منو در useLayoutEffect سنجیده و
       مهار می‌شود. تا آن لحظه منو نامرئی است. */
    setAnchor({ top: r.bottom + GAP, right: EDGE, flip: false, ready: false })
  }

  /* ── مهارِ لبه‌ها با اندازه‌ی *واقعی* ──
     ⚠️ نسخه‌ی قبلی عرض و ارتفاع را حدس می‌زد (۲۰۸×۱۰۰). عرضِ منو
     محتوامحور است، پس با اسمِ بلندتر یا فونتِ بزرگ‌ترِ کاربر از حدس
     رد می‌شد و روی ۳۷۵ پیکسل از صفحه بیرون می‌زد. حالا اندازه
     خوانده می‌شود، نه فرض. */
  useLayoutEffect(() => {
    if (!anchor || anchor.ready) return
    const m = menuRef.current
    const r = btnRef.current?.getBoundingClientRect()
    if (!m || !r) return
    const box = m.getBoundingClientRect()
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    /* لبه‌ی راستِ منو روی لبه‌ی راستِ دکمه می‌نشیند (در RTL یعنی
       ابتدای خط)، ولی از هیچ‌کدام از دو لبه بیرون نمی‌زند. */
    const right = Math.min(Math.max(vw - r.right, EDGE), Math.max(EDGE, vw - box.width - EDGE))
    /* اگر پایین جا نیست، بالای دکمه باز شود — دکمه‌ی آواتار ته
       هیروست و روی صفحه‌ی کوتاه، منو زیرِ لبه می‌افتاد. */
    const flip = r.bottom + GAP + box.height > vh && r.top - GAP - box.height > EDGE
    setAnchor({ top: flip ? r.top - GAP - box.height : r.bottom + GAP, right, flip, ready: true })
  }, [anchor])

  /* بستن با Escape، اشاره‌ی بیرون، اسکرول و تغییرِ اندازه — منوی
     لنگرانداخته به مختصاتِ لحظه‌ی باز شدن، با اسکرول جا می‌ماند. */
  useEffect(() => {
    if (!anchor) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAndReturn() }
    /* `pointerdown` نه `mousedown`: لمس و قلم را هم می‌گیرد */
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) close()
    }
    /* Tab از آخرین گزینه به صفحه‌ی پشت می‌رفت و منو باز می‌ماند */
    const onFocusOut = () => {
      window.setTimeout(() => {
        const a = document.activeElement
        if (a && !menuRef.current?.contains(a) && !btnRef.current?.contains(a)) close()
      }, 0)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('focusout', onFocusOut)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor])

  /* فوکوس فقط پس از جاگیریِ نهایی می‌رود داخل، وگرنه مرورگر صفحه
     را به سمتِ جای موقتِ منو می‌لغزاند. */
  useEffect(() => {
    if (anchor?.ready) menuRef.current?.querySelector<HTMLElement>('button')?.focus()
  }, [anchor?.ready])

  const label = !hasImage ? `افزودن ${noun}` : hasMenu ? `تغییر یا حذف ${noun}` : `تغییر ${noun}`

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="ch-file"
        onChange={onFile} tabIndex={-1} aria-hidden />
      <button ref={btnRef} type="button" className={`ch-cam ch-cam--${variant}`}
        onClick={toggle} disabled={busy}
        aria-haspopup={hasMenu ? true : undefined}
        aria-expanded={hasMenu ? !!anchor : undefined}
        aria-label={label}>
        {busy ? <Loader2 size={variant === 'avatar' ? 15 : 16} className="ch-spin" aria-hidden />
          : <Camera size={variant === 'avatar' ? 15 : 16} aria-hidden />}
      </button>

      {/* ⚠️ عمدا `role="menu"` ندارد: آن نقش قراردادِ کاملِ کیبوردِ
          منوی ARIA را وعده می‌دهد (کلیدهای جهت، tabindexِ چرخشی،
          گزینه‌هایی که خودشان توقفگاهِ Tab نیستند). برای دو دکمه‌ی
          ساده، یک «disclosure»ِ برچسب‌دار هم درست است هم صادق. */}
      {anchor && createPortal(
        <div ref={menuRef} className="ch-cam-menu" aria-label={label}
          data-flip={anchor.flip ? '1' : undefined}
          style={{ top: anchor.top, right: anchor.right, visibility: anchor.ready ? undefined : 'hidden' }}>
          <button type="button" onClick={openPicker}>
            <ImagePlus size={15} aria-hidden />تغییر {noun}
          </button>
          <button type="button" className="ch-cam-menu-danger" onClick={() => void removeNow()}>
            <Trash2 size={15} aria-hidden />حذف {noun}
          </button>
        </div>,
        document.body,
      )}
    </>
  )
}
