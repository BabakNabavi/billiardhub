'use client'

/* بخش مالی داشبورد باشگاه — درآمد، موجودی، حساب بانکی و تسویه‌ها.
   داده‌ها فقط از /api/clubs/:id/finance می‌آیند (RBAC سمت سرور). */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { tehranDay } from '../../lib/finance/range'
import {
  Wallet, TrendingUp, Clock3, Landmark, ShieldCheck,
  AlertCircle, Loader2, ArrowDownToLine, Receipt, X,
} from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#6F6A5C', LINE = '#EAE5DA'
const GOLD_D = '#8F6531', FELT = '#0E7A38', GROUND = '#FAF8F3'
const fa = (n: number) => Math.round(Number(n) || 0).toLocaleString('fa-IR')

interface Finance {
  balance: { available: number; pending: number; totalEarnings: number; totalCommission: number; totalSettled: number }
  /* تفکیک فروش ناخالص — از `/api/clubs/[id]/finance` */
  breakdown?: {
    grossSales: number; fromReservations: number; fromTournaments: number
    platformCommission: number; clubShare: number; reversed: number
  }
  revenue: { today: number; week: number; month: number; total: number }
  /* گزارشِ بازه‌ی انتخابیِ کاربر — «از فلان تاریخ تا فلان تاریخ» */
  range?: {
    from: string; to: string; preset: string
    grossSales: number; fromReservations: number; fromTournaments: number
    platformCommission: number; clubShare: number; refunded: number; entries: number
  }
  bankAccount: { account_holder_name?: string; bank_name?: string; iban?: string; verification_status?: string; rejection_reason?: string } | null
  bookings: { today: number; upcoming: number; completed: number; cancelled: number; recent: Record<string, unknown>[] }
  settlements: Record<string, unknown>[]
}


/* از همان هلپرِ سرور — نه یک کپیِ محلیِ آفست */
const irDay = tehranDay

