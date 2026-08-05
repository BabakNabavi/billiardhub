'use client'

/* ─────────────────────────────────────────────────────────────
   «باشگاهی که در آن فعالیت می‌کنید» — یک کامپوننت برای همه‌ی نقش‌ها.

   چرا یکی: این انتخاب باید در ثبت‌نام و در پروفایلِ هر شش نقش باشد.
   هفت نسخه‌ی جدا یعنی هفت رفتارِ کمی متفاوت و روزی یکی از قلم
   می‌افتد. عضویت هم سراسری است — یک کاربر در یک زمان عضو یک
   باشگاه است، فارغ از این‌که مربی باشد یا فروشنده.

   انتخابِ دستی عمداً ممکن نیست: عضویت روی `club_members` می‌نشیند و
   شمارشِ اعضای باشگاه از همان‌جا می‌آید. اگر کسی بتواند نامِ دلخواه
   بنویسد، آن عدد بی‌معنی می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, Check, X, Loader2, Building2, MapPin, Users } from 'lucide-react'
import { fetchClubOptions, type ClubOption } from '../lib/clubs-data'
import { apiFetch } from '../lib/http'
import { toFaDigits } from '../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38'

export interface ClubPickerValue { id: string; name: string }

interface Props {
  /* اگر ندهید، کامپوننت خودش عضویتِ فعلی را از سرور می‌خواند و
     نگه می‌دارد. در هفت صفحه استفاده می‌شود؛ اگر هر کدام مجبور
     بودند state و بارگذاری خودشان را بنویسند، همان‌جا هفت رفتارِ
     کمی متفاوت درست می‌شد. */
  value?: ClubPickerValue | null
  onChange?: (v: ClubPickerValue | null) => void
  /** برچسب بالای کادر — پیش‌فرض برای همه‌ی نقش‌ها یکی است */
  label?: string
  /** توضیحِ زیر برچسب */
  hint?: string
  /* عضویت را همین‌جا روی سرور ثبت کن. در فرم‌هایی که دکمه‌ی ذخیره‌ی
     خودشان را دارند هم درست است، چون عضویت جدا از پروفایل نگهداری
     می‌شود و منتظر ماندنش فقط باعث می‌شود کاربر فکر کند ثبت شده. */
  autoSave?: boolean
}

/* نامِ باشگاه‌ها فارسی است و کاربر ممکن است «ي» عربی یا «ك» بنویسد.
   بدون یکسان‌سازی، جست‌وجوی «یاس» باشگاهِ «ياس» را پیدا نمی‌کند. */
const norm = (s: string) =>
  s.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase()

