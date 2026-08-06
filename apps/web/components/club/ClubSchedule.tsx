'use client'

/* ─────────────────────────────────────────────────────────────
   تقویم و گزارشِ رزرو — پنل باشگاه‌دار.

   ── چرا این‌طور ساخته شد ──
   خواسته «هر شب ساعت ۱۲ گزارشِ فردا» بود. کارِ شبانه ساخته نشد و
   دلیلش عمدی است: گزارشی که در لحظه محاسبه می‌شود همیشه درست است،
   ولی گزارشی که نیمه‌شب ساخته و ذخیره شود، با اولین رزرو یا لغوِ
   بامداد کهنه می‌گردد — و باشگاه‌دار روی عددی حساب می‌کند که دیگر
   درست نیست.

   پس «گزارشِ فردا» همیشه بالای همین تب است و نشانِ کنارِ نامِ تب
   تعدادش را می‌گوید، بدونِ اینکه لازم باشد باز شود.

   تقویم دقیقاً همان دو هفته‌ای را نشان می‌دهد که رزرو در آن مجاز
   است — عدد از یک منبعِ واحد می‌آید تا این دو هیچ‌وقت از هم جدا
   نیفتند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Loader2, Users, Clock, Phone, AlertCircle, Wallet } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { toFaDigits, faDate } from '../../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38'

const fa = (n: unknown) => toFaDigits(Math.round(Number(n) || 0).toLocaleString('en-US'))
const hh = (h: number | null) => (h === null ? '—' : toFaDigits(String(h).padStart(2, '0')) + ':۰۰')

interface Booking {
  id: string; reference: string | null; hours: number[]
  from: number | null; to: number | null
  table: string; customer: string; phone: string
  amount: number; clubAmount: number; status: string
}
interface Day { date: string; count: number; hours: number; revenue: number; bookings: Booking[] }
interface Payload { horizonDays: number; today: Day | null; tomorrow: Day | null; days: Day[] }

const WEEKDAY = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
const weekdayOf = (iso: string) => WEEKDAY[new Date(`${iso}T12:00:00`).getDay()] ?? ''

export default function ClubSchedule({ clubId }: { clubId: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [err, setErr] = useState('')
  const [openDate, setOpenDate] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/clubs/${clubId}/schedule`, { cache: 'no-store' })
      const j = await r.json().catch(() => null)
      if (!r.ok) { setErr(j?.message || 'دریافت تقویم انجام نشد'); return }
      setData(j); setErr('')
      /* روزِ فردا از اول باز باشد — همان چیزی که بیشتر از همه لازم است */
      setOpenDate(prev => prev ?? j?.days?.[1]?.date ?? null)
    } catch { setErr('خطا در ارتباط با سرور') }
  }, [clubId])
  useEffect(() => { void load() }, [load])

  const selected = useMemo(
    () => data?.days.find(d => d.date === openDate) ?? null,
    [data, openDate])

  if (err) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#B23B2E', fontSize: 13, padding: 16 }}>
        <AlertCircle size={16} /> {err}
      </div>
    )
  }
  if (!data) {
    return <div style={{ display: 'grid', placeItems: 'center', padding: 44 }}>
      <Loader2 size={20} className="animate-spin" style={{ color: MUT }} />
    </div>
  }

  const tomorrow = data.tomorrow

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>

      {/* ── گزارشِ فردا ── */}
      <div style={{
        border: `1px solid ${tomorrow?.count ? 'rgba(199,166,106,0.34)' : LINE}`,
        background: tomorrow?.count ? 'rgba(199,166,106,0.07)' : '#FAFAF7',
        borderRadius: 16, padding: '15px 17px', marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
          <CalendarDays size={17} style={{ color: GOLD_D }} />
          <span style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>گزارش فردا</span>
          {tomorrow ? (
            <span style={{ fontSize: 12, color: MUT }}>
              {weekdayOf(tomorrow.date)} · {faDate(tomorrow.date)}
            </span>
          ) : null}
        </div>

        {!tomorrow || tomorrow.count === 0 ? (
          <p style={{ fontSize: 12.5, color: SEC, margin: 0, lineHeight: 2 }}>
            برای فردا هیچ رزروی ثبت نشده است.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
              <Stat icon={<Users size={13} />} label="رزرو" value={`${toFaDigits(tomorrow.count)} مورد`} />
              <Stat icon={<Clock size={13} />} label="مجموع ساعت" value={toFaDigits(tomorrow.hours)} />
              <Stat icon={<Wallet size={13} />} label="سهم شما" value={`${fa(tomorrow.revenue)} تومان`} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {tomorrow.bookings.map(b => <Row key={b.id} b={b} />)}
            </div>
          </>
        )}
      </div>

      {/* ── تقویمِ دو هفته ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: INK, margin: 0 }}>تقویم رزرو</h3>
        <span style={{ fontSize: 11.5, color: MUT }}>
          {toFaDigits(data.horizonDays)} روز آینده — رزرو بیش از این بازه ممکن نیست
        </span>
      </div>

      <div style={{
        display: 'grid', gap: 7, marginBottom: 16,
        gridTemplateColumns: 'repeat(auto-fill,minmax(92px,1fr))',
      }}>
        {data.days.map((d, i) => {
          const on = d.date === openDate
          const busy = d.count > 0
          return (
            <button key={d.date} type="button" onClick={() => setOpenDate(d.date)}
              style={{
                border: '1px solid', borderRadius: 12, padding: '9px 8px', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'center', lineHeight: 1.7,
                borderColor: on ? 'rgba(199,166,106,0.5)' : busy ? 'rgba(14,122,56,0.24)' : LINE,
                background: on ? 'rgba(199,166,106,0.14)' : busy ? 'rgba(14,122,56,0.05)' : '#fff',
              }}>
              <div style={{ fontSize: 10.5, color: MUT }}>
                {i === 0 ? 'امروز' : i === 1 ? 'فردا' : weekdayOf(d.date)}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: INK }}>
                {toFaDigits(new Date(`${d.date}T12:00:00`).toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' }))}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 800, marginTop: 2,
                color: busy ? FELT : 'rgba(0,0,0,0.22)',
              }}>
                {busy ? `${toFaDigits(d.count)} رزرو` : 'خالی'}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── روزِ انتخاب‌شده ──
          وقتی همان «فردا» انتخاب است، این کادر عیناً کادرِ بالا را
          تکرار می‌کند. برای روزهای دیگر لازم است، پس فقط در همان یک
          حالت پنهان می‌شود. */}
      {selected && selected.date !== tomorrow?.date ? (
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 15, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>
              {weekdayOf(selected.date)} · {faDate(selected.date)}
            </span>
            {selected.count ? (
              <span style={{ fontSize: 11.5, color: MUT }}>
                {toFaDigits(selected.count)} رزرو · {toFaDigits(selected.hours)} ساعت · {fa(selected.revenue)} تومان
              </span>
            ) : null}
          </div>

          {selected.count === 0 ? (
            <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 2 }}>
              این روز هیچ رزروی ندارد.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {selected.bookings.map(b => <Row key={b.id} b={b} />)}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
      <span style={{ color: MUT, display: 'inline-flex' }}>{icon}</span>
      <span style={{ color: MUT }}>{label}:</span>
      <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{value}</b>
    </span>
  )
}

function Row({ b }: { b: Booking }) {
  return (
    <div style={{
      display: 'flex', gap: 11, alignItems: 'center', flexWrap: 'wrap',
      border: `1px solid ${LINE}`, borderRadius: 12, padding: '9px 13px', background: '#fff',
    }}>
      <span style={{
        fontSize: 12.5, fontWeight: 900, color: GOLD_D, whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
      }}>{hh(b.from)} – {hh(b.to)}</span>

      <span style={{ fontSize: 12.5, color: SEC, flex: '1 1 110px', minWidth: 0 }}>
        {b.table}
      </span>

      <span style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{b.customer}</span>

      {/* شماره‌ی مشتری — باشگاه‌دار باید بتواند تماس بگیرد */}
      {b.phone ? (
        <a href={`tel:${b.phone}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none',
          fontSize: 11.5, color: MUT, direction: 'ltr',
        }}><Phone size={11} />{toFaDigits(b.phone)}</a>
      ) : null}

      <span style={{
        marginInlineStart: 'auto', fontSize: 11.5, color: MUT,
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      }}>{fa(b.clubAmount)} تومان</span>
    </div>
  )
}
