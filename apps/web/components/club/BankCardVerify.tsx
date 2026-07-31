'use client'

/* ─────────────────────────────────────────────────────────────
   ثبت کارت بانکی باشگاه — با استعلام واقعی.

   پیش از این، شماره کارت و «نام صاحب حساب» دو فیلد متنی آزاد بودند و
   هرچه تایپ می‌شد بی‌هیچ بررسی ذخیره می‌شد؛ یعنی می‌شد کارت شخص
   دیگری را جای کارت خود ثبت کرد.

   حالا زنجیره‌ی اثبات که از قبل در `/api/bank/card-to-iban` وجود داشت
   ولی هیچ‌جا صدا زده نمی‌شد، این‌جا اجرا می‌شود:
     Luhn محلی → CardMatch (کارت مال همین کد ملی؟) → CardToIban (شبا و
     نام دارنده) → IbanMatch (مقصد واقعی پول هم مال همین کد ملی؟)

   نام و شبا از خود سرویس می‌آیند و ورودی کاربر نیستند — پس قابل
   دست‌کاری هم نیستند. در پایان یک تأیید صریح از صاحب حساب گرفته
   می‌شود، چون پول به همین شبا می‌رود.
   ───────────────────────────────────────────────────────────── */

import { useState } from 'react'
import { ShieldCheck, Loader2, AlertCircle, CreditCard } from 'lucide-react'
import { apiFetch } from '../../lib/http'

const INK = '#1C1B17', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

export interface BankResult {
  card: string
  iban: string
  ownerName: string
  bankName: string
  confirmed: boolean
}

const groupCard = (d: string) => d.replace(/(.{4})/g, '$1-').replace(/-$/, '')

export default function BankCardVerify({ clubId, value, onChange }: {
  clubId?: string
  value: BankResult | null
  onChange: (v: BankResult | null) => void
}) {
  const [card, setCard] = useState(value?.card ? groupCard(value.card) : '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const digits = card.replace(/\D/g, '')
  const verified = !!value?.iban

  const verify = async () => {
    setErr('')
    if (digits.length !== 16) { setErr('شماره کارت باید ۱۶ رقم باشد'); return }
    setBusy(true)
    try {
      const r = await apiFetch('/api/bank/card-to-iban', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: digits, ...(clubId ? { clubId } : {}) }),
      })
      const j = await r.json().catch(() => ({} as Record<string, unknown>))
      if (!r.ok || j.match === false || !j.iban) {
        setErr(String(j.message ?? 'استعلام کارت ناموفق بود'))
        onChange(null)
        return
      }
      onChange({
        card: digits,
        iban: String(j.iban),
        ownerName: String(j.ownerName ?? ''),
        bankName: String(j.bankName ?? ''),
        confirmed: false,
      })
    } catch {
      setErr('خطا در ارتباط با سرویس استعلام')
      onChange(null)
    } finally { setBusy(false) }
  }

  const box: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', gap: 12,
    padding: '10px 0', borderBottom: `1px solid ${LINE}`,
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: MUT, marginBottom: 6 }}>
        شماره کارت صاحب باشگاه
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={card}
          onChange={e => {
            const d = e.target.value.replace(/\D/g, '').slice(0, 16)
            setCard(groupCard(d)); setErr(''); if (verified) onChange(null)
          }}
          placeholder="۱۲۳۴-۵۶۷۸-۹۰۱۲-۳۴۵۶"
          dir="ltr" inputMode="numeric" maxLength={19}
          className="bh-latin"
          style={{
            flex: '1 1 220px', minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 10,
            padding: '11px 13px', fontSize: 16, letterSpacing: '0.08em',
            background: '#FAFAF7', color: INK, outline: 'none', fontFamily: 'monospace',
          }}
        />
        <button type="button" onClick={verify} disabled={busy || digits.length !== 16}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '11px 20px', borderRadius: 10, cursor: busy ? 'default' : 'pointer',
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: GOLD_D,
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.4)',
            opacity: busy || digits.length !== 16 ? 0.55 : 1, whiteSpace: 'nowrap',
          }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          استعلام کارت
        </button>
      </div>

      {err && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 10,
          background: 'rgba(178,59,46,0.06)', border: '1px solid rgba(178,59,46,0.28)',
          borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: RED, lineHeight: 1.9,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {err}
        </div>
      )}

      {verified && value && (
        <div style={{
          marginTop: 12, background: 'rgba(14,122,56,0.04)',
          border: '1px solid rgba(14,122,56,0.25)', borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: FELT, fontSize: 12.5, fontWeight: 800 }}>
            <ShieldCheck size={14} /> کارت تأیید شد و به نام شماست
          </div>

          {/* هر سه از سرویس آمده‌اند — قابل ویرایش نیستند */}
          <div style={box}>
            <span style={{ fontSize: 12.5, color: MUT }}>نام صاحب حساب</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{value.ownerName || '—'}</span>
          </div>
          <div style={box}>
            <span style={{ fontSize: 12.5, color: MUT }}>بانک</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{value.bankName || '—'}</span>
          </div>
          <div style={{ ...box, borderBottom: 'none' }}>
            <span style={{ fontSize: 12.5, color: MUT, display: 'flex', alignItems: 'center', gap: 5 }}>
              <CreditCard size={12} /> شبا
            </span>
            <span className="bh-latin" style={{ fontSize: 12.5, fontWeight: 700, color: INK, direction: 'ltr', fontFamily: 'monospace' }}>
              {value.iban}
            </span>
          </div>

          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, cursor: 'pointer',
            background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px',
          }}>
            <input type="checkbox" checked={value.confirmed}
              onChange={e => onChange({ ...value, confirmed: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: '#C7A66A', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12.5, color: INK, lineHeight: 1.9 }}>
              اطلاعات بانکی بالا را بررسی کردم و درست است. تسویه‌ی درآمد رزروها به همین شبا انجام شود.
            </span>
          </label>
        </div>
      )}

      {!verified && !err && (
        <p style={{ fontSize: 11.5, color: MUT, marginTop: 8, lineHeight: 1.9 }}>
          کارت باید به نام خودتان باشد. پس از استعلام، نام صاحب حساب و شبا خودکار
          پر می‌شوند و قابل تغییر نیستند.
        </p>
      )}
    </div>
  )
}