export default function ClubPicker({
  value: valueProp, onChange, label = 'باشگاهی که در آن فعالیت می‌کنید',
  hint = 'فقط باشگاه‌های ثبت‌شده در سایت — با انتخاب شما، یک عضو به آن باشگاه افزوده می‌شود',
  autoSave = true,
}: Props) {
  /* حالتِ خودگردان: وقتی صفحه‌ای `value` نمی‌دهد، همین‌جا نگه داشته
     و از سرور خوانده می‌شود. */
  const controlled = valueProp !== undefined
  const [own, setOwn] = useState<ClubPickerValue | null>(null)
  const value = controlled ? valueProp : own
  const set = useCallback((v: ClubPickerValue | null) => {
    if (!controlled) setOwn(v)
    onChange?.(v)
  }, [controlled, onChange])

  useEffect(() => {
    if (controlled) return
    void apiFetch('/api/clubs/membership?mine=1', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j?.club?.id) setOwn({ id: j.club.id, name: j.club.name ?? '' }) })
      .catch(() => { })
  }, [controlled])

  const [open, setOpen] = useState(false)
  const [clubs, setClubs] = useState<ClubOption[] | null>(null)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [members, setMembers] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  /* فهرست فقط وقتی گرفته می‌شود که پنجره باز شود — این کامپوننت در
     هفت صفحه هست و گرفتنِ فهرست در بارگذاریِ همه‌شان بی‌دلیل است. */
  useEffect(() => {
    if (!open || clubs) return
    void fetchClubOptions().then(setClubs).catch(() => setClubs([]))
  }, [open, clubs])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60)
  }, [open])

  /* شمارِ اعضای باشگاهِ انتخاب‌شده — همان عددی که کاربر به آن اضافه شد */
  const loadMembers = useCallback((id: string) => {
    void apiFetch(`/api/clubs/membership?clubId=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => setMembers(typeof j?.members === 'number' ? j.members : null))
      .catch(() => { })
  }, [])

  /* دریافتِ پیامکِ باشگاه — عضو باید بتواند خاموشش کند */
  const [optOut, setOptOut] = useState(false)
  const [optBusy, setOptBusy] = useState(false)
  useEffect(() => {
    if (!value?.id || !autoSave) return
    void apiFetch('/api/clubs/membership?mine=1', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => setOptOut(j?.smsOptOut === true))
      .catch(() => { })
  }, [value?.id, autoSave])

  const toggleSms = async () => {
    const next = !optOut
    setOptOut(next); setOptBusy(true)          // خوش‌بینانه — برگشتش ارزان است
    try {
      const r = await apiFetch('/api/clubs/membership', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsOptOut: next }),
      })
      if (!r.ok) setOptOut(!next)
    } catch { setOptOut(!next) } finally { setOptBusy(false) }
  }
  useEffect(() => { if (value?.id) loadMembers(value.id); else setMembers(null) }, [value?.id, loadMembers])

  /* بدنه هنگام باز بودنِ پنجره قفل می‌شود — روی موبایل بدون این،
     اسکرولِ پس‌زمینه زیرِ پنجره حرکت می‌کند. */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', esc) }
  }, [open])

  const filtered = useMemo(() => {
    const list = clubs ?? []
    const nq = norm(q)
    if (!nq) return list
    return list.filter(c => norm(c.name).includes(nq) || norm(c.city).includes(nq))
  }, [clubs, q])

  const pick = async (c: ClubOption) => {
    setErr('')
    if (!autoSave) { set({ id: c.id, name: c.name }); setOpen(false); return }
    setBusy(true)
    try {
      const r = await apiFetch('/api/clubs/membership', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: c.id }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'ثبت عضویت انجام نشد'); return }
      set({ id: c.id, name: c.name })
      setMembers(typeof j?.members === 'number' ? j.members : null)
      setOpen(false); setQ('')
    } catch { setErr('خطا در ارتباط با سرور') } finally { setBusy(false) }
  }

  const clear = async () => {
    setErr('')
    if (!autoSave) { set(null); return }
    setBusy(true)
    try {
      const r = await apiFetch('/api/clubs/membership', { method: 'DELETE' })
      if (!r.ok) { setErr('حذف عضویت انجام نشد'); return }
      set(null); setMembers(null)
    } catch { setErr('خطا در ارتباط با سرور') } finally { setBusy(false) }
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: INK, marginBottom: 5 }}>
        {label}
      </label>
      {hint ? (
        <p style={{ fontSize: 11.5, color: MUT, lineHeight: 1.85, margin: '0 0 9px' }}>{hint}</p>
      ) : null}

      {value ? (
        /* ── انتخاب‌شده ── */
        <div style={{
          display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap',
          border: `1px solid rgba(14,122,56,0.24)`, background: 'rgba(14,122,56,0.04)',
          borderRadius: 14, padding: '12px 14px',
        }}>
          <span style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            background: 'rgba(14,122,56,0.10)', color: FELT,
          }}><Check size={17} /></span>

          <div style={{ flex: '1 1 150px', minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 800, color: INK,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{value.name}</div>
            {members !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: SEC, marginTop: 3 }}>
                <Users size={12} />{toFaDigits(members)} عضو
              </div>
            ) : null}
          </div>

          <button type="button" onClick={() => setOpen(true)} disabled={busy} style={ghostBtn}>
            تغییر
          </button>
          <button type="button" onClick={() => void clear()} disabled={busy} style={{ ...ghostBtn, color: MUT }}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : 'حذف'}
          </button>

          {/* اجازه‌ی پیامکِ باشگاه — بدونِ این، تنها راهِ نگرفتنِ پیامک
              ترکِ باشگاه بود. */}
          {autoSave ? (
            <label style={{
              flex: '1 1 100%', display: 'flex', alignItems: 'center', gap: 8,
              borderTop: `1px solid rgba(14,122,56,0.14)`, paddingTop: 10, marginTop: 2,
              fontSize: 11.5, color: SEC, cursor: optBusy ? 'wait' : 'pointer', lineHeight: 1.8,
            }}>
              <input
                type="checkbox" checked={!optOut} disabled={optBusy}
                onChange={() => void toggleSms()}
                style={{ width: 15, height: 15, accentColor: FELT, cursor: 'inherit', flexShrink: 0 }} />
              اطلاعیه‌های باشگاه (مسابقه، دوره، تخفیف) برایم پیامک شود
            </label>
          ) : null}
        </div>
      ) : (
        /* ── هنوز انتخاب نشده ── */
        <button
          type="button" onClick={() => setOpen(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            border: `1px dashed ${LINE}`, background: '#FCFBF8', borderRadius: 14,
            padding: '13px 15px', cursor: 'pointer', textAlign: 'right',
            fontFamily: 'var(--font-base)',
          }}>
          <span style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            background: 'rgba(199,166,106,0.13)', color: GOLD_D,
          }}><Building2 size={17} /></span>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: SEC }}>
            انتخاب باشگاه
          </span>
          <Search size={16} style={{ color: MUT }} />
        </button>
      )}

      {err ? (
        <p style={{ fontSize: 11.5, color: '#B23B2E', margin: '7px 0 0', lineHeight: 1.8 }}>{err}</p>
      ) : null}

      {open ? <Sheet
        clubs={clubs} filtered={filtered} q={q} setQ={setQ} busy={busy}
        selectedId={value?.id ?? null} searchRef={searchRef}
        onPick={pick} onClose={() => { setOpen(false); setQ('') }}
      /> : null}
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  border: `1px solid ${LINE}`, background: '#fff', color: SEC,
  borderRadius: 9, padding: '7px 13px', fontSize: 12, fontWeight: 800,
  fontFamily: 'var(--font-base)', cursor: 'pointer', whiteSpace: 'nowrap',
}

/* ── پنجره‌ی انتخاب ──
   با portal روی body می‌نشیند: این کامپوننت داخلِ فرم‌هایی می‌رود که
   خودشان کارت و overflow دارند، و بدون portal پنجره زیرِ آن‌ها
   بریده می‌شد. */
function Sheet({
  clubs, filtered, q, setQ, busy, selectedId, searchRef, onPick, onClose,
}: {
  clubs: ClubOption[] | null; filtered: ClubOption[]
  q: string; setQ: (v: string) => void; busy: boolean
  selectedId: string | null
  searchRef: React.RefObject<HTMLInputElement | null>
  onPick: (c: ClubOption) => void; onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(28,27,23,0.42)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 0,
      }}
      className="bh-clubpicker-overlay">
      <div
        onClick={e => e.stopPropagation()}
        dir="rtl"
        style={{
          width: '100%', maxWidth: 520, background: '#fff',
          borderRadius: '20px 20px 0 0', maxHeight: '86vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(28,27,23,0.18)',
          fontFamily: 'var(--font-base)',
          animation: 'bhSheetUp .26s cubic-bezier(.22,.9,.3,1)',
        }}
        className="bh-clubpicker-sheet">
        {/* سر */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '15px 18px 12px', borderBottom: `1px solid ${LINE}`,
        }}>
          <Building2 size={18} style={{ color: GOLD_D }} />
          <span style={{ flex: 1, fontSize: 15, fontWeight: 900, color: INK }}>انتخاب باشگاه</span>
          <button type="button" onClick={onClose} aria-label="بستن" style={{
            border: 'none', background: '#F5F3EE', color: SEC, borderRadius: 9,
            width: 30, height: 30, display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><X size={16} /></button>
        </div>

        {/* جست‌وجو */}
        <div style={{ padding: '12px 18px 10px', position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', color: MUT,
          }} />
          <input
            ref={searchRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="نام باشگاه یا شهر..."
            style={{
              width: '100%', boxSizing: 'border-box', border: `1px solid ${LINE}`,
              borderRadius: 12, padding: '11px 38px 11px 13px', fontSize: 14,
              fontFamily: 'var(--font-base)', color: INK, outline: 'none', background: '#FCFBF8',
            }} />
        </div>

        {/* فهرست */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 14px' }}>
          {clubs === null ? (
            <div style={{ display: 'grid', placeItems: 'center', padding: 40 }}>
              <Loader2 size={20} className="animate-spin" style={{ color: MUT }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: MUT, fontSize: 12.5, lineHeight: 2 }}>
              {clubs.length === 0
                ? 'هنوز هیچ باشگاهی در سایت ثبت نشده است.'
                : 'باشگاهی با این نام پیدا نشد.'}
              <br />
              <span style={{ fontSize: 11.5 }}>
                فقط باشگاه‌هایی که خودشان در سایت ثبت‌نام کرده‌اند این‌جا می‌آیند.
              </span>
            </div>
          ) : filtered.map(c => {
            const on = c.id === selectedId
            return (
              <button
                key={c.id} type="button" disabled={busy}
                onClick={() => onPick(c)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                  border: '1px solid', borderColor: on ? 'rgba(14,122,56,0.24)' : 'transparent',
                  background: on ? 'rgba(14,122,56,0.05)' : 'transparent',
                  borderRadius: 13, padding: '11px 12px', marginBottom: 2,
                  cursor: busy ? 'wait' : 'pointer', textAlign: 'right',
                  fontFamily: 'var(--font-base)',
                }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900,
                  background: on ? 'rgba(14,122,56,0.10)' : 'rgba(199,166,106,0.13)',
                  color: on ? FELT : GOLD_D,
                }}>
                  {on ? <Check size={16} /> : c.name.trim().charAt(0)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontSize: 13.5, fontWeight: 800, color: INK,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{c.name}</span>
                  {c.city ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: MUT, marginTop: 2 }}>
                      <MapPin size={11} />{c.city}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes bhSheetUp { from { transform: translateY(14px); opacity: .6 } to { transform: none; opacity: 1 } }
        @media (min-width: 640px) {
          .bh-clubpicker-overlay { align-items: center; padding: 20px }
          .bh-clubpicker-sheet { border-radius: 20px !important; max-height: 74vh !important }
        }
        @media (prefers-reduced-motion: reduce) {
          .bh-clubpicker-sheet { animation: none !important }
        }
      `}</style>
    </div>,
    document.body,
  )
}
