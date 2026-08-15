'use client'

/* ═══════════════════════════════════════════════════════════════
   اجزای مشترکِ فرمِ آگهی — منبعِ واحد.
   ───────────────────────────────────────────────────────────────
   این‌ها تا امروز فقط داخلِ `app/shop/new/page.tsx` بودند. فرمِ
   ویرایش نسخه‌ی خودش را داشت: دراپ‌داونِ دیگر، رنگِ دیگر، ورودیِ
   دیگر — و مهم‌تر از ظاهر، رفتارِ دیگر. حالا هر دو فرم دقیقاً یک
   چیز را نشان می‌دهند.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { SpecFieldDef } from '../../lib/market/specs'
import { normalizeFa } from '../../lib/text-fa'

export const GOLD     = '#C7A66A'
export const GOLD_D   = '#8F6531'
export const TEXT     = '#1C1C1A'
export const TEXT_SEC = 'rgba(28,28,26,0.52)'
export const TEXT_MUT = 'rgba(28,28,26,0.30)'
export const LQ_BG    = 'rgba(255,255,255,0.82)'
export const LQ_BOR   = '1px solid rgba(255,255,255,0.85)'
export const LQ_SHAD  = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)'
export const ERR      = '#EF4444'

/* استایلِ مشترکِ صفحه — هر دو فرم همین را در <style> می‌گذارند.
   (بک‌تیک این‌جا ممنوع — این رشته داخلِ template literal مصرف می‌شود) */
export const AD_FORM_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes popIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
  * { box-sizing: border-box; }
  .nf:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.14) !important; }
  /* ── حلقه‌ی focus روی دکمه‌های شبیهِ فیلد ──
     چیپ‌های مقدار، تاگلِ بله/خیر و چیپ‌های چندانتخابی همه دکمه‌اند
     و مرورگر حلقه‌ی پیش‌فرض را با outline:none  ریست از دست داده
     بود. بدونِ این، پیمایش با کیبورد نامرئی است. */
  .fchip:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(199,166,106,0.30); border-color: ${GOLD} !important; }
  .fchip:hover:not(:disabled) { border-color: rgba(199,166,106,0.45); }
  .fchip:disabled { opacity: .5; cursor: not-allowed; }
  /* راهنمای داخلِ فیلد ریزتر و کم‌رنگ‌تر از متنِ واقعی است، تا با
     چیزی که کاربر نوشته اشتباه گرفته نشود */
  .nf::placeholder { color: rgba(28,28,26,0.22); font-size: 12.6px; }
  .drop-area { transition: border-color 0.2s, background 0.2s, transform 0.15s; }
  .drop-area:hover { border-color: ${GOLD} !important; background: rgba(199,166,106,0.04) !important; }
  .img-thumb { transition: transform 0.2s, box-shadow 0.2s; }
  .img-thumb:hover { transform: scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
  .cond-btn { transition: all 0.2s; cursor: pointer; }
  .cond-btn:hover { border-color: ${GOLD} !important; }
  @media(max-width:820px) { .two-col { grid-template-columns: 1fr !important; } .spec-grid { grid-template-columns: 1fr !important; } }
  /* استایلِ اینلاین دو ستون می‌گذارد؛ بدونِ important بی‌اثر است */
  @media(min-width:1100px) { .span-cols .spec-grid { grid-template-columns: 1fr 1fr 1fr !important; } }
  /* ── مشخصات فنی روی دسکتاپ سه‌ستونه ──
     این کارت ردیفِ خودش را دارد و کلِ عرض را می‌گیرد. با دو ستون،
     ۳۳ فیلدِ میز ۱۷ ردیف می‌شد؛ با سه ستون ۱۱ ردیف. زیرِ ۱۱۰۰
     پیکسل به دو و زیرِ ۸۲۰ به یک ستون برمی‌گردد. */
  /* ── چیدمانِ دسکتاپ: دو ستونِ متعادل ──
     یک ستون، صفحه را ۴۵۴۰ پیکسل دراز می‌کرد. دو ستونِ دستی هم
     جواب نداد: کارتِ مشخصات با ۳۳ فیلد ۲۶۱۲ پیکسل است و هر تقسیمِ
     ثابتی یک طرف را تا پایین می‌بُرد و طرفِ دیگر را از وسط خالی
     می‌گذاشت.

     پس تقسیم به خودِ مرورگر سپرده شد: «column-count» ارتفاع را
     متعادل می‌کند و «break-inside: avoid» نمی‌گذارد کارتی وسطش
     بشکند. ساختارِ DOM دست‌نخورده می‌ماند — همان یک ستونِ موبایل،
     فقط با یک قاعده‌ی CSS. (تلاشِ قبلی JSX را جابه‌جا کرد و
     تودرتویی را بی‌صدا شکست؛ نه tsc دید نه تست.)

     ردیفِ قوانین و دکمه‌ها «column-span: all» می‌گیرند تا مثلِ
     قبل کلِ عرض را بگیرند و ته صفحه بمانند. */
  .two-col { grid-template-columns: 1fr !important; }
  @media(min-width:900px) {
    .ad-cols { display: block !important; column-count: 2; column-gap: 20px; column-fill: balance; }
    .ad-cols > * { break-inside: avoid; margin-bottom: 20px; }
    .ad-cols > .span-all { column-span: all; }
    /* کارتِ مشخصات کلِ عرض را می‌گیرد: ۳۳ فیلد در یک ستونِ ۵۵۰
       پیکسلی ۲۹۷۸ پیکسل بود و هیچ تعادلی ممکن نمی‌شد. تمام‌عرض،
       شبکه‌ی داخلی‌اش سه‌ستونه می‌شود و به ~۱۱۰۰ می‌رسد. */
    .ad-cols > .span-cols { column-span: all; }
    /* کارتِ تمام‌عرض نباید تُنُک شود: چهار فیلدش دو ستون می‌شوند */
    .span-cols .info-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 16px 20px; }
  }
