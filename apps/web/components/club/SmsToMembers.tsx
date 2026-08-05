'use client'

/* ─────────────────────────────────────────────────────────────
   ارسال پیامک به اعضای باشگاه.

   باشگاه‌دار یکی از متن‌های آماده را برمی‌دارد، مقدارها را پر می‌کند،
   **متنِ واقعی و مبلغِ دقیق** را می‌بیند، بعد پرداخت می‌کند.

   پیش‌نمایش سرورساز است، نه ساختِ همین صفحه: مبلغ و متن باید همانی
   باشد که واقعاً فرستاده می‌شود. اگر این‌جا حساب می‌شد، یک اختلافِ
   کوچک یعنی کاربر چیزی می‌بیند و چیز دیگری می‌خرد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageSquare, Loader2, Send, Users, AlertCircle, Info, Check, X } from 'lucide-react'
import JalaliDatePicker from '../ui/JalaliDatePicker'
import { apiFetch } from '../../lib/http'
import { toFaDigits } from '../../lib/jalali'
import type { ClubTemplate } from '../../lib/sms/club-templates'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const fa = (n: unknown) => toFaDigits(Math.round(Number(n) || 0).toLocaleString('en-US'))

interface Estimate {
  recipients: number; unitPrice: number; setupFee: number
  total: number; maxParts: number; sample: string
}
interface History {
  id: string; template_key: string; recipient_count: number; total_amount: number
  status: string; sent_count: number; failed_count: number; created_at: string
}
interface Payload {
  templates: ClubTemplate[]
  pricing: { unitPrice: number; setupFee: number; enabled: boolean }
  estimate: Estimate | { error: string } | null
  history: History[]
}

const STATUS_FA: Record<string, { t: string; c: string }> = {
  PENDING_PAYMENT: { t: 'در انتظار پرداخت', c: MUT },
  PAID: { t: 'پرداخت شد', c: GOLD_D },
  SENDING: { t: 'در حال ارسال', c: GOLD_D },
  SENT: { t: 'ارسال شد', c: FELT },
  FAILED: { t: 'ناموفق', c: RED },
  CANCELED: { t: 'لغو شد', c: MUT },
}

export default function SmsToMembers({ clubId }: { clubId: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [tplKey, setTplKey] = useState('')
  const [args, setArgs] = useState<string[]>([])
  const [est, setEst] = useState<Estimate | { error: string } | null>(null)
  const [estBusy, setEstBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(false)

  const tpl = useMemo(
    () => data?.templates.find(t => t.key === tplKey) ?? null,
    [data, tplKey])

  /* بارگذاری اولیه */
  useEffect(() => {
    void apiFetch(`/api/clubs/${clubId}/sms`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j) setData(j) })
      .catch(() => setErr('خطا در دریافت اطلاعات'))
  }, [clubId])

  /* برآورد — با تأخیر، تا هر حرفِ تایپ‌شده یک درخواست نسازد */
  const refreshEstimate = useCallback(async (key: string, a: string[]) => {
    if (!key) { setEst(null); return }
    setEstBusy(true)
    try {
      const r = await apiFetch(
        `/api/clubs/${clubId}/sms?template=${encodeURIComponent(key)}&args=${encodeURIComponent(JSON.stringify(a))}`,
        { cache: 'no-store' })
      const j = await r.json().catch(() => null)
      setEst(j?.estimate ?? null)
    } catch { /* برآورد شکست بخورد، فرم نباید بشکند */ } finally { setEstBusy(false) }
  }, [clubId])

  useEffect(() => {
    const t = setTimeout(() => void refreshEstimate(tplKey, args), 420)
    return () => clearTimeout(t)
  }, [tplKey, args, refreshEstimate])

  const pickTemplate = (k: string) => {
    setTplKey(k); setErr('')
    const t = data?.templates.find(x => x.key === k)
    setArgs(new Array(t?.fields.length ?? 0).fill(''))
  }

  const complete = !!tpl && args.length === tpl.fields.length && args.every(v => v.trim())
  const ok = est && !('error' in est) ? est : null

  const pay = async () => {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch(`/api/clubs/${clubId}/sms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: tplKey, args }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.redirectUrl) { setErr(j?.message || 'ثبت سفارش انجام نشد'); setConfirm(false); return }
      window.location.href = j.redirectUrl
    } catch { setErr('خطا در ارتباط با سرور'); setConfirm(false) } finally { setBusy(false) }
  }

  if (!data) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 44 }}>
        <Loader2 size={20} className="animate-spin" style={{ color: MUT }} />
      </div>
    )
  }

  if (!data.pricing.enabled) {
    return (
      <div style={{
        display: 'flex', gap: 9, alignItems: 'flex-start', border: `1px solid ${LINE}`,
        borderRadius: 14, padding: '14px 16px', background: '#FAFAF7',
        fontSize: 12.5, color: SEC, lineHeight: 2,
      }}>
        <Info size={16} style={{ color: MUT, flexShrink: 0, marginTop: 3 }} />
        ارسال پیامک به اعضا هنوز فعال نشده است. پس از فعال‌سازی توسط مدیریت سایت،
        از همین‌جا می‌توانید به اعضای باشگاه خود پیامک بفرستید.
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <MessageSquare size={18} style={{ color: GOLD_D }} />
        <h3 style={{ fontSize: 15.5, fontWeight: 900, color: INK, margin: 0 }}>پیامک به اعضا</h3>
      </div>
      <p style={{ fontSize: 12, color: MUT, lineHeight: 2, margin: '0 0 16px', maxWidth: 640 }}>
        پیامک با نام هر عضو، به شماره‌ی ثبت‌شده در پروفایل خودش فرستاده می‌شود.
        اعضایی که دریافت پیامک باشگاه را خاموش کرده‌اند در فهرست نمی‌آیند و
        هزینه‌ای هم بابتشان حساب نمی‌شود.
      </p>

      {/* ── انتخاب متن ── */}
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', marginBottom: 16 }}>
        {data.templates.map(t => {
          const on = t.key === tplKey
          return (
            <button
              key={t.key} type="button" onClick={() => pickTemplate(t.key)}
              style={{
                border: '1px solid', borderColor: on ? 'rgba(199,166,106,0.44)' : LINE,
                background: on ? 'rgba(199,166,106,0.10)' : '#fff',
                borderRadius: 13, padding: '12px 14px', cursor: 'pointer', textAlign: 'right',
                fontFamily: 'var(--font-base)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                display: 'grid', placeItems: 'center',
                border: `1px solid ${on ? GOLD_D : LINE}`,
                background: on ? GOLD_D : 'transparent', color: '#fff',
              }}>{on ? <Check size={12} /> : null}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: on ? GOLD_D : SEC }}>{t.title}</span>
            </button>
          )
        })}
      </div>

      {/* ── مقدارها ── */}
      {tpl ? (
        <div style={{
          border: `1px solid ${LINE}`, borderRadius: 15, padding: '15px 16px', marginBottom: 14,
        }}>
          <div style={{ display: 'grid', gap: 13, gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
            {tpl.fields.map((f, i) => (
              <div key={f.index}>
                {f.type === 'jalali' ? (
                  <JalaliDatePicker
                    id={`sms-f-${f.index}`} label={f.label} value={args[i] ?? ''}
                    onChange={v => setArgs(a => a.map((x, j) => (j === i ? v : x)))}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>
                      {f.label}
                    </label>
                    <input
                      value={args[i] ?? ''}
                      onChange={e => setArgs(a => a.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={f.placeholder} maxLength={f.maxLength ?? 40}
                      inputMode={f.type === 'number' ? 'numeric' : undefined}
                      style={{
                        width: '100%', boxSizing: 'border-box', border: `1px solid ${LINE}`,
                        borderRadius: 11, padding: '10px 12px', fontSize: 13.5,
                        fontFamily: 'var(--font-base)', color: INK, outline: 'none', background: '#FCFBF8',
                      }} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── پیش‌نمایش و هزینه ── */}
      {tplKey ? (
        <div style={{
          border: `1px solid ${LINE}`, borderRadius: 15, overflow: 'hidden', marginBottom: 14,
        }}>
          <div style={{
            padding: '11px 15px', borderBottom: `1px solid ${LINE}`, background: '#FAFAF7',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: SEC, flex: 1 }}>پیش‌نمایش پیامک</span>
            {estBusy ? <Loader2 size={13} className="animate-spin" style={{ color: MUT }} /> : null}
          </div>

          {est && 'error' in est ? (
            <div style={{ padding: '14px 15px', fontSize: 12.5, color: RED, lineHeight: 1.9 }}>
              {est.error}
            </div>
          ) : ok ? (
            <>
              <pre style={{
                margin: 0, padding: '14px 15px', fontSize: 13, lineHeight: 2.05, color: INK,
                fontFamily: 'var(--font-base)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                background: '#fff',
              }}>{ok.sample}</pre>

              <div style={{
                borderTop: `1px solid ${LINE}`, padding: '13px 15px', background: '#FCFBF8',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <Row icon={<Users size={13} />} label="گیرندگان" value={`${toFaDigits(ok.recipients)} عضو`} />
                <Row label={`هزینه‌ی هر پیامک × ${toFaDigits(ok.recipients)}`} value={`${fa(ok.unitPrice * ok.recipients)} تومان`} />
                <Row label="هزینه‌ی اولیه" value={`${fa(ok.setupFee)} تومان`} />
                <div style={{ height: 1, background: LINE, margin: '2px 0' }} />
                <Row bold label="مبلغ قابل پرداخت" value={`${fa(ok.total)} تومان`} />

                {ok.maxParts > 1 ? (
                  <p style={{
                    display: 'flex', gap: 7, alignItems: 'flex-start',
                    fontSize: 11.5, color: MUT, lineHeight: 1.95, margin: '4px 0 0',
                  }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: 3 }} />
                    این متن روی گوشی در {toFaDigits(ok.maxParts)} بخش دریافت می‌شود؛
                    هزینه‌ای که پرداخت می‌کنید تغییری نمی‌کند.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div style={{ padding: '18px 15px', fontSize: 12.5, color: MUT, lineHeight: 1.9 }}>
              مقدارها را پر کنید تا متن و هزینه‌ی دقیق را ببینید.
            </div>
          )}
        </div>
      ) : null}

      {err ? (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', color: RED, fontSize: 12.5,
          background: 'rgba(178,59,46,0.06)', borderRadius: 12, padding: '10px 14px', marginBottom: 12,
        }}>
          <AlertCircle size={15} /> {err}
        </div>
      ) : null}

      <button
        type="button" onClick={() => setConfirm(true)}
        disabled={!complete || !ok || busy}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid', borderColor: complete && ok ? 'rgba(199,166,106,0.34)' : LINE,
          background: complete && ok ? 'rgba(199,166,106,0.12)' : '#F7F6F2',
          color: complete && ok ? GOLD_D : MUT, borderRadius: 11,
          padding: '11px 20px', fontSize: 13.5, fontWeight: 800,
          fontFamily: 'var(--font-base)', cursor: complete && ok ? 'pointer' : 'not-allowed',
        }}>
        <Send size={15} />
        {ok ? `پرداخت ${fa(ok.total)} تومان و ارسال` : 'پرداخت و ارسال'}
      </button>

      {/* ── تأیید نهایی ──
          ارسالِ انبوه برگشت‌پذیر نیست: وقتی رفت، رفت. یک گامِ تأیید
          با عددِ گیرنده جلوی «اشتباهی زدم» را می‌گیرد. */}
      {confirm && ok ? (
        <div
          onClick={() => !busy && setConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(28,27,23,0.44)',
            display: 'grid', placeItems: 'center', padding: 18,
          }}>
          <div onClick={e => e.stopPropagation()} dir="rtl" style={{
            width: '100%', maxWidth: 400, background: '#fff', borderRadius: 18,
            padding: '20px 20px 18px', fontFamily: 'var(--font-base)',
            boxShadow: '0 10px 44px rgba(28,27,23,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <Send size={17} style={{ color: GOLD_D }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 900, color: INK }}>تأیید ارسال</span>
              <button type="button" onClick={() => setConfirm(false)} disabled={busy} aria-label="بستن" style={{
                border: 'none', background: '#F5F3EE', color: SEC, borderRadius: 9,
                width: 28, height: 28, display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}><X size={15} /></button>
            </div>

            <p style={{ fontSize: 13, color: SEC, lineHeight: 2.1, margin: '0 0 16px' }}>
              پیامک به <b style={{ color: INK }}>{toFaDigits(ok.recipients)} عضو</b> باشگاه فرستاده می‌شود
              و مبلغ <b style={{ color: INK }}>{fa(ok.total)} تومان</b> از شما دریافت می‌گردد.
              <br />
              <span style={{ fontSize: 11.5, color: MUT }}>
                پس از ارسال، امکان بازگشت یا لغو وجود ندارد.
              </span>
            </p>

            <div style={{ display: 'flex', gap: 9 }}>
              <button type="button" onClick={() => void pay()} disabled={busy} style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)',
                color: GOLD_D, borderRadius: 11, padding: '11px 16px', fontSize: 13, fontWeight: 800,
                fontFamily: 'var(--font-base)', cursor: busy ? 'wait' : 'pointer',
              }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                رفتن به درگاه
              </button>
              <button type="button" onClick={() => setConfirm(false)} disabled={busy} style={{
                border: `1px solid ${LINE}`, background: '#fff', color: SEC, borderRadius: 11,
                padding: '11px 18px', fontSize: 13, fontWeight: 800,
                fontFamily: 'var(--font-base)', cursor: 'pointer',
              }}>انصراف</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── تاریخچه ── */}
      {data.history.length ? (
        <div style={{ marginTop: 26 }}>
          <h4 style={{ fontSize: 13, fontWeight: 900, color: INK, margin: '0 0 10px' }}>ارسال‌های پیشین</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {data.history.map(h => {
              const s = STATUS_FA[h.status] ?? { t: h.status, c: MUT }
              const title = data.templates.find(t => t.key === h.template_key)?.title ?? h.template_key
              return (
                <div key={h.id} style={{
                  display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                  border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 13px',
                }}>
                  <span style={{ flex: '1 1 130px', fontSize: 12.5, fontWeight: 800, color: INK }}>{title}</span>
                  <span style={{ fontSize: 11.5, color: MUT }}>
                    {toFaDigits(h.sent_count || h.recipient_count)} گیرنده
                  </span>
                  <span style={{ fontSize: 11.5, color: MUT }}>{fa(h.total_amount)} تومان</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: s.c }}>{s.t}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Row({ label, value, bold, icon }: {
  label: string; value: string; bold?: boolean; icon?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: bold ? 13.5 : 12.5 }}>
      {icon ? <span style={{ color: MUT, display: 'inline-flex' }}>{icon}</span> : null}
      <span style={{ flex: 1, color: bold ? INK : SEC, fontWeight: bold ? 900 : 600 }}>{label}</span>
      <span style={{
        color: bold ? GOLD_D : SEC, fontWeight: bold ? 900 : 700,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  )
}
