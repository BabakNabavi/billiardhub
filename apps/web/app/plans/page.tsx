'use client'

/* بسته‌های آگهیِ بیلیارد بازار — انتخاب و خرید.

   صفحه همیشه در دسترس است، حتی وقتی محدودیتِ آگهی خاموش است؛ آن‌وقت
   بالای صفحه صریح گفته می‌شود که خرید فعلاً لازم نیست، تا کسی بی‌دلیل
   پول ندهد. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, Check, Loader2, Sparkles, ArrowLeft, Megaphone } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { toFaDigits, faDate } from '../../lib/jalali'
import { useAuthStore } from '../../store/auth.store'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38'

type Period = 'day' | 'week' | 'month'
const PERIOD_FA: Record<Period, string> = { day: 'روز', week: 'هفته', month: 'ماه' }

interface Plan {
  id: string; name: string; description: string | null
  quota: number; period: Period; durationDays: number
  price: number; badge: string | null
}

interface Quota {
  enabled: boolean; allowed: boolean; used: number; limit: number
  period: Period; planName: string | null; planExpiresAt: string | null
}

const fa = (n: number) => toFaDigits(n.toLocaleString('en-US'))

export default function PlansPage() {
  const router = useRouter()
  const { user, _hydrated } = useAuthStore()

  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [quotaEnabled, setQuotaEnabled] = useState(false)

  const [mine, setMine] = useState<Quota | null>(null)
  const [buying, setBuying] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    void fetch('/api/ads/plans', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { setPlans(j.plans ?? []); setQuotaEnabled(!!j.quotaEnabled) })
      .catch(() => setPlans([]))
  }, [])

  useEffect(() => {
    if (!_hydrated || !user) return
    void apiFetch('/api/ads/quota', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j?.quota) setMine(j.quota) })
      .catch(() => { })
  }, [_hydrated, user?.id])

  const buy = async (planId: string) => {
    if (!user) { router.push('/login?next=/plans'); return }
    setBuying(planId); setErr('')
    try {
      const r = await apiFetch('/api/ads/plans/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.redirectUrl) { setErr(j?.message || 'اتصال به درگاه انجام نشد'); setBuying(''); return }
      window.location.href = j.redirectUrl
    } catch { setErr('خطا در ارتباط با سرور'); setBuying('') }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F5F0', color: INK, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '34px clamp(16px,3vw,28px) 80px' }}>

        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800,
            color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.28)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 14,
          }}>
            <Package size={15} /> بسته‌های آگهی
          </span>
          <h1 style={{ fontSize: 'clamp(22px,3.4vw,30px)', fontWeight: 900, margin: '0 0 10px' }}>
            بیشتر آگهی بگذارید، بیشتر دیده شوید
          </h1>
          <p style={{ fontSize: 14, color: SEC, lineHeight: 2, margin: 0, maxWidth: 560, marginInline: 'auto' }}>
            هر بسته یک سهمیه‌ی مشخص برای ثبتِ آگهی در بیلیارد بازار می‌دهد.
            بسته را انتخاب کنید، از درگاه پرداخت کنید، و بلافاصله فعال می‌شود.
          </p>
        </div>

        {/* وضعیتِ فعلیِ خودِ کاربر */}
        {mine && (
          <div style={{
            background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '15px 18px',
            marginBottom: 18, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <Sparkles size={18} style={{ color: GOLD_D }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800 }}>
                {mine.planName ? `بسته‌ی فعالِ شما: ${mine.planName}` : 'شما بسته‌ی فعالی ندارید'}
              </div>
              <div style={{ fontSize: 12.5, color: MUT, marginTop: 4, lineHeight: 1.9 }}>
                {mine.limit === 0
                  ? 'آگهیِ نامحدود'
                  : `${fa(mine.used)} از ${fa(mine.limit)} آگهیِ این ${PERIOD_FA[mine.period]} استفاده شده — ${fa(Math.max(0, mine.limit - mine.used))} تا مانده`}
                {mine.planExpiresAt ? ` · اعتبار تا ${faDate(mine.planExpiresAt)}` : ''}
              </div>
            </div>
            <Link href="/dashboard" style={{ fontSize: 12.5, fontWeight: 800, color: GOLD_D, textDecoration: 'none' }}>
              پنلِ من ←
            </Link>
          </div>
        )}

        {!quotaEnabled && (
          <div style={{
            background: 'rgba(14,122,56,0.06)', border: '1px solid rgba(14,122,56,0.22)', borderRadius: 14,
            padding: '13px 17px', marginBottom: 20, fontSize: 13, color: '#14532D', lineHeight: 2,
          }}>
            در حال حاضر محدودیتی برای تعداد آگهی اعمال نمی‌شود و همه می‌توانند آزادانه آگهی ثبت کنند.
            خریدِ بسته فعلاً لازم نیست — این صفحه برای وقتی است که محدودیت فعال شود.
          </div>
        )}

        {quotaEnabled && !mine?.planName && (
          <div style={{
            background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.26)', borderRadius: 14,
            padding: '13px 17px', marginBottom: 20, fontSize: 13, color: GOLD_D, lineHeight: 2,
          }}>
            {mine
              ? `سهمیه‌ی رایگانِ شما ${fa(mine.limit)} آگهی در هر ${PERIOD_FA[mine.period]} است.`
              : 'سهمیه‌ی رایگانِ هر کاربر بسته به نقشش متفاوت است.'}
            {' '}برای بیشتر از آن، یکی از بسته‌های زیر را تهیه کنید.
          </div>
        )}

        {err && (
          <div style={{ background: 'rgba(178,59,46,0.07)', border: '1px solid rgba(178,59,46,0.25)', borderRadius: 14, padding: '12px 16px', marginBottom: 18, fontSize: 13, fontWeight: 700, color: '#B23B2E' }}>
            {err}
          </div>
        )}

        {plans === null ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, color: MUT, padding: 40 }}>
            <Loader2 size={17} className="animate-spin" /><span style={{ fontSize: 13.5 }}>در حال بارگذاری…</span>
          </div>
        ) : plans.length === 0 ? (
          <div style={{
            background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '40px 26px', textAlign: 'center',
          }}>
            <Package size={28} style={{ color: MUT, opacity: 0.6, marginBottom: 10 }} />
            <p style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 8px' }}>هنوز بسته‌ای برای فروش تعریف نشده است</p>
            <p style={{ fontSize: 13, color: MUT, margin: 0, lineHeight: 2 }}>
              تا آن موقع، ثبتِ آگهی در بیلیارد بازار برای شما آزاد است.
            </p>
            <Link href="/shop/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, textDecoration: 'none',
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
              borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800,
            }}>
              ثبتِ آگهی <ArrowLeft size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(258px,1fr))' }}>
            {plans.map(p => (
              <article key={p.id} style={{
                position: 'relative', background: '#fff', borderRadius: 18, padding: '22px 20px 20px',
                border: `1px solid ${p.badge ? 'rgba(199,166,106,0.42)' : LINE}`,
                boxShadow: p.badge ? '0 10px 30px rgba(199,166,106,0.14)' : '0 2px 10px rgba(28,27,23,0.05)',
                display: 'flex', flexDirection: 'column',
              }}>
                {p.badge && (
                  <span style={{
                    position: 'absolute', top: -11, insetInlineStart: 20, fontSize: 11, fontWeight: 800,
                    color: '#fff', background: `linear-gradient(135deg,${GOLD},#8A6020)`,
                    borderRadius: 20, padding: '4px 12px',
                  }}>{p.badge}</span>
                )}

                <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 6px' }}>{p.name}</h2>
                {p.description && (
                  <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 14px', lineHeight: 1.9 }}>{p.description}</p>
                )}

                <div style={{ margin: '6px 0 16px' }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>{fa(p.price)}</span>
                  <span style={{ fontSize: 12.5, color: MUT, marginInlineStart: 6 }}>تومان</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'grid', gap: 9 }}>
                  {[
                    p.quota === 0 ? 'ثبتِ آگهیِ نامحدود' : `${fa(p.quota)} آگهی در هر ${PERIOD_FA[p.period]}`,
                    `${fa(p.durationDays)} روز اعتبار`,
                    'نمایش در بیلیارد بازار برای همه‌ی کاربران',
                  ].map(t => (
                    <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: SEC, lineHeight: 1.8 }}>
                      <Check size={15} style={{ color: FELT, flexShrink: 0, marginTop: 3 }} />{t}
                    </li>
                  ))}
                </ul>

                <button onClick={() => void buy(p.id)} disabled={!!buying}
                  style={{
                    marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
                    borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                    cursor: buying ? 'not-allowed' : 'pointer', opacity: buying && buying !== p.id ? 0.55 : 1,
                    transition: 'transform .2s',
                  }}>
                  {buying === p.id ? <><Loader2 size={15} className="animate-spin" /> در حال انتقال به درگاه…</> : 'خریدِ بسته'}
                </button>
              </article>
            ))}
          </div>
        )}

        {/* درخواستِ تبلیغ — همان‌جا که کاربر دنبال دیده‌شدن است */}
        <div style={{
          marginTop: 28, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '20px 22px',
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <Megaphone size={20} style={{ color: GOLD_D }} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 14.5, fontWeight: 900, marginBottom: 5 }}>تبلیغ در بیلیارد هاب</div>
            <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 2 }}>
              اگر به‌جای آگهی، دنبالِ بنرِ تبلیغاتی در صفحه‌ی اصلی یا بیلیارد بازار هستید،
              درخواستتان را ثبت کنید تا با شما تماس بگیریم.
            </p>
          </div>
          <Link href="/advertise" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
            borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800,
          }}>
            درخواستِ تبلیغ <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
