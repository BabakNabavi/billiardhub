'use client'

/* درخواستِ تبلیغ در بیلیارد هاب.

   جایگاه‌ها و قیمت‌هایشان از سرور خوانده می‌شوند؛ اگر ادمین هنوز
   قیمت‌گذاری نکرده باشد، به‌جای «۰ تومان» می‌نویسیم «توافقی» — عددِ
   صفر به کاربر پیامِ اشتباه می‌دهد. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone, Check, Loader2, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react'
import { toFaDigits } from '../../lib/jalali'
import { useAuthStore } from '../../store/auth.store'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38'

const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: 22 }
const INPUT: React.CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '11px 14px',
  fontSize: 13.5, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 800, color: SEC, marginBottom: 6 }

interface Slot { key: string; title: string; description: string | null; price: number; durationDays: number }

const fa = (n: number) => toFaDigits(n.toLocaleString('en-US'))
const digits = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')

const BUDGETS = ['کمتر از ۵ میلیون تومان', '۵ تا ۱۵ میلیون تومان', '۱۵ تا ۵۰ میلیون تومان', 'بیشتر از ۵۰ میلیون تومان']

export default function AdvertisePage() {
  const { user } = useAuthStore()
  const [slots, setSlots] = useState<Slot[]>([])
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', slotKey: '', budget: '', message: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    void fetch('/api/ads/slots?catalog=1', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => setSlots(j?.slots ?? []))
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (!user) return
    setForm(f => ({
      ...f,
      name: f.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
      phone: f.phone || (user.phone ?? ''),
    }))
  }, [user?.id])

  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setErr('') }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setErr('نام و نام‌خانوادگی لازم است'); return }
    if (!/^(\+98|0)?9\d{9}$/.test(digits(form.phone))) { setErr('شماره موبایل معتبر نیست'); return }

    setSending(true)
    try {
      const r = await fetch('/api/ads/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ...form, phone: digits(form.phone) }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'ثبتِ درخواست انجام نشد'); return }
      setDone(true)
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setSending(false) }
  }

  if (done) {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
        <div style={{ ...CARD, maxWidth: 430, textAlign: 'center', padding: '38px 30px' }}>
          <Check size={38} style={{ color: FELT, marginBottom: 12 }} />
          <h1 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: '0 0 10px' }}>درخواستتان ثبت شد</h1>
          <p style={{ fontSize: 13.5, color: SEC, lineHeight: 2, margin: '0 0 20px' }}>
            همکاران ما در اولین فرصتِ کاری با شما تماس می‌گیرند و جزئیاتِ جایگاه و تعرفه را می‌فرستند.
          </p>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
            borderRadius: 10, padding: '11px 20px', fontSize: 13.5, fontWeight: 800,
          }}>بازگشت به خانه <ArrowLeft size={14} /></Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F5F0', color: INK, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '34px clamp(16px,3vw,28px) 80px' }}>

        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800,
            color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.28)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 14,
          }}>
            <Megaphone size={15} /> تبلیغات
          </span>
          <h1 style={{ fontSize: 'clamp(22px,3.4vw,30px)', fontWeight: 900, margin: '0 0 10px' }}>
            تبلیغ در بیلیارد هاب
          </h1>
          <p style={{ fontSize: 14, color: SEC, lineHeight: 2, margin: 0, maxWidth: 560, marginInline: 'auto' }}>
            مخاطبِ ما دقیقاً همان‌هایی هستند که دنبالِ بیلیاردند: بازیکن، باشگاه‌دار، مربی و خریدارِ تجهیزات.
            جایگاهِ موردِ نظرتان را انتخاب کنید تا با شما تماس بگیریم.
          </p>
        </div>

        {slots.length > 0 && (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', marginBottom: 22 }}>
            {slots.map(s => {
              const on = form.slotKey === s.key
              return (
                <button key={s.key} type="button" onClick={() => set('slotKey', on ? '' : s.key)}
                  style={{
                    textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit',
                    background: on ? 'rgba(199,166,106,0.10)' : '#fff',
                    border: `1px solid ${on ? 'rgba(199,166,106,0.45)' : LINE}`,
                    borderRadius: 16, padding: '15px 16px', transition: 'all .2s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    {on && <Check size={14} style={{ color: GOLD_D }} />}
                    <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{s.title}</span>
                  </div>
                  {s.description && <p style={{ fontSize: 12, color: MUT, margin: '0 0 8px', lineHeight: 1.85 }}>{s.description}</p>}
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: s.price > 0 ? GOLD_D : MUT }}>
                    {s.price > 0 ? `${fa(s.price)} تومان / ${fa(s.durationDays)} روز` : 'تعرفه توافقی'}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <form onSubmit={submit} style={CARD}>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 16px' }}>اطلاعاتِ تماس</h2>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <div><label style={LABEL}>نام و نام‌خانوادگی *</label>
              <input style={INPUT} value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label style={LABEL}>شماره موبایل *</label>
              <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} inputMode="tel"
                value={form.phone} onChange={e => set('phone', digits(e.target.value).slice(0, 11))} placeholder="09xxxxxxxxx" /></div>
            <div><label style={LABEL}>ایمیل</label>
              <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} type="email"
                value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label style={LABEL}>نامِ برند / شرکت</label>
              <input style={INPUT} value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>بودجه‌ی تقریبی</label>
              <select value={form.budget} onChange={e => set('budget', e.target.value)}
                style={{ ...INPUT, cursor: 'pointer' }}>
                <option value="">انتخاب کنید…</option>
                {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
              </select></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>توضیح</label>
              <textarea style={{ ...INPUT, minHeight: 110, resize: 'vertical' }}
                value={form.message} onChange={e => set('message', e.target.value)}
                placeholder="چه چیزی می‌خواهید تبلیغ کنید؟ چه بازه‌ی زمانی مدِ نظرتان است؟" /></div>
          </div>

          {err && (
            <p style={{ fontSize: 12.5, fontWeight: 800, color: '#B23B2E', margin: '14px 0 0' }}>{err}</p>
          )}

          <button type="submit" disabled={sending} style={{
            marginTop: 18, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
            borderRadius: 10, padding: '13px', fontSize: 14.5, fontWeight: 800, fontFamily: 'inherit',
            cursor: sending ? 'not-allowed' : 'pointer',
          }}>
            {sending ? <><Loader2 size={15} className="animate-spin" /> در حال ارسال…</> : 'ثبتِ درخواستِ تبلیغ'}
          </button>
        </form>

        {/* راه‌های تماسِ مستقیم — همان‌هایی که در «تماس با ما» هست */}
        <div style={{ ...CARD, marginTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))' }}>
          {[
            { icon: <Phone size={16} />, label: 'تلفن', value: '۰۲۱-۲۲۸۵۹۵۵۱' },
            { icon: <Mail size={16} />, label: 'ایمیل', value: 'info@billiardhub.net' },
            { icon: <MapPin size={16} />, label: 'نشانی', value: 'تهران، پاسداران، خیابان شهید محمود گل نبی، پلاک ۳۶، طبقه سوم' },
          ].map(c => (
            <div key={c.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: GOLD_D, marginTop: 2 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: MUT, marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: INK, lineHeight: 1.85 }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
