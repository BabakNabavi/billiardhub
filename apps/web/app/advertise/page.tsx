'use client'

/* درخواست تبلیغ در بیلیارد هاب.

   جایگاه‌ها از پنل ادمین می‌آیند (جدول ad_slots) و در همان کشوی
   فرم انتخاب می‌شوند. قیمت روی صفحه نوشته نمی‌شود: تعرفه بعد از
   ثبت درخواست برای متقاضی فرستاده می‌شود. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone, Check, Loader2, Phone, Mail, MapPin, ArrowLeft, Lock, Film } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import Select from '../../components/ui/Select'
import { apiFetch } from '../../lib/http'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38'

const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: 22 }
const INPUT: React.CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '11px 14px',
  fontSize: 13.5, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
/* فیلدهایی که از حساب کاربر می‌آیند و دست او نیست */
const LOCKED: React.CSSProperties = {
  ...INPUT, background: 'rgba(14,122,56,0.04)', border: '1px solid rgba(14,122,56,0.16)',
  color: 'rgba(0,0,0,0.62)', cursor: 'not-allowed',
}
/* ارتفاع ثابت، وگرنه لیبلی که آیکون دارد فیلدش را پایین‌تر می‌برد
   و ردیف به‌هم می‌ریزد */
const LABEL: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5, minHeight: 20,
  fontSize: 12.5, fontWeight: 800, color: SEC, marginBottom: 6,
}

interface PlanTier { id: string; name: string; price: number; durationDays: number; badge: string | null }
interface Slot {
  key: string; title: string; description: string | null; plans?: PlanTier[]
  /* جایگاهِ ویدیویی (پیش‌پخش) فایل می‌خواهد، نه فقط متن */
  contentKind?: string
  skipAfterSec?: number | null
  maxDurationSec?: number | null
}

const toFa = (v: string) => v.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
const digits = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')

