'use client'

/* درخواستِ جلسه‌ی مربی — سمتِ شاگرد.

   ── چرا فرمِ کوچک و نه تقویم ──
   تقویمِ در دسترس‌بودنِ مربی هنوز ساخته نشده. تا آن روز، شاگرد زمانِ
   پیشنهادی می‌فرستد و مربی تأیید یا رد می‌کند — همان چیزی که امروز
   هم در واقعیت بینشان می‌گذرد، فقط ثبت‌شده. ساختنِ تقویمی که پشتش
   داده‌ی در دسترس‌بودن نیست، فقط وعده‌ی دروغ می‌دهد.

   ⚠️ پرداخت درون‌سایتی نیست و همین‌جا هم صریح نوشته می‌شود؛ مبلغ
   حضوری تسویه می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useState } from 'react'
import { CalendarPlus, Loader2, Check } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { useAuthStore } from '../../store/auth.store'
import { tehranInstant } from '../../lib/jalali'

const GOLD_D = '#8F6531', TEXT = '#1C1B17', MUT = '#6F6A5C', RED = '#B23B2E', GREEN = '#0E7A38'
const LINE = '1px solid #EAE5DA'

const fa = (v: string | number) => String(v ?? '').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)

export default function SessionRequest({ coachSlug, price, minutes }: {
  coachSlug: string
  /** مبلغِ توافقیِ جلسه — صفر یعنی مربی مبلغی اعلام نکرده */
  price: number
  minutes: number
}) {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [when, setWhen] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  /* کفِ انتخاب‌پذیرِ فرم = همان کفی که سرور می‌پذیرد (نیم‌ساعت بعد)،
     به وقتِ تهران. بدونش کاربر زمانی را انتخاب می‌کند و بعدِ ارسال
     ۴۰۰ می‌گیرد. */
  const minWhen = new Date(Date.now() + 31 * 60 * 1000)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Tehran' }).slice(0, 16).replace(' ', 'T')

  const submit = async () => {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch('/api/coach/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachSlug, startsAt: tehranInstant(when).toISOString(), note }),
      })
      const j = await r.json().catch(() => ({})) as { message?: string }
      if (!r.ok) { setErr(j.message ?? 'ثبت درخواست انجام نشد'); return }
      setDone(true); setOpen(false)
    } catch { setErr('ارتباط با سرور برقرار نشد') } finally { setBusy(false) }
  }

  if (done) {
    return (
      <p style={{ fontSize: 13, color: GREEN, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Check size={15} /> درخواست ثبت شد؛ منتظر تأیید مربی بمانید.
      </p>
    )
  }

  if (!open) {
    return (
      <button type="button" onClick={() => (user ? setOpen(true) : (window.location.href = '/login'))}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          width: '100%', height: 44, borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13.5, fontWeight: 800, color: GOLD_D,
          background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
        }}>
        <CalendarPlus size={16} /> درخواست جلسه
      </button>
    )
  }

  return (
    <div style={{ border: LINE, borderRadius: 12, padding: 14, background: '#FAFAF7' }}>
      <label htmlFor="sess-when" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
        زمان پیشنهادی
      </label>
      {/* ورودیِ زمان لاتین است و باید چپ‌به‌راست بماند */}
      <input id="sess-when" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} dir="ltr" min={minWhen}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: LINE, background: '#fff', fontSize: 13.5, fontFamily: 'inherit', color: TEXT }} />

      <label htmlFor="sess-note" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: TEXT, margin: '12px 0 6px' }}>
        توضیح (اختیاری)
      </label>
      <textarea id="sess-note" value={note} onChange={e => setNote(e.target.value.slice(0, 500))} rows={2}
        placeholder="مثلاً: سطح مبتدی، تمرکز روی ضربه‌ی پایه"
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: LINE, background: '#fff', fontSize: 13.5, fontFamily: 'inherit', color: TEXT, resize: 'vertical' }} />

      <p style={{ fontSize: 12, color: MUT, lineHeight: 1.9, margin: '10px 0 0' }}>
        مدت جلسه {fa(minutes)} دقیقه
        {price > 0 ? ` · مبلغ ${fa(price.toLocaleString('en-US'))} تومان` : ' · مبلغ توافقی'}.
        {' '}پرداخت حضوری است و از طریق سایت انجام نمی‌شود.
      </p>

      {err && <p role="alert" style={{ fontSize: 12.5, color: RED, fontWeight: 700, margin: '8px 0 0' }}>{err}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => void submit()} disabled={busy || !when}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#C7A66A', color: '#241B08', fontSize: 13, fontWeight: 800, cursor: busy || !when ? 'default' : 'pointer', opacity: busy || !when ? 0.6 : 1, fontFamily: 'inherit' }}>
          {busy ? <Loader2 size={14} className="ch-spin" /> : <CalendarPlus size={14} />} ثبت درخواست
        </button>
        <button type="button" onClick={() => { setOpen(false); setErr('') }}
          style={{ padding: '9px 16px', borderRadius: 10, border: LINE, background: '#fff', color: GOLD_D, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          انصراف
        </button>
      </div>
    </div>
  )
}