export default function ClubFinance({ clubId, onEditBank }: { clubId: string; onEditBank?: () => void }) {
  const [d, setD] = useState<Finance | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  /* بازه‌ی گزارش — پیش‌فرضِ سرور ۳۰ روز اخیر است */
  const [from, setFrom] = useState(irDay(29))
  const [to, setTo] = useState(irDay(0))

  /* ── چرا گاردِ `alive` ──
     `load` حالا به بازه وابسته است. دو تغییرِ پشتِ‌هم تاریخ می‌توانند
     خارج از ترتیب برگردند و پنل عددهای بازه‌ی قبلی را زیرِ برچسبِ
     بازه‌ی جدید نشان بدهد — بدترین حالتِ ممکن در یک صفحه‌ی مالی. */
  useEffect(() => {
    if (!clubId) return
    let alive = true
    const q = from && to ? `?from=${from}&to=${to}` : ''
    apiFetch(`/api/clubs/${clubId}/finance${q}`, { credentials: 'include', headers: { }, cache: 'no-store' })
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!alive) return
        if (!r.ok) { setErr(j?.message || 'دریافت اطلاعات مالی ممکن نشد'); setLoading(false); return }
        setD(j); setErr(''); setLoading(false)
      })
      .catch(() => { if (alive) { setErr('خطا در ارتباط با سرور'); setLoading(false) } })
    return () => { alive = false }
  }, [clubId, from, to])

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: MUT }}><Loader2 size={26} style={{ animation: 'cfspin 1s linear infinite' }} /><style>{`@keyframes cfspin{to{transform:rotate(360deg)}}`}</style></div>
  if (err) return <Empty icon={<AlertCircle size={26} />} title="اطلاعات مالی در دسترس نیست" desc={err} />
  if (!d) return null

  const bank = d.bankAccount
  const vs = bank?.verification_status

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── درآمد ──
          هر عدد یک زیرنویس دارد. بدون آن، «امروز / این هفته / این ماه»
          معلوم نبود مجموع چه چیزی است و از کجا می‌آید. */}
      {/* ⚠️ توضیحِ قبلی می‌گفت «پیش از کسر کمیسیون» در حالی که عدد
          دقیقا **بعد از** کسر کمیسیون است — سهمِ خودِ باشگاه. و لحظه‌ی
          ثبتش «برگزاریِ رزرو» است نه «پرداخت». همان ابهامی که سرِ پول
          دعوا درست می‌کند. فروشِ ناخالص جداگانه در بخشِ تفکیک می‌آید. */}
      <section>
        <Head icon={<TrendingUp size={17} style={{ color: FELT }} />} title="سهم شما"
          desc="سهم خودتان از رزروها و مسابقات برگزارشده، پس از کسر کمیسیون. مبلغ در لحظه‌ی برگزاری ثبت می‌شود، نه لحظه‌ی پرداخت." />
        <div className="cf-grid">
          <Stat label="امروز" value={d.revenue.today} tone="felt" hint="از نیمه‌شب امروز به وقت تهران" />
          <Stat label="۷ روز اخیر" value={d.revenue.week} hint="امروز و شش روز پیش از آن" />
          <Stat label="۳۰ روز اخیر" value={d.revenue.month} hint="امروز و بیست‌ونه روز پیش از آن" />
          <Stat label="کل" value={d.revenue.total} strong hint="از آغاز فعالیت باشگاه" />
        </div>
      </section>

      {/* ── گزارش بازه‌ای ──
          تا امروز باشگاه‌دار نمی‌توانست بپرسد «از فلان تاریخ تا فلان
          تاریخ چقدر شد» — این مسیر اصلا پارامتر تاریخ نمی‌پذیرفت. */}
      {d.range && (
        <section>
          <Head icon={<Receipt size={17} style={{ color: GOLD_D }} />} title="گزارش بازه‌ای"
            desc="هر بازه‌ای که بخواهید — هر دو سر شامل همان روز است." />
          <div className="cf-range">
            {([['امروز', 0], ['۷ روز', 6], ['۳۰ روز', 29], ['۹۰ روز', 89]] as const).map(([lbl, back]) => (
              <button key={lbl} type="button" onClick={() => { setFrom(irDay(back)); setTo(irDay(0)) }}
                className={from === irDay(back) && to === irDay(0) ? 'cf-chip on' : 'cf-chip'}>{lbl}</button>
            ))}
            <label className="cf-f"><span>از</span>
              <input type="date" dir="ltr" value={from} max={to} onChange={e => setFrom(e.target.value)} /></label>
            <label className="cf-f"><span>تا</span>
              <input type="date" dir="ltr" value={to} min={from} max={irDay(0)} onChange={e => setTo(e.target.value)} /></label>
          </div>
          <div className="cf-grid" style={{ marginTop: 10 }}>
            <Stat label="سهم شما در این بازه" value={d.range.clubShare} tone="felt" strong />
            <Stat label="فروش ناخالص" value={d.range.grossSales} muted hint="کل مبلغی که مشتریان پرداخت کرده‌اند" />
            <Stat label="کمیسیون پلتفرم" value={d.range.platformCommission} muted />
            <Stat label="بازپرداخت‌شده" value={d.range.refunded} muted />
          </div>
          {d.range.entries === 0 && (
            <p style={{ fontSize: 12, color: MUT, marginTop: 8 }}>در این بازه رویداد مالی‌ای ثبت نشده است.</p>
          )}
        </section>
      )}

      {/* ── موجودی ── */}
      <section>
        <Head icon={<Wallet size={17} style={{ color: GOLD_D }} />} title="گردش مالی"
          desc="سهم شما از هر رزرو، و سهم پلتفرم که به‌صورت کمیسیون کسر می‌شود." />
        {/* برچسب «در جریان» پیش‌تر یعنی «رزروهای هنوز برگزارنشده» بود.
            با مدل تازه، سهم باشگاه اصلا پیش از برگزاری ساخته نمی‌شود؛
            پس آن ستون حالا معنای دیگری دارد: تسویه‌ای که تأیید شده و
            هنوز به حساب ننشسته. برچسب قدیمی گمراه‌کننده می‌شد. */}
        <div className="cf-grid">
          <Stat label="قابل تسویه" value={d.balance.available} tone="gold" strong
            hint="سهم شما از رزروها و مسابقات برگزارشده، پس از کسر کمیسیون" />
          <Stat label="در انتظار تسویه" value={d.balance.pending}
            hint="تسویه‌ای که تأیید شده و در حال انتقال به حساب شماست" />
          <Stat label="پرداخت‌شده به شما" value={d.balance.totalSettled} hint="آنچه تا امروز به حسابتان رسیده" />
          <Stat label="کمیسیون پلتفرم" value={d.balance.totalCommission} muted hint="سهم بیلیارد هاب" />
        </div>

        {/* تفکیک «چرا این عدد» — بدون آن، باشگاه‌دار فقط یک رقم
            می‌بیند و راهی برای راستی‌آزمایی‌اش ندارد. */}
        {d.breakdown && (
          <div className="cf-grid" style={{ marginTop: 10 }}>
            <Stat label="فروش ناخالص" value={d.breakdown.grossSales} muted
              hint="کل مبلغی که مشتریان پرداخت کرده‌اند" />
            <Stat label="از رزرو" value={d.breakdown.fromReservations} muted />
            <Stat label="از مسابقات" value={d.breakdown.fromTournaments} muted />
            {d.breakdown.reversed > 0 && (
              <Stat label="برگشت‌خورده" value={d.breakdown.reversed} muted
                hint="سهمی که به‌خاطر لغو پس از برگزاری برگشت خورد" />
            )}
          </div>
        )}
      </section>

      {/* ── رزروها ── */}
      <section>
        <Head icon={<Clock3 size={17} style={{ color: SEC }} />} title="رزروها"
          desc="تعداد رزرو — نه مبلغ." />
        <div className="cf-grid">
          <Stat label="امروز" value={d.bookings.today} count unit="رزرو" />
          <Stat label="پیش‌رو" value={d.bookings.upcoming} count unit="رزرو" />
          <Stat label="انجام‌شده" value={d.bookings.completed} count unit="رزرو" />
          <Stat label="کنسل‌شده" value={d.bookings.cancelled} count muted unit="رزرو" />
        </div>
      </section>

      {/* ── حساب بانکی ──
          این بخش فقط نمایش است. ثبت و تغییر شبا تنها یک‌جا انجام می‌شود —
          تب «اطلاعات» — چون آن‌جا شبا با استعلام بانکی و کد ملی مالک
          تطبیق داده می‌شود. فرم دومی که این‌جا بود همان شبا را بدون هیچ
          استعلامی می‌گرفت و کاربر دو جای متفاوت برای یک کار می‌دید. */}
      <section>
        <Head icon={<Landmark size={17} style={{ color: GOLD_D }} />} title="حساب بانکی تسویه"
          action={onEditBank ? <button onClick={onEditBank} style={btnGhost}>{bank ? 'تغییر حساب' : 'ثبت حساب'}</button> : undefined} />
        <div style={card}>
          {!bank ? (
            <p style={{ fontSize: 13, color: MUT, margin: 0, lineHeight: 2 }}>
              برای دریافت تسویه، شماره شبای خود را در تب <b style={{ color: GOLD_D }}>اطلاعات</b> ثبت
              و با استعلام بانکی تأیید کنید. حساب باید به نام خود صاحب باشگاه باشد.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row label="صاحب حساب" value={bank.account_holder_name || '—'} />
              <Row label="بانک" value={bank.bank_name || '—'} />
              <Row label="شماره شبا" value={bank.iban || '—'} mono />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${LINE}` }}>
                <span style={{ fontSize: 12, color: MUT }}>وضعیت</span>
                <span style={{ marginInlineStart: 'auto', ...badge(vs) }}>
                  {vs === 'VERIFIED' ? <><ShieldCheck size={12} /> تأییدشده</> : vs === 'REJECTED' ? <><X size={12} /> رد شده</> : <><Clock3 size={12} /> در انتظار تأیید</>}
                </span>
              </div>
              {vs === 'REJECTED' && bank.rejection_reason && (
                <p style={{ fontSize: 12, color: '#B23B2E', margin: 0 }}>علت: {bank.rejection_reason}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── تسویه‌ها ── */}
      <section>
        <Head icon={<ArrowDownToLine size={17} style={{ color: FELT }} />} title="تسویه‌ها" />
        {d.settlements.length === 0 ? (
          <Empty icon={<Receipt size={24} />} title="هنوز تسویه‌ای انجام نشده" desc="پس از تأیید حساب بانکی، تسویه‌ها اینجا نمایش داده می‌شوند." />
        ) : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {d.settlements.map((s, i) => (
              <div key={String(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i ? `1px solid ${LINE}` : 'none', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>{fa(Number(s.amount))} <span style={{ fontSize: 11, fontWeight: 700, color: MUT }}>تومان</span></span>
                <span style={settleBadge(String(s.status))}>{settleLabel(String(s.status))}</span>
                {!!s.reference_number && <span style={{ fontSize: 11, color: MUT, direction: 'ltr' }}>#{String(s.reference_number)}</span>}
                <span style={{ marginInlineStart: 'auto', fontSize: 11.5, color: MUT }}>{faDate(String(s.completed_at || s.requested_at))}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .cf-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 860px) { .cf-grid { grid-template-columns: repeat(2, 1fr); } }

        .cf-range { display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
          padding: 10px 12px; background: ${GROUND}; border: 1px solid ${LINE};
          border-radius: 12px; }
        .cf-chip { font-family: inherit; font-size: 11.5px; font-weight: 800; color: ${SEC};
          background: #fff; border: 1px solid ${LINE}; border-radius: 999px;
          padding: 6px 12px; cursor: pointer; }
        .cf-chip.on { background: ${INK}; color: #fff; border-color: ${INK}; }
        .cf-chip:focus-visible, .cf-f input:focus-visible { outline: 2px solid ${GOLD_D}; outline-offset: 2px; }
        .cf-f { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: ${MUT}; }
        .cf-f input { font-family: inherit; font-size: 12px; color: ${INK}; background: #fff;
          border: 1px solid ${LINE}; border-radius: 9px; padding: 6px 9px; }
      `}</style>
    </div>
  )
}

