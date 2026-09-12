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
/* ⚠️ تقویمِ فارسی از قبل در پروژه هست — نسخه‌ی دوم نساز. همین
   کامپوننت را فرمِ مسابقه هم استفاده می‌کند و `direction="future"`
   روزهای گذشته را می‌بندد. */
import JalaliDatePicker from '../ui/JalaliDatePicker'
import { normalizeDigits } from '../../lib/text-fa'
import { CalendarPlus, Loader2, Check } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { useAuthStore } from '../../store/auth.store'
import { tehranInstant, jalaliToGregorian, toFaDigits } from '../../lib/jalali'

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
  /* مقدارِ تقویم به شکلِ «۱۴۰۵/۶/۲۲»؛ `day` شکلِ میلادیِ همان است
     چون قرارداد با سرور همان است. */
  const [jDate, setJDate] = useState('')
  const [time, setTime] = useState('')
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

  /* «۱۴۰۵/۶/۲۲» ⟵ «2026-09-13» */
  const day = useMemo(() => {
    if (!jDate) return ''
    const [jy, jm, jd] = normalizeDigits(jDate).split('/').map(Number)
    if (!jy || !jm || !jd) return ''
    const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd)
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
  }, [jDate])

  /* ⚠️ بعد از `day` اعلام می‌شود، نه کنارِ stateها: `day` دیگر state
     نیست بلکه از تقویم مشتق می‌شود. */
  const when = day && time ? `${day}T${time}` : ''

  /* ── نیم‌ساعت‌های روزِ انتخاب‌شده ──
     ⚠️ ساعتِ گذشته فقط *غیرفعال* می‌شود، نه حذف: جای خالی در شبکه
     به کاربر می‌گوید آن ساعت وجود دارد ولی گذشته، و این از
     ناپدیدشدنِ بی‌توضیح بهتر است. */
  const slots = useMemo(() => {
    const out: { value: string; label: string; past: boolean }[] = []
    for (let h = 8; h <= 23; h++) {
      for (const m of ['00', '30']) {
        const v = `${String(h).padStart(2, '0')}:${m}`
        /* ⚠️ `day === minDate` تنها کافی نیست: روزی که کاملا گذشته
           هم ممکن است انتخاب شود. تقویم «امروز» را از ساعتِ
           **دستگاه** می‌گیرد نه تهران، پس دستگاهی که عقب‌تر است
           روزی را باز نشان می‌دهد که در تهران تمام شده؛ و بینِ
           ۲۳:۲۹ تا ۲۳:۵۹ خودِ `minDate` فردا می‌شود. */
        out.push({ value: v, label: toFaDigits(v), past: day < minDate || (day === minDate && v < minTime) })
      }
    }
    return out
  }, [day, minDate, minTime])

  /* ⚠️ `minLocal` هر رندر دوباره حساب می‌شود، پس با گذرِ زمان ساعتِ
     انتخاب‌شده می‌تواند گذشته شود. آن‌وقت تراشه انتخاب‌شده می‌ماند
     ولی زمانِ گذشته پست می‌شود. */
  useEffect(() => {
    if (time && slots.some(t => t.value === time && t.past)) setTime('')
  }, [slots, time])

  const submit = async () => {
    /* ⚠️ افکتِ پاک‌سازی فقط وقتی کار می‌کند که رندرِ تازه‌ای رخ دهد،
       و این فرم هیچ تیکی ندارد: کاربر می‌تواند ساعت ۱۴:۰۰ را
       انتخاب کند، بنشیند تا ۱۴:۱۰ و بزند. تنها جایی که قطعا اجرا
       می‌شود همین‌جاست. */
    const floor = new Date(Date.now() + 31 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Asia/Tehran' }).slice(0, 16).replace(' ', 'T')
    if (when < floor) {
      setTime(''); setErr('این ساعت گذشته است؛ ساعت دیگری انتخاب کنید'); return
    }
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
          /* ⚠️ این دکمه روی نوارِ *تیره*ی رزرو می‌نشیند، نه روی کارتِ
             سفید. تینتِ طلاییِ ۱۲٪ با متنِ #8F6531 آن‌جا ۲٫۹:۱ می‌داد.
             پرِ توپر هم کنتراست را حل می‌کند هم کنشِ اصلیِ صفحه را
             آن‌طور که باید پررنگ می‌کند. */
          fontSize: 13.5, fontWeight: 800, color: '#2A1E08',
          background: '#F4E3BC', border: '1px solid rgba(255,255,255,0.22)',
        }}>
        <CalendarPlus size={16} /> درخواست جلسه
      </button>
    )
  }

  return (
    <div style={{ border: LINE, borderRadius: 12, padding: 14, background: '#FAFAF7' }}>
      {/* ⚠️ `datetime-local` تقویمِ میلادی و ارقامِ لاتینِ مرورگر را
          می‌آورد — وسطِ فرمِ فارسی. حالا تقویمِ فارسیِ خودِ پروژه، و
          ساعت به‌جای فهرستِ کشویی یک شبکه‌ی تراشه. */}
      <JalaliDatePicker id="sess-date" label="تاریخ" direction="future"
        placeholder="انتخاب تاریخ" value={jDate} onChange={setJDate} />

      <p id="sess-time-h" style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, margin: '14px 0 8px' }}>ساعت</p>
      {!day
        ? <p style={{ fontSize: 12, color: MUT, margin: 0 }}>اول تاریخ را انتخاب کنید</p>
        : slots.every(t => t.past)
          ? <p style={{ fontSize: 12, color: RED, margin: 0 }}>این روز گذشته است؛ روز دیگری انتخاب کنید</p>
        : (
          <div role="group" aria-labelledby="sess-time-h"
            className="sess-slots">
            {slots.map(t => (
              /* ⚠️ کلاس، نه استایلِ اینلاین: چهار حالتِ لازمِ پروژه —
                 به‌ویژه `:hover` — با اینلاین قابل بیان نیست. */
              <button key={t.value} type="button" className="sess-slot" disabled={t.past}
                onClick={() => setTime(t.value)} aria-pressed={time === t.value}
                data-on={time === t.value ? '1' : undefined}>
                {t.label}
              </button>
            ))}
          </div>
        )}

      <label htmlFor="sess-note" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: TEXT, margin: '12px 0 6px' }}>
        توضیح (اختیاری)
      </label>
      <textarea id="sess-note" value={note} onChange={e => setNote(e.target.value.slice(0, 500))} rows={2}
        placeholder="مثلا: سطح مبتدی، تمرکز روی ضربه‌ی پایه"
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: LINE, background: '#fff', fontSize: 13.5, fontFamily: 'inherit', color: TEXT, resize: 'vertical' }} />

      <p style={{ fontSize: 12, color: MUT, lineHeight: 1.9, margin: '10px 0 0' }}>
        مدت جلسه {fa(minutes)} دقیقه ، مبلغ{' '}
        {price > 0 ? `${fa(price.toLocaleString('en-US'))} تومان` : 'توافقی'}
        {' '}و پرداخت حضوری است و از طریق پلتفرم انجام نمی‌شود
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
