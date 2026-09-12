'use client'

/* درخواست جلسه‌ی مربی — سمت شاگرد.

   ── چرا فرم کوچک و نه تقویم ──
   تقویم در دسترس‌بودن مربی هنوز ساخته نشده. تا آن روز، شاگرد زمان
   پیشنهادی می‌فرستد و مربی تأیید یا رد می‌کند — همان چیزی که امروز
   هم در واقعیت بینشان می‌گذرد، فقط ثبت‌شده. ساختن تقویمی که پشتش
   داده‌ی در دسترس‌بودن نیست، فقط وعده‌ی دروغ می‌دهد.

   ⚠️ پرداخت درون‌سایتی نیست و همین‌جا هم صریح نوشته می‌شود؛ مبلغ
   حضوری تسویه می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import { CalendarPlus, Loader2, Check } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { useAuthStore } from '../../store/auth.store'
import { tehranInstant, toJalali, J_MONTHS, J_DAY_NAMES, toFaDigits } from '../../lib/jalali'

const GOLD_D = '#8F6531', TEXT = '#1C1B17', MUT = '#6F6A5C', RED = '#B23B2E', GREEN = '#0E7A38'
const LINE = '1px solid #EAE5DA'

const fa = (v: string | number) => String(v ?? '').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)

export default function SessionRequest({ coachSlug, price, minutes }: {
  coachSlug: string
  /** مبلغ توافقی جلسه — صفر یعنی مربی مبلغی اعلام نکرده */
  price: number
  minutes: number
}) {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  /* ⚠️ روز و ساعت جدا نگه داشته می‌شوند و فقط لحظه‌ی ارسال به هم
     می‌چسبند. `when` همان قرارداد قبلی را دارد ("YYYY-MM-DDTHH:MM")
     چون `tehranInstant` همان را می‌خواهد. */
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
  const when = day && time ? `${day}T${time}` : ''
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  /* کف انتخاب‌پذیر فرم = همان کفی که سرور می‌پذیرد (نیم‌ساعت بعد)،
     به وقت تهران. بدونش کاربر زمانی را انتخاب می‌کند و بعد ارسال
     ۴۰۰ می‌گیرد. */
  const minLocal = new Date(Date.now() + 31 * 60 * 1000)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Tehran' }).slice(0, 16)
  const minDate = minLocal.slice(0, 10)
  const minTime = minLocal.slice(11, 16)
  /* ⚠️ «امروز» را نمی‌شود از روی `minDate` فهمید: `minDate` کفِ
     مجاز است (اکنون + ۳۱ دقیقه)، پس از ۲۳:۲۹ به بعد خودش فردا
     می‌شود و برچسبِ «امروز» یک روز جلو می‌افتاد — کاربر روزی را
     رزرو می‌کرد که برچسب خلافش را می‌گفت. */
  const todayTehran = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Tehran' }).slice(0, 10)

  /* ── نیم‌ساعت‌های یک روز ──
     ⚠️ برای *امروز* ساعت‌های گذشته حذف می‌شوند، وگرنه کاربر زمانی
     می‌فرستد که سرور با ۴۰۰ ردش می‌کند. */
  const slotsFor = (value: string) => {
    const out: { value: string; label: string }[] = []
    for (let h = 8; h <= 23; h++) {
      for (const m of ['00', '30']) {
        const v = `${String(h).padStart(2, '0')}:${m}`
        if (value === minDate && v < minTime) continue
        out.push({ value: v, label: toFaDigits(v) })
      }
    }
    return out
  }

  /* ── روزهای پیشِ رو، با نامِ فارسی ──
     ⚠️ لنگر ظهرِ UTC است نه نیمه‌شب: با نیمه‌شب، جمع‌کردنِ ۲۴ ساعت در
     مرزِ تغییرِ ساعت یک روز جا می‌اندازد یا تکرار می‌کند.
     ⚠️ `J_DAY_NAMES` از شنبه شروع می‌شود ولی `getUTCDay` از یک‌شنبه،
     پس اندیس یک واحد می‌چرخد.
     ⚠️ روزی که هیچ ساعتی برایش نمانده اصلا نمی‌آید — وگرنه کاربر
     «امروز» را می‌زد و به فهرستِ ساعتِ خالی می‌رسید بی‌هیچ توضیحی. */
  const days = useMemo(() => {
    const out: { value: string; label: string }[] = []
    const base = Date.parse(minDate + 'T12:00:00Z')
    for (let i = 0; i < 31 && out.length < 30; i++) {
      const d = new Date(base + i * 86400000)
      const gy = d.getUTCFullYear(), gm = d.getUTCMonth() + 1, gd = d.getUTCDate()
      const value = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
      if (slotsFor(value).length === 0) continue
      const [jy, jm, jd] = toJalali(gy, gm, gd)
      const dayName = J_DAY_NAMES[(d.getUTCDay() + 1) % 7]
      const dayNum = `${toFaDigits(jd)} ${J_MONTHS[jm - 1]}`
      const tomorrow = new Date(Date.parse(todayTehran + 'T12:00:00Z') + 86400000)
        .toISOString().slice(0, 10)
      const label = value === todayTehran ? `امروز · ${dayName} ${dayNum}`
        : value === tomorrow ? `فردا · ${dayName} ${dayNum}`
          : `${dayName} ${dayNum} ${toFaDigits(jy)}`
      out.push({ value, label })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate, minTime, todayTehran])

  const times = useMemo(() => (day ? slotsFor(day) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day, minDate, minTime])

  /* ⚠️ `minLocal` هر رندر دوباره حساب می‌شود، پس با گذرِ زمان یک
     گزینه‌ی انتخاب‌شده می‌تواند از فهرست بیفتد. آن‌وقت `select` خالی
     دیده می‌شود ولی `when` هنوز پر است و دکمه فعال می‌ماند و
     زمانِ گذشته پست می‌شود. */
  useEffect(() => {
    if (day && !days.some(d => d.value === day)) { setDay(''); setTime(''); return }
    if (time && !times.some(t => t.value === time)) setTime('')
  }, [days, times, day, time])

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
      {/* ⚠️ `datetime-local` تقویمِ میلادی و ارقامِ لاتینِ مرورگر را
          می‌آورد — وسطِ فرمِ فارسی. حالا مثل رزروِ میزِ باشگاه: روز با
          نامِ فارسی و ساعت با ارقامِ فارسی. */}
      <label htmlFor="sess-day" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
        روز
      </label>
      <select id="sess-day" value={day} onChange={e => { setDay(e.target.value); setTime('') }}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: LINE, background: '#fff', fontSize: 13.5, fontFamily: 'inherit', color: TEXT }}>
        <option value="">انتخاب کنید</option>
        {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>

      <label htmlFor="sess-time" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: TEXT, margin: '12px 0 6px' }}>
        ساعت
      </label>
      <select id="sess-time" value={time} onChange={e => { if (day) setTime(e.target.value) }}
        aria-disabled={!day} aria-describedby={!day ? 'sess-time-hint' : undefined}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: LINE, background: day ? '#fff' : '#F3F1EB', fontSize: 13.5, fontFamily: 'inherit', color: day ? TEXT : MUT }}>
        <option value="">{day ? 'انتخاب کنید' : 'اول روز را انتخاب کنید'}</option>
        {times.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      {!day && <p id="sess-time-hint" style={{ fontSize: 11.5, color: MUT, margin: '6px 0 0' }}>
        اول روز را انتخاب کنید
      </p>}

      <label htmlFor="sess-note" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: TEXT, margin: '12px 0 6px' }}>
        توضیح (اختیاری)
      </label>
      <textarea id="sess-note" value={note} onChange={e => setNote(e.target.value.slice(0, 500))} rows={2}
        placeholder="مثلا: سطح مبتدی، تمرکز روی ضربه‌ی پایه"
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
