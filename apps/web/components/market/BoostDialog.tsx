'use client'

/* ─────────────────────────────────────────────────────────────
   پنجره‌ی ارتقای آگهی.

   ── چرا دو کارت و نه یک فهرستِ ساده ──
   فروشنده باید در یک نگاه بفهمد این دو چه فرقی دارند، وگرنه گران‌تر
   را می‌خرد و توقعِ اشتباه پیدا می‌کند. هر کارت می‌گوید **چه اتفاقی
   می‌افتد**، نه فقط نامِ محصول را.

   ── چرا وضعیتِ فعلی روی خودِ کارت ──
   اگر «فوری» از قبل فعال باشد یا تازه‌سازی در قفلِ ۲۴ ساعته باشد،
   کاربر باید همان‌جا بداند — نه بعد از پرداخت.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { ArrowUp, Loader2, X, Zap } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { faDate } from '../../lib/jalali'

const GOLD_D = '#9A6E38', INK = '#1C1B17', MUT = '#8A8474', LINE = '#EAE5DA'
const RED = '#B23B2E'

interface Pricing {
  enabled: boolean
  bump: { price: number; cooldownHours: number }
  urgent: { price: number; days: number }
}
interface State {
  urgentUntil: string | null
  urgentActive: boolean
  bumpReadyAt: string | null
  canBump: boolean
}

const fa = (n: number) => n.toLocaleString('fa-IR')

export default function BoostDialog({ productId, title, onClose }: {
  productId: string
  title: string
  onClose: () => void
}) {
  const [pricing, setPricing] = useState<Pricing | null>(null)
  const [state, setState] = useState<State | null>(null)
  const [blocked, setBlocked] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiFetch(`/api/market/ads/${productId}/boost`, { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) { setErr(j?.message ?? 'دریافت تعرفه انجام نشد'); return }
        setPricing(j.pricing); setState(j.state)
        if (j.eligible === false) setBlocked(String(j.reason ?? ''))
      } catch { setErr('ارتباط با سرور برقرار نشد') }
    })()
  }, [productId])

  const buy = async (kind: 'bump' | 'urgent') => {
    setBusy(kind); setErr('')
    try {
      const r = await apiFetch(`/api/market/ads/${productId}/boost`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.redirectUrl) { setErr(j?.message ?? 'خرید انجام نشد'); return }
      window.location.href = j.redirectUrl as string
    } catch { setErr('ارتباط با سرور برقرار نشد') } finally { setBusy('') }
  }

  return (
    <div role="dialog" aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(12,11,9,0.5)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 18, direction: 'rtl',
      }}>
      <div style={{
        width: '100%', maxWidth: 520, background: '#fff', borderRadius: 20,
        border: `1px solid ${LINE}`, padding: 'clamp(18px,4vw,26px)',
        maxHeight: '90vh', overflowY: 'auto',
        fontFamily: 'var(--font-base)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: INK, margin: 0, flex: 1 }}>
            ارتقای آگهی
          </h2>
          <button type="button" onClick={onClose} aria-label="بستن" style={{
            background: 'none', border: 'none', color: MUT, cursor: 'pointer', padding: 2,
          }}><X size={18} /></button>
        </div>
        <p style={{
          fontSize: 12.5, color: MUT, margin: '0 0 18px', lineHeight: 1.9,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</p>

        {err && (
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: '#8A2A20', marginBottom: 14,
            background: 'rgba(178,59,46,0.07)', border: '1px solid rgba(178,59,46,0.28)',
            borderRadius: 11, padding: '9px 12px', lineHeight: 1.9,
          }}>{err}</div>
        )}

        {blocked && (
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: '#8A2A20', marginBottom: 14,
            background: 'rgba(178,59,46,0.07)', border: '1px solid rgba(178,59,46,0.28)',
            borderRadius: 11, padding: '9px 12px', lineHeight: 1.9,
          }}>{blocked}</div>
        )}

        {!pricing ? (
          <div style={{ textAlign: 'center', padding: 30, color: MUT }}>
            <Loader2 size={22} style={{ animation: 'bdspin 1s linear infinite' }} />
          </div>
        ) : !pricing.enabled ? (
          <div style={{ fontSize: 13, color: MUT, lineHeight: 2, padding: '10px 2px' }}>
            ارتقای آگهی فعلاً غیرفعال است.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))' }}>

            {/* ── تازه‌سازی ── */}
            <Card
              icon={<ArrowUp size={18} color={GOLD_D} />}
              tint="rgba(199,166,106,0.10)" edge="rgba(199,166,106,0.34)"
              name="تازه‌سازی آگهی"
              what="آگهی مثلِ آگهیِ تازه به بالای فهرست می‌رود."
              note="آگهی‌های تازه‌ی بعدی دوباره پایینش می‌برند."
              price={pricing.bump.price}
              extra={null}
              disabled={!!blocked || (state ? !state.canBump : false)}
              disabledText={state && !state.canBump && state.bumpReadyAt
                ? `به‌تازگی تازه‌سازی شده — از ${faDate(state.bumpReadyAt)} دوباره`
                : ''}
              busy={busy === 'bump'}
              onBuy={() => void buy('bump')}
            />

            {/* ── فوری ── */}
            <Card
              icon={<Zap size={18} color={RED} />}
              tint="rgba(178,59,46,0.07)" edge="rgba(178,59,46,0.30)"
              name="آگهی فوری"
              what="آگهی در نوارِ «فوری» بالای بازار می‌نشیند و پایین نمی‌آید."
              note="نشانِ قرمز هم می‌گیرد و در فیلترِ فوری می‌آید."
              price={pricing.urgent.price}
              extra={`${fa(pricing.urgent.days)} روز`}
              disabled={!!blocked}
              disabledText=""
              activeText={state?.urgentActive && state.urgentUntil
                ? `تا ${faDate(state.urgentUntil)} فعال است — خرید دوباره ${fa(pricing.urgent.days)} روز اضافه می‌کند`
                : ''}
              busy={busy === 'urgent'}
              onBuy={() => void buy('urgent')}
            />
          </div>
        )}

        <p style={{ fontSize: 11, color: MUT, margin: '16px 0 0', lineHeight: 1.9 }}>
          پرداخت از درگاهِ بانکی انجام می‌شود و ارتقا بلافاصله پس از بازگشت اعمال می‌شود.
          تازه‌سازی پس از اعمال بازگشت‌پذیر نیست.
        </p>
        <style>{`@keyframes bdspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}

function Card({
  icon, tint, edge, name, what, note, price, extra,
  disabled, disabledText, activeText, busy, onBuy,
}: {
  icon: React.ReactNode; tint: string; edge: string
  name: string; what: string; note: string
  price: number; extra: string | null
  disabled: boolean; disabledText: string; activeText?: string
  busy: boolean; onBuy: () => void
}) {
  return (
    <div style={{
      border: `1px solid ${edge}`, background: tint, borderRadius: 16,
      padding: 15, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon}
        <span style={{ fontSize: 14, fontWeight: 900, color: INK }}>{name}</span>
      </div>
      <p style={{ fontSize: 12.5, color: '#4B4638', margin: 0, lineHeight: 1.95 }}>{what}</p>
      <p style={{ fontSize: 11.5, color: MUT, margin: 0, lineHeight: 1.9 }}>{note}</p>

      {activeText && (
        <p style={{ fontSize: 11.5, color: '#0E7A38', fontWeight: 700, margin: 0, lineHeight: 1.9 }}>
          {activeText}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'auto', paddingTop: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: INK }}>{fa(price)}</span>
        <span style={{ fontSize: 11.5, color: MUT }}>تومان{extra ? ` · ${extra}` : ''}</span>
      </div>

      <button type="button" onClick={onBuy} disabled={disabled || busy} style={{
        width: '100%', padding: '10px', borderRadius: 11, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
        border: `1px solid ${edge}`, background: '#fff', color: INK,
        opacity: disabled || busy ? 0.5 : 1,
      }}>
        {busy ? 'در حال انتقال…' : 'خرید و پرداخت'}
      </button>

      {disabledText && (
        <p style={{ fontSize: 11, color: MUT, margin: 0, lineHeight: 1.8 }}>{disabledText}</p>
      )}
    </div>
  )
}