/* ── اجزا ── */
const card: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16 }
const btnGhost: React.CSSProperties = { padding: '7px 14px', borderRadius: 10, border: `1px solid ${LINE}`, background: '#fff', color: GOLD_D, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

function Head({ icon, title, action, desc }: { icon: React.ReactNode; title: string; action?: React.ReactNode; desc?: string }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {icon}<h3 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>{title}</h3>
        {action && <span style={{ marginInlineStart: 'auto' }}>{action}</span>}
      </div>
      {desc && <p style={{ fontSize: 11.5, color: MUT, margin: '6px 0 0', lineHeight: 1.9 }}>{desc}</p>}
    </div>
  )
}

function Stat({ label, value, tone, strong, muted, count, hint, unit }: { label: string; value: number; tone?: 'gold' | 'felt'; strong?: boolean; muted?: boolean; count?: boolean; hint?: string; unit?: string }) {
  const color = tone === 'gold' ? GOLD_D : tone === 'felt' ? FELT : muted ? MUT : INK
  return (
    <div style={{ background: '#fff', border: `1px solid ${tone === 'gold' ? 'rgba(199,166,106,0.4)' : LINE}`, borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ fontSize: 11.5, color: MUT, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: strong ? 21 : 18, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
        {fa(value)}
        <span style={{ fontSize: 10.5, fontWeight: 700, color: MUT, marginInlineStart: 4 }}>{count ? (unit ?? '') : 'تومان'}</span>
      </div>
      {hint && <div style={{ fontSize: 10.5, color: MUT, marginTop: 6, lineHeight: 1.7 }}>{hint}</div>}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 12, color: MUT }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: INK, direction: mono ? 'ltr' : 'rtl' }}>{value}</span>
    </div>
  )
}