export default function AdvertisePage() {
  const { user, _hydrated } = useAuthStore()
  const [slots, setSlots] = useState<Slot[]>([])
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', slotKey: '', message: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  /* کاربر واردشده هویتش استعلام شده — نام و شماره‌اش از حساب می‌آید
     و دستی عوض نمی‌شود؛ ایمیل ولی آزاد است. */
  const locked = !!user

  /* ── ویدیوی تبلیغ ──
     جایگاهِ ویدیویی به‌جای متن، فایل می‌خواهد. مدت پیش از آپلود در
     مرورگر سنجیده می‌شود: فرستادنِ ویدیوی بلند و بعد رد شدنش، هم وقتِ
     کاربر را می‌گیرد هم پهنای‌باند را. سقفِ نهایی را سرور اعمال می‌کند. */
  const [adVideo, setAdVideo] = useState('')
  const [adDuration, setAdDuration] = useState<number | null>(null)
  const [clickUrl, setClickUrl] = useState('')
  const [upBusy, setUpBusy] = useState(false)
  const [upErr, setUpErr] = useState('')

  const videoSlot = slots.find(s => s.key === form.slotKey && s.contentKind === 'video')

  const probeDuration = (f: File) => new Promise<number | null>(res => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src)
      res(Number.isFinite(v.duration) && v.duration > 0 ? Math.round(v.duration) : null)
    }
    v.onerror = () => { URL.revokeObjectURL(v.src); res(null) }
    v.src = URL.createObjectURL(f)
  })

  const pickVideo = async (f?: File) => {
    if (!f || !user) return
    setUpErr(''); setAdVideo(''); setAdDuration(null)

    const dur = await probeDuration(f)
    const cap = videoSlot?.maxDurationSec ?? null
    if (dur === null) { setUpErr('این فایل ویدیوی معتبری نیست'); return }
    if (cap && dur > cap) {
      setUpErr(`مدت ویدیو ${toFa(String(dur))} ثانیه است؛ حداکثر ${toFa(String(cap))} ثانیه مجاز است`)
      return
    }
    setAdDuration(dur)

    setUpBusy(true)
    try {
      const { uploadFile } = await import('../../lib/supabase')
      /* مسیر زیرِ شناسه‌ی خودِ کاربر — سرور همین را بررسی می‌کند */
      const url = await uploadFile('club-media', f, `ads/${user.id}/${Date.now()}`)
      if (!url) { setUpErr('بارگذاری انجام نشد؛ حجم یا فرمت فایل را بررسی کنید'); return }
      setAdVideo(url)
    } catch { setUpErr('خطا در بارگذاری') } finally { setUpBusy(false) }
  }

  useEffect(() => {
    /* کاتالوگ از سرور فقط جایگاه‌های «پولی» را برمی‌گرداند — جایگاهی که
       ادمین پولی‌اش نکرده اصلاً گزینه‌ی خرید ندارد (گیت فاز ۴). */
    void fetch('/api/ads/placements?catalog=1', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => setSlots(j?.placements ?? []))
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (!user) return
    setForm(f => ({
      ...f,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || f.name,
      phone: user.phone ?? f.phone,
      email: f.email || (user.email ?? ''),
    }))
  }, [user?.id])

  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setErr('') }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setErr('نام و نام‌خانوادگی لازم است'); return }
    if (!/^(\+98|0)?9\d{9}$/.test(digits(form.phone))) { setErr('شماره موبایل معتبر نیست'); return }
    if (videoSlot && !adVideo) { setErr('برای این جایگاه، ویدیوی تبلیغ را بارگذاری کنید'); return }

    setSending(true)
    try {
      /* نشانیِ ویدیو و مقصد داخلِ متنِ درخواست می‌روند تا ادمین همه‌ی
         اطلاعات را یک‌جا ببیند — بدونِ ساختنِ ستونِ تازه برای چیزی که
         فقط یک جایگاه از آن استفاده می‌کند. */
      const extra = videoSlot
        ? `\n\n— ویدیوی تبلیغ: ${adVideo}` +
          (adDuration ? `\n— مدت: ${adDuration} ثانیه` : '') +
          (clickUrl.trim() ? `\n— مقصد کلیک: ${clickUrl.trim()}` : '')
        : ''
      const r = await apiFetch('/api/ads/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, phone: digits(form.phone),
          message: form.message + extra,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'ثبت درخواست انجام نشد'); return }
      setDone(true)
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setSending(false) }
  }

  if (done) {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
        <div style={{ ...CARD, maxWidth: 440, textAlign: 'center', padding: '38px 30px' }}>
          <Check size={38} style={{ color: FELT, marginBottom: 12 }} />
          <h1 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: '0 0 10px' }}>درخواستتان ثبت شد</h1>
          <p style={{ fontSize: 13.5, color: SEC, lineHeight: 2, margin: '0 0 20px' }}>
            تعرفه‌ی تبلیغات برای شما ارسال خواهد شد.
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
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '34px clamp(16px,3vw,28px) 80px' }}>

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
            مخاطب ما دقیقاً همان‌هایی هستند که دنبال بیلیاردند: بازیکن، باشگاه‌دار، مربی و خریدار تجهیزات.
            جایگاه مورد نظرتان را انتخاب کنید تا تعرفه را برایتان بفرستیم.
          </p>

          {/* کاربر واردشده کمپین‌های خودش را همین‌جا دنبال می‌کند */}
          {user && (
            <Link href="/advertise/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
              color: '#9A6E38', borderRadius: 10, padding: '9px 16px',
              fontSize: 13, fontWeight: 800, textDecoration: 'none',
            }}>
              تبلیغات من <ArrowLeft size={14} />
            </Link>
          )}
        </div>

        <form onSubmit={submit} style={CARD}>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 16px' }}>درخواست تبلیغات</h2>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <div>
              <label style={LABEL}>
                نام و نام‌خانوادگی *
                {locked && <Lock size={11} style={{ color: MUT, flexShrink: 0 }} />}
              </label>
              <input style={locked ? LOCKED : INPUT} value={form.name} disabled={locked}
                onChange={e => set('name', e.target.value)} />
            </div>

            <div>
              <label style={LABEL}>
                شماره موبایل *
                {locked && <Lock size={11} style={{ color: MUT, flexShrink: 0 }} />}
              </label>
              <input
                style={{ ...(locked ? LOCKED : INPUT), direction: 'ltr', textAlign: 'right' }}
                inputMode="tel" disabled={locked}
                value={toFa(form.phone)}
                onChange={e => set('phone', digits(e.target.value).slice(0, 11))}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷" />
            </div>

            <div><label style={LABEL}>ایمیل</label>
              <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} type="email"
                value={form.email} onChange={e => set('email', e.target.value)} /></div>

            <div><label style={LABEL}>نام برند / شرکت</label>
              <input style={INPUT} value={form.company} onChange={e => set('company', e.target.value)} /></div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>جایگاه مورد نظر (صفحه اصلی)</label>
              {slots.length === 0 ? (
                /* هیچ جایگاهی روی حالت «پولی» نیست ⇒ کشوی خالی بن‌بست است؛
                   به‌جایش توضیح می‌دهیم که درخواست همچنان ثبت می‌شود. */
                <p style={{
                  fontSize: 12, color: MUT, lineHeight: 1.95, margin: 0,
                  border: `1px dashed ${LINE}`, borderRadius: 12, padding: '11px 14px',
                }}>
                  در حال حاضر جایگاه آماده‌ی فروشی روی سایت تعریف نشده است. درخواستتان را ثبت کنید؛
                  به‌محض فعال‌شدن جایگاه‌ها، تعرفه‌ها برای شما فرستاده می‌شود.
                </p>
              ) : (
              <Select
                value={form.slotKey} ariaLabel="جایگاه تبلیغ"
                options={slots.map(s => ({ value: s.key, label: s.title }))}
                onChange={v => set('slotKey', v)} />
              )}

              {/* ── جایگاهِ ویدیویی ──
                  فقط وقتی دیده می‌شود که کاربر جایگاهی انتخاب کرده که
                  واقعاً ویدیو می‌خواهد. فرم برای بقیه‌ی جایگاه‌ها
                  دست‌نخورده می‌ماند. */}
              {videoSlot && (
                <div style={{
                  marginTop: 12, border: '1px solid rgba(199,166,106,0.30)',
                  background: 'rgba(199,166,106,0.06)', borderRadius: 12, padding: '13px 15px',
                }}>
                  <p style={{ fontSize: 12, color: SEC, lineHeight: 2, margin: '0 0 10px' }}>
                    تبلیغ پیش از شروع محتوای اصلی پخش می‌شود
                    {videoSlot.skipAfterSec !== null && videoSlot.skipAfterSec !== undefined
                      ? ` و پس از ${toFa(String(videoSlot.skipAfterSec))} ثانیه بیننده می‌تواند آن را رد کند`
                      : ''}.
                    {videoSlot.maxDurationSec
                      ? ` حداکثر مدت مجاز: ${toFa(String(videoSlot.maxDurationSec))} ثانیه.`
                      : ''}
                  </p>

                  <label style={LABEL}><Film size={13} /> ویدیوی تبلیغ</label>
                  <input type="file" accept="video/mp4,video/webm,video/quicktime"
                    disabled={!user || upBusy}
                    onChange={e => void pickVideo(e.target.files?.[0])}
                    style={{ fontSize: 12, color: SEC, fontFamily: 'inherit' }} />

                  {!user && (
                    <p style={{ fontSize: 11.5, color: MUT, margin: '7px 0 0' }}>
                      برای بارگذاری ویدیو ابتدا وارد شوید.
                    </p>
                  )}
                  {upBusy && (
                    <p style={{ fontSize: 11.5, color: SEC, margin: '7px 0 0' }}>در حال بارگذاری…</p>
                  )}
                  {adVideo && !upBusy && (
                    <p style={{ fontSize: 11.5, color: '#0E7A38', fontWeight: 700, margin: '7px 0 0' }}>
                      ✓ ویدیو بارگذاری شد
                      {adDuration ? ` — ${toFa(String(adDuration))} ثانیه` : ''}
                    </p>
                  )}
                  {upErr && (
                    <p style={{ fontSize: 11.5, color: '#B23B2E', fontWeight: 700, margin: '7px 0 0' }}>{upErr}</p>
                  )}

                  <label style={{ ...LABEL, marginTop: 12 }}>نشانی مقصد (اختیاری)</label>
                  <input value={clickUrl} onChange={e => setClickUrl(e.target.value)}
                    placeholder="https://…" dir="ltr"
                    style={{ ...INPUT, textAlign: 'left' }} />
                </div>
              )}
              {form.slotKey && (() => {
                const s = slots.find(x => x.key === form.slotKey)
                const tiers = s?.plans ?? []
                return (
                  <>
                    {s?.description && (
                      <p style={{ fontSize: 11.5, color: MUT, margin: '7px 0 0', lineHeight: 1.9 }}>{s.description}</p>
                    )}
                    {tiers.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        {tiers.map(t => (
                          <div key={t.id} style={{
                            border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.08)',
                            borderRadius: 12, padding: '9px 13px', minWidth: 128,
                          }}>
                            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#5B564B' }}>
                              {toFa(String(t.durationDays))} روزه
                              {t.badge ? <span style={{ color: '#9A6E38' }}> · {t.badge}</span> : ''}
                            </div>
                            <div style={{ fontSize: 13.5, fontWeight: 900, color: '#9A6E38', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                              {toFa(t.price.toLocaleString('en-US'))} تومان
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>توضیح</label>
              <textarea style={{ ...INPUT, minHeight: 110, resize: 'vertical' }}
                value={form.message} onChange={e => set('message', e.target.value)}
                placeholder="چه چیزی می‌خواهید تبلیغ کنید؟ چه بازه‌ی زمانی مد نظرتان است؟" /></div>
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
            {sending ? <><Loader2 size={15} className="animate-spin" /> در حال ارسال…</> : 'ثبت درخواست تبلیغ'}
          </button>
        </form>

        {/* راه‌های تماس مستقیم — همان‌هایی که در «تماس با ما» هست */}
        <div style={{ ...CARD, marginTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))' }}>
          {[
            { icon: <Phone size={16} />, label: 'تلفن', value: '۰۲۱-۲۲۸۵۹۵۵۱' },
            { icon: <Mail size={16} />, label: 'ایمیل', value: 'info@billiardhub.net' },
            { icon: <MapPin size={16} />, label: 'نشانی', value: 'تهران، پاسداران، خیابان شهید محمود گل نبی، پلاک ۳۶' },
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
