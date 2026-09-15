'use client'

/* ─────────────────────────────────────────────────────────────
   سیرِ یک تراکنش — از پرداخت تا تسویه.

   رویدادها از جدول‌های واقعی ساخته می‌شوند (پرداخت، دفتر، بازپرداخت،
   تسویه)، نه از یک ستونِ وضعیت — چون وضعیت فقط «الان کجاست» را
   می‌گوید، نه «چه مسیری آمده».

   مسیرِ `/api/admin/finance/timeline` از مدت‌ها پیش آماده بود و هیچ
   صفحه‌ای صدایش نمی‌زد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { Loader2, X, Clock3 } from 'lucide-react'
import { LEDGER_LABEL } from '../../lib/finance/labels'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#6F6A5C', LINE = '#EAE5DA'
const GOLD_D = '#8F6531', FELT = '#0E7A38'
const fa = (n: unknown) => Math.round(Number(n) || 0).toLocaleString('fa-IR')
const faDateTime = (iso?: unknown) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran',
    }).format(new Date(String(iso)))
  } catch { return '—' }
}

interface Ev { at: string; kind: string; label: string; amount?: number }

export default function TransactionTimeline(
  { bookingId, onClose }: { bookingId: string; onClose: () => void },
) {
  const [evs, setEvs] = useState<Ev[] | null>(null)
  const [err, setErr] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let alive = true
    apiFetch(`/api/admin/finance/timeline?booking=${encodeURIComponent(bookingId)}`, { cache: 'no-store' })
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!alive) return
        if (!r.ok) setErr(j?.message || 'سیر تراکنش خوانده نشد')
        else setEvs(j.events ?? [])
      })
      .catch(() => { if (alive) setErr('خطا در ارتباط با سرور') })
    return () => { alive = false }
  }, [bookingId])

  /* ⚠️ `onClose` را والد در هر رندر از نو می‌سازد. اگر این effect به آن
     وابسته باشد، هر رندرِ والد دوباره اجرا می‌شود: فوکوس را پس
     می‌گیرد و `returnTo` را با خودِ دکمه‌ی بستن بازنویسی می‌کند — پس
     موقعِ بستن، فوکوس به یک گرهِ unmountشده برمی‌گردد و عملا روی
     `<body>` می‌افتد. پس در ref نگه داشته می‌شود و effect وابستگیِ
     خالی دارد. */
  const closeCb = useRef(onClose)
  useEffect(() => { closeCb.current = onClose }, [onClose])

  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCb.current() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      returnTo.current?.focus?.()
    }
  }, [])

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(16,16,14,.42)',
        display: 'grid', placeItems: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="tl-h" onClick={e => e.stopPropagation()}
        style={{ width: 'min(520px, 100%)', maxHeight: '80vh', overflowY: 'auto', background: '#fff',
          border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Clock3 size={17} style={{ color: GOLD_D }} />
          <h3 id="tl-h" style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>سیر این تراکنش</h3>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="بستن" className="tl-x">
            <X size={17} />
          </button>
        </div>

        {err ? <p style={{ fontSize: 13, color: SEC }}>{err}</p>
          : !evs ? <Loader2 size={20} style={{ color: MUT, animation: 'trspin 1s linear infinite' }} />
            : evs.length === 0 ? <p style={{ fontSize: 13, color: MUT }}>رویدادی ثبت نشده است</p>
              : (
                <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {evs.map((e, i) => (
                    <li key={`${e.kind}-${e.at}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'baseline',
                      paddingBottom: 10, borderBottom: i < evs.length - 1 ? `1px solid ${LINE}` : 0 }}>
                      <span style={{ fontSize: 11, color: MUT, minWidth: 110 }}>{faDateTime(e.at)}</span>
                      <span style={{ fontSize: 12.5, color: INK, fontWeight: 700, flex: 1 }}>
                        {LEDGER_LABEL[e.kind.replace(/^LEDGER_/, '')] ?? e.label}
                      </span>
                      {typeof e.amount === 'number' && Number.isFinite(e.amount) && (
                        <b style={{ fontSize: 12.5, color: e.amount < 0 ? '#991B1B' : FELT }}>{fa(e.amount)}</b>
                      )}
                    </li>
                  ))}
                </ol>
              )}
      </div>
      <style>{`
        .tl-x { margin-inline-start: auto; border: 0; background: transparent;
          cursor: pointer; color: ${MUT}; border-radius: 8px; padding: 3px; }
        .tl-x:focus-visible { outline: 2px solid ${GOLD_D}; outline-offset: 2px; }
      `}</style>
    </div>
  )
}