function Empty({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
      <span style={{ display: 'inline-flex', width: 52, height: 52, borderRadius: 16, background: GROUND, color: MUT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{icon}</span>
      <p style={{ fontSize: 14.5, fontWeight: 800, color: INK, margin: '0 0 6px' }}>{title}</p>
      <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>{desc}</p>
    </div>
  )
}

const badge = (s?: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: '4px 11px',
  color: s === 'VERIFIED' ? FELT : s === 'REJECTED' ? '#B23B2E' : GOLD_D,
  background: s === 'VERIFIED' ? 'rgba(14,122,56,0.1)' : s === 'REJECTED' ? 'rgba(178,59,46,0.09)' : 'rgba(199,166,106,0.13)',
})
const settleBadge = (s: string): React.CSSProperties => ({
  fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 10px',
  color: s === 'COMPLETED' ? FELT : s === 'FAILED' ? '#B23B2E' : GOLD_D,
  background: s === 'COMPLETED' ? 'rgba(14,122,56,0.1)' : s === 'FAILED' ? 'rgba(178,59,46,0.09)' : 'rgba(199,166,106,0.13)',
})
const settleLabel = (s: string) => s === 'COMPLETED' ? 'واریز شد' : s === 'PROCESSING' ? 'در حال انجام' : s === 'FAILED' ? 'ناموفق' : 'در انتظار'
const faDate = (iso: string) => { try { return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(new Date(iso)) } catch { return '—' } }

/* `BankModal` و `Field` حذف شدند: ثبت شبا تنها از تب «اطلاعات» انجام
   می‌شود، جایی که با استعلام بانکی و کد ملی مالک تطبیق داده می‌شود.
   نگه‌داشتن فرم دوم یعنی مسیری برای ثبت شبای تأییدنشده. */