`

// ── Shared input style ─────────────────────────────────────────
export function inp(err?: string, locked?: boolean): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', borderRadius: 11, fontSize: 14.5,
    border: `1.5px solid ${err ? ERR : locked ? 'rgba(199,166,106,0.32)' : 'rgba(28,28,26,0.13)'}`,
    background: locked ? 'rgba(199,166,106,0.06)' : '#FAFAFA',
    color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif',
    outline: 'none', direction: 'rtl',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    cursor: locked ? 'default' : undefined,
  }
}

// parse Persian/Arabic numerals → pure digits
export function toAsciiDigits(s: string) {
  return s.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
          .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
}

/* ── یک نرمال‌ساز، نه دو ──
   الگوریتم در `lib/text-fa` است چون سرور هم همان را لازم دارد؛ دو
   نسخه یعنی همان دو شکلِ ذخیره‌شده‌ای که این کار برای حذفش بود. */
export { normalizePhoneFa as normalizePhone, isIranMobile as isValidPhone } from '../../lib/text-fa'

export function fmtPrice(v: string) {
  const n = toAsciiDigits(v).replace(/\D/g, '')
  return n ? Number(n).toLocaleString('fa-IR') : ''
}

/* ── دراپ‌داون حرفه‌ای — پنل با Portal روی document.body و position:fixed رندر می‌شود
   تا از overflow:hidden و stacking-context کارت‌ها فرار کند و زیر المان بعدی نرود. ── */
export interface FancyOption {
  value: string
  label: string
  /** متنی که جست‌وجو رویش انجام می‌شود؛ نبودنش یعنی خودِ `label` */
  search?: string
  /** رندرِ سفارشیِ ردیف و حالتِ بسته — پرچم، زیرنویس، شمارش */
  node?: React.ReactNode
  /** سرتیترِ غیرقابلِ کلیک که پیش از این گزینه می‌آید */
  group?: string
}

export function FancySelect({ id, value, onChange, options, placeholder = 'انتخاب...', searchPlaceholder, disabled, error, describedBy }: {
  /** شناسه‌ی دکمه — تا `<label htmlFor>` واقعاً به چیزی برسد */
  id?: string
  value: string
  onChange: (v: string) => void
  /* `search` و `node` و `group` اختیاری‌اند و همه‌ی فراخوان‌های قبلی
     دست‌نخورده کار می‌کنند. `search` وقتی لازم است که کاربر با چیزی
     جز برچسب هم بگردد (نامِ فارسی، نامِ کشور)، و `node` وقتی که ردیف
     بیش از یک رشته باشد. */
  options: FancyOption[]
  placeholder?: string
  /** متنِ جست‌وجوی داخلِ فهرست — پیش‌فرض «جستجو...» */
  searchPlaceholder?: string
  disabled?: boolean
  error?: boolean
  /** شناسه‌ی متنِ راهنما — صفحه‌خوان باید آن را هم بخواند */
  describedBy?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [rect, setRect] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchable = options.length > 8

  /* ── چرا این‌قدر حساب‌وکتاب برای یک دراپ‌داون ──
     نسخه‌ی قبلی همیشه پنل را زیرِ دکمه می‌گذاشت با ارتفاعِ ثابتِ
     ۲۶۴ پیکسل. روی موبایل، دکمه‌ای که پایینِ صفحه بود پنلی می‌ساخت
     که نیمی از آن بیرونِ نمایشگر بود — و چون پنل `position:fixed`
     است، اسکرول هم به آن نمی‌رسید. یعنی گزینه‌های پایینِ فهرست
     عملاً قابلِ انتخاب نبودند.

     حالا فضای واقعیِ بالا و پایینِ دکمه اندازه گرفته می‌شود: اگر
     پایین جا نبود پنل رو به بالا باز می‌شود، و ارتفاعش هرگز از
     فضای موجود بیشتر نمی‌شود. */
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const GAP = 6, EDGE = 10
    const vh = window.innerHeight, vw = window.innerWidth
    const below = vh - r.bottom - GAP - EDGE
    const above = r.top - GAP - EDGE
    const openUp = below < 190 && above > below
    const maxH = Math.max(150, Math.min(300, openUp ? above : below))
    const top = openUp ? Math.max(EDGE, r.top - GAP - maxH) : r.bottom + GAP
    const width = Math.min(r.width, vw - EDGE * 2)
    const left = Math.min(Math.max(EDGE, r.left), Math.max(EDGE, vw - width - EDGE))
    setRect({ top, left, width, maxH })
  }
  const toggle = () => { if (disabled) return; if (!open) place(); setOpen(o => !o) }

  useEffect(() => {
    if (!open) return
    const onDoc = (ev: MouseEvent) => {
      const t = ev.target as Node
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place)
    }
  }, [open])

  const cur = options.find(o => o.value === value)
  /* جست‌وجو روی متنِ نرمال‌شده: «مك درموت» با کیبوردِ عربی، و
     «مک‌درموت» با نیم‌فاصله، باید همان «McDermott» را پیدا کنند.
     چون فاصله‌ها حذف می‌شوند، «cue craft» هم «CueCraft» را می‌گیرد. */
  const needle = normalizeFa(q)
  const list = searchable && needle
    ? options.filter(o => normalizeFa(o.search ?? o.label).includes(needle))
    : options

  return (
    <>
      <button ref={btnRef} id={id} type="button" disabled={disabled} onClick={toggle} aria-describedby={describedBy}
        style={{
          width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 14px', borderRadius: 11, fontSize: 14.5, textAlign: 'right',
          border: `1.5px solid ${error ? ERR : open ? GOLD : disabled ? 'rgba(28,28,26,0.07)' : 'rgba(28,28,26,0.13)'}`,
          background: disabled ? 'rgba(28,28,26,0.03)' : '#FAFAFA',
          color: cur ? TEXT : (disabled ? 'rgba(28,28,26,0.30)' : 'rgba(28,28,26,0.24)'),
          fontFamily: 'Vazirmatn,Tahoma,sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: open ? '0 0 0 3px rgba(199,166,106,0.14)' : 'none', transition: 'border-color .18s, box-shadow .18s',
        }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: cur ? undefined : 12.6 }}>{cur ? (cur.node ?? cur.label) : placeholder}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && !disabled && rect && typeof document !== 'undefined' && createPortal(
        <div ref={panelRef} style={{
          position: 'fixed', zIndex: 9999, top: rect.top, left: rect.left, width: rect.width,
          maxHeight: rect.maxH, display: 'flex', flexDirection: 'column',
          background: '#fff', border: '1px solid rgba(28,28,26,0.1)', borderRadius: 13, overflow: 'hidden',
          boxShadow: '0 18px 44px rgba(28,27,23,0.20)', animation: 'fadeIn 0.14s ease both', direction: 'rtl',
        }}>
          {searchable && (
            <div style={{ padding: 8, borderBottom: '1px solid rgba(28,28,26,0.07)', flexShrink: 0 }}>
              {/* روی موبایل فوکوسِ خودکار کیبورد را بالا می‌آورد و همان
                  پنلی را که تازه جا شده بود دوباره از صفحه بیرون می‌اندازد */}
              <input autoFocus={typeof window !== 'undefined' && window.innerWidth > 820}
                value={q} onChange={e => setQ(e.target.value)} placeholder={searchPlaceholder ?? 'جستجو...'} dir="rtl"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', borderRadius: 9, fontSize: 13, border: '1.5px solid rgba(28,28,26,0.12)', background: '#FAFAFA', color: TEXT, outline: 'none', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }} />
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: 6 }}>
            {list.length === 0 ? (
              <div style={{ padding: '18px 10px', textAlign: 'center', fontSize: 13, color: TEXT_MUT }}>موردی یافت نشد</div>
            ) : list.map((o, i) => {
              const s = o.value === value
              /* سرتیترِ گروه فقط وقتی می‌آید که با ردیفِ قبلی فرق کند —
                 و هنگام جست‌وجو هم درست کار می‌کند، چون روی همان
                 فهرستِ فیلترشده حساب می‌شود. */
              const head = o.group && o.group !== list[i - 1]?.group ? o.group : null
              return (
                <div key={o.value}>
                {head && (
                  <div style={{ padding: '9px 12px 5px', fontSize: 11, fontWeight: 700, color: GOLD_D, background: 'rgba(199,166,106,0.07)', letterSpacing: '.02em' }}>
                    {head}
                  </div>
                )}
                <button type="button" onClick={() => { onChange(o.value); setOpen(false); setQ('') }}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '11px 12px', border: 'none', borderRadius: 9, cursor: 'pointer', textAlign: 'right',
                    /* ── خطِ جداکننده زیرِ هر گزینه ──
                       فهرستِ برند تا صد ردیف می‌شود و بدونِ خط، نامِ
                       فارسی و شمارشِ ردیفِ بعدی با هم قاطی می‌شدند.
                       آخرین ردیف خط نمی‌گیرد تا کفِ پنجره تمیز بماند. */
                    borderBottom: i === list.length - 1 ? 'none' : '1px solid rgba(28,28,26,0.07)',
                    fontFamily: 'Vazirmatn,Tahoma,sans-serif', fontSize: 14,
                    background: s ? 'rgba(199,166,106,0.14)' : 'transparent', color: s ? GOLD_D : TEXT, fontWeight: s ? 800 : 500,
                  }}
                  onMouseEnter={e => { if (!s) e.currentTarget.style.background = 'rgba(28,28,26,0.04)' }}
                  onMouseLeave={e => { if (!s) e.currentTarget.style.background = 'transparent' }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.node ?? o.label}</span>
                  {s && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GOLD_D} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
                </div>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

/* optional دیگر برچسب «(اختیاری)» نمی‌گذارد — کلمه‌ی «اختیاری» از کل فرم حذف شد */
export function Label({ children, required, htmlFor, id }: { children: React.ReactNode; required?: boolean; optional?: boolean; htmlFor?: string; id?: string }) {
  return (
    <label id={id} htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 7 }}>
      {children}
      {required && <span style={{ color: ERR, marginRight: 3 }}>*</span>}
    </label>
  )
}

export function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p style={{ fontSize: 12, color: ERR, marginTop: 4, margin: '4px 0 0' }}>{msg}</p>
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 22px', display: 'flex', alignItems: 'center', gap: 9, position: 'relative', zIndex: 1 }}>
      <span style={{ width: 3, height: 17, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, flexShrink: 0, display: 'inline-block' }} />
      {children}
    </h2>
  )
}

/* ── پنجره‌ی پیام ──
   خطاها تا امروز به‌صورت یک نوارِ رنگی بالای فرم نشان داده می‌شدند.
   روی دسکتاپ دیده می‌شد؛ روی موبایل نه — کاربر پایینِ فرم دکمه را
   می‌زد، صفحه تکان نمی‌خورد و هیچ نمی‌فهمید چرا. حالا هر پیامی وسطِ
   صفحه می‌آید، جایی که چشم همان‌جاست.

   قفلِ بدنه عمداً دست نمی‌خورد: `touchAction:none` روی پوشش کافی است
   تا پس‌زمینه با لمس اسکرول نشود، بدونِ اینکه استایلِ body عوض شود. */
export interface AlertAction { href: string; label: string }

export function AlertDialog({ open, title, lines, tone = 'error', action, onClose }: {
  open: boolean
  title: string
  lines: string[]
  tone?: 'error' | 'warn'
  action?: AlertAction
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const accent = tone === 'warn' ? GOLD_D : '#C0392B'
  const accentBg = tone === 'warn' ? 'rgba(199,166,106,0.13)' : 'rgba(192,57,43,0.10)'

  return createPortal(
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif',
        background: 'rgba(20,19,16,0.42)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)',
        touchAction: 'none', animation: 'fadeIn 0.16s ease both',
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 22, padding: '26px 22px 20px', textAlign: 'center',
          boxShadow: '0 26px 70px rgba(20,19,16,0.32)', animation: 'popIn 0.22s cubic-bezier(0.34,1.4,0.64,1) both',
          touchAction: 'auto',
        }}>
        <span style={{ width: 52, height: 52, borderRadius: '50%', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', flexShrink: 0 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.3" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" /><line x1="12" y1="7.5" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12.01" y2="16.5" />
          </svg>
        </span>

        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: TEXT, margin: '0 0 10px' }}>{title}</h3>

        <div style={{ overflowY: 'auto', minHeight: 0, marginBottom: 18 }}>
          {lines.length === 1 ? (
            <p style={{ fontSize: 13.5, color: TEXT_SEC, lineHeight: 2, margin: 0 }}>{lines[0]}</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'right' }}>
              {lines.map((l, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.2, color: TEXT_SEC, lineHeight: 1.95, padding: '3px 0' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, marginTop: 9, flexShrink: 0 }} />
                  {l}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: 'flex', gap: 9, flexShrink: 0 }}>
          {action && (
            <a href={action.href} style={{
              flex: 1, padding: '12px 0', borderRadius: 13, textDecoration: 'none', textAlign: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg,${GOLD},#A07840)`,
            }}>{action.label}</a>
          )}
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 13, cursor: 'pointer', fontSize: 14, fontWeight: 800,
            fontFamily: 'Vazirmatn,Tahoma,sans-serif',
            border: action ? '1px solid rgba(28,28,26,0.12)' : 'none',
            background: action ? 'rgba(28,28,26,0.04)' : `linear-gradient(135deg,${GOLD},#A07840)`,
            color: action ? TEXT_SEC : '#fff',
          }}>{action ? 'بستن' : 'متوجه شدم'}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function SpecField({ field, value, otherValue, onChange, onOtherChange, dependencyValue }: {
  field: SpecFieldDef; value: string; otherValue: string
  onChange: (v: string) => void; onOtherChange: (v: string) => void
  dependencyValue?: string
}) {
  const hasDep   = Boolean(field.dependsOn)
  // cueType === 'سایر' → free-text input for brand
  const depOther = hasDep && dependencyValue === 'سایر'
  // no cueType selected yet → disable the brand dropdown
  const noDepYet = hasDep && !dependencyValue

  // resolve the correct options list
  const resolvedOptions: string[] =
    hasDep && field.optionsByDependency && dependencyValue && !depOther
      ? field.optionsByDependency[dependencyValue] ?? []
      : field.options ?? []

  const effectiveType = depOther ? 'text' : field.type
  const showOther = effectiveType === 'dropdown' && resolvedOptions.includes('سایر') && value === 'سایر'
  const labelText = field.unit ? `${field.label} (${field.unit})` : field.label

  return (
    <div style={{ gridColumn: field.wide ? '1 / -1' : undefined }}>
      <Label optional>{labelText}</Label>

      {/* Wrap in a keyed div so the fade-in triggers every time dependency changes */}
      <div key={`dep-${dependencyValue ?? '__none__'}`}
        style={{ animation: hasDep ? 'fadeIn 0.25s ease both' : undefined }}>

        {effectiveType === 'dropdown' ? (
          <FancySelect value={value} onChange={onChange}
            options={resolvedOptions.map(o => ({ value: o, label: o }))}
            placeholder={noDepYet ? 'ابتدا نوع را انتخاب کنید' : 'انتخاب...'}
            disabled={noDepYet} />
        ) : effectiveType === 'number' ? (
          <input className="nf" type="number" step="any" inputMode="decimal" placeholder={field.placeholder ?? ''} value={value}
            onChange={e => onChange(e.target.value)}
            style={{ ...inp(), direction: 'ltr', textAlign: 'right' }} />
        ) : (
          <input className="nf" type="text"
            placeholder={depOther ? 'نام برند را وارد کنید...' : (field.placeholder ?? '')}
            value={depOther ? otherValue : value}
            onChange={e => depOther ? onOtherChange(e.target.value) : onChange(e.target.value)}
            style={{ ...inp(), ...(depOther ? { background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' } : {}) }} />
        )}

        {showOther && (
          <div style={{ marginTop: 8, animation: 'fadeIn 0.25s ease both' }}>
            <input className="nf" type="text" placeholder="لطفاً توضیح دهید..." value={otherValue}
              onChange={e => onOtherChange(e.target.value)}
              style={{ ...inp(), background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
