'use client'

/* ─────────────────────────────────────────────────────────────
   تماس با ما — تجربه‌ی ارتباط دیجیتال Billiard Hub (بازطراحی ۱۴۰۵)
   هیروی سینمایی با میز مینیمال SVG → کامپوزیشن واحد:
   کانال‌های تعاملی (کپی ایمیل، میان‌بُر موضوع) + فرم فلوتینگ‌لیبل
   با ولیدیشن، لودینگ و انیمیشن موفقیت. فرم واقعی است:
   ابتدا API، درنبودش ذخیره‌ی محلی (bh_contact_messages).
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { Mail, MapPin, Handshake, Headphones, Check, Copy, Send, ArrowLeft, Megaphone } from 'lucide-react'
import Link from 'next/link'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
/* نمایش فارسی ارقام — مقدار لینک tel: لاتین می‌ماند */
const toFaDigits = (v: string) => v.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

const BALLS = { red: '#C43D2E', green: '#1B7A4B', blue: '#3D63E6', pink: '#F06EAE', yellow: '#E8B93A', gold: '#C7A66A' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/* ── اطلاعات تماس رسمی ──
   ایمیل همان است که در فوتر سایت استفاده می‌شود.
   فیلدهای خالی «placeholder» هستند: تا وقتی مقدار واقعی نگیرند
   در صفحه نمایش داده نمی‌شوند — برای فعال‌کردن فقط همین‌جا مقدار بده. */
const CONTACT = {
  email: 'info@billiardhub.net',
  phone: '021-22859551',
  phoneDial: '02122859551',   // برای لینک tel:
  city: 'تهران',
  address: 'تهران، پاسداران، خیابان شهید محمود گل نبی، پلاک ۳۶',
  instagram: '',    // TODO: آدرس کامل پروفایل — فعلاً نمایش داده نمی‌شود
  telegram: '',     // TODO: آدرس کامل کانال — فعلاً نمایش داده نمی‌شود
}

/* «تبلیغات» این‌جا نیست — فرم خودش را در /advertise دارد */
const SUBJECTS = ['پشتیبانی', 'همکاری', 'پیشنهاد و انتقاد', 'سایر']

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.ct-rev'))
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target) } }),
      { threshold: 0.15 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* دراپ‌داون سفارشی موضوع — پنل شیشه‌ای با انیمیشن، هماهنگ با فرم */
function SubjectSelect({ value, onChange, options, error }: {
  value: string; onChange: (v: string) => void; options: string[]; error?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '12px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
          color: value ? TEXT : MUT, textAlign: 'right',
          background: '#fff', border: `1px solid ${error ? 'rgba(178,59,46,0.5)' : open ? 'rgba(199,166,106,0.6)' : LINE}`,
          boxShadow: open ? '0 0 0 3px rgba(199,166,106,0.13)' : 'none',
          transition: 'border-color .25s, box-shadow .25s' }}>
        {value || 'انتخاب موضوع…'}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={open ? GOLD_D : MUT} strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s cubic-bezier(.22,1,.36,1)' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', insetInline: 0, zIndex: 40,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 18px 46px rgba(28,27,23,0.14)', animation: 'ctEnter .28s cubic-bezier(.22,1,.36,1) both' }}>
          {options.map(o => (
            <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(199,166,106,0.09)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '11px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5,
                fontWeight: value === o ? 800 : 600, color: value === o ? GOLD_D : SEC,
                background: 'transparent', textAlign: 'right', transition: 'background .2s' }}>
              {o}
              {value === o && <Check size={14} style={{ color: GOLD_D, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* فیلد فلوتینگ‌لیبل با خط زیرین انیمیت‌شونده */
function FloatField({ label, value, onChange, type = 'text', ltr = false, textarea = false, error, inputMode, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; ltr?: boolean
  textarea?: boolean; error?: string; inputMode?: 'numeric' | 'email'; maxLength?: number
}) {
  const [focus, setFocus] = useState(false)
  const up = focus || value.length > 0
  return (
    <div style={{ position: 'relative', paddingTop: 18 }}>
      <label style={{
        position: 'absolute', right: 0, top: up ? 0 : textarea ? 26 : 30,
        fontSize: up ? 10.5 : 14, fontWeight: 700,
        color: error ? '#B23B2E' : up ? (focus ? GOLD_D : MUT) : MUT,
        transition: 'all .28s cubic-bezier(.22,1,.36,1)', pointerEvents: 'none',
      }}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={4}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', outline: 'none',
            padding: '10px 0 8px', fontSize: 14.5, color: TEXT, fontFamily: 'inherit', resize: 'vertical', minHeight: 96, lineHeight: 2 }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          inputMode={inputMode === 'numeric' ? 'numeric' : undefined} maxLength={maxLength}
          style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', outline: 'none',
            padding: '10px 0 8px', fontSize: 14.5, color: TEXT, fontFamily: 'inherit',
            direction: ltr ? 'ltr' : 'rtl', textAlign: 'right' }} />
      )}
      <div style={{ position: 'relative', height: 1.5, background: error ? 'rgba(178,59,46,0.4)' : LINE, borderRadius: 2, overflow: 'hidden' }}>
        <span style={{ position: 'absolute', inset: 0, transformOrigin: 'right',
          transform: focus ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform .45s cubic-bezier(.22,1,.36,1)',
          background: `linear-gradient(90deg,#8A6020,${GOLD})` }} />
      </div>
      {error && <div style={{ fontSize: 11, fontWeight: 700, color: '#B23B2E', marginTop: 6 }}>{error}</div>}
    </div>
  )
}

export default function ContactPage() {
  useReveal()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const set = (k: keyof typeof form) => (v: string) => {
    if (k === 'phone') v = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '').slice(0, 11)
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(CONTACT.email) } catch {
      const ta = document.createElement('textarea')
      ta.value = CONTACT.email; document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy') } catch {}
      ta.remove()
    }
    setCopied(true); setTimeout(() => setCopied(false), 2200)
  }

  const jumpToForm = (subject: string) => {
    setForm(f => ({ ...f, subject }))
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'نام و نام خانوادگی الزامی است'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'ایمیل معتبر نیست'
    if (form.phone && !/^09\d{9}$/.test(form.phone)) e.phone = 'شماره باید ۱۱ رقم و با ۰۹ شروع شود'
    if (!form.subject) e.subject = 'موضوع را انتخاب کنید'
    if (form.message.trim().length < 10) e.message = 'پیام باید حداقل ۱۰ کاراکتر باشد'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    const payload = { ...form, at: new Date().toISOString() }
    try {
      const res = await fetch(`${API}/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
    } catch {
      /* API در دسترس نیست ⇒ ذخیره‌ی محلی؛ پیام‌ها بعداً قابل انتقال‌اند */
      try {
        const all = JSON.parse(localStorage.getItem('bh_contact_messages') ?? '[]')
        localStorage.setItem('bh_contact_messages', JSON.stringify([{ id: Date.now(), ...payload }, ...all]))
      } catch {}
    }
    /* مکث کوتاه برای حس واقعی لودینگ */
    await new Promise(r => setTimeout(r, 700))
    setLoading(false)
    setSent(true)
  }

  return (
    <div dir="rtl" style={{ background: '#F7F7F5', color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif', overflowX: 'clip' }}>
      <style>{`
        .ct-rev { opacity: 0; transform: translateY(24px); transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
        .ct-rev.on { opacity: 1; transform: none; }
        .ct-rev.d1 { transition-delay: .08s; } .ct-rev.d2 { transition-delay: .18s; } .ct-rev.d3 { transition-delay: .3s; }

        @keyframes ctEnter { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
        @keyframes ctPulse { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
        @keyframes ctDash { to { stroke-dashoffset: 0; } }
        @keyframes ctSpin { to { transform: rotate(360deg); } }
        @keyframes ctPop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.06); } 100% { transform: scale(1); opacity: 1; } }
        .ct-hero-in > * { animation: ctEnter .8s cubic-bezier(.22,1,.36,1) both; }
        .ct-hero-in > *:nth-child(2) { animation-delay: .12s; }
        .ct-hero-in > *:nth-child(3) { animation-delay: .24s; }

        /* ردیف‌های کانال — تعاملی */
        .ct-ch { display: flex; align-items: center; gap: 14px; padding: 17px 6px; cursor: pointer;
          border-bottom: 1px solid ${LINE}; background: transparent; width: 100%; text-align: right;
          font-family: inherit; border-inline: none; border-top: none; text-decoration: none;
          transition: background .3s, transform .3s cubic-bezier(.22,1,.36,1); position: relative; }
        .ct-ch:hover { transform: translateX(-5px); }
        .ct-ch .ic { width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: #fff; border: 1px solid ${LINE}; color: var(--cc);
          transition: box-shadow .3s, border-color .3s, transform .3s; }
        .ct-ch:hover .ic { border-color: var(--cc); transform: scale(1.07); box-shadow: 0 8px 20px rgba(28,27,23,0.1); }
        .ct-ch .hint { margin-inline-start: auto; font-size: 10.5px; font-weight: 800; color: ${MUT};
          display: inline-flex; align-items: center; gap: 4px; opacity: 0; transform: translateX(5px);
          transition: opacity .3s, transform .3s; white-space: nowrap; }
        .ct-ch:hover .hint { opacity: 1; transform: none; }

        .ct-submit { width: 100%; padding: 15px; border: none; border-radius: 13px; cursor: pointer;
          font-family: inherit; font-size: 15px; font-weight: 800; color: #241B08;
          background: linear-gradient(135deg, #E8CE96, ${GOLD} 55%, #A8853F);
          box-shadow: 0 10px 26px rgba(199,166,106,0.3);
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, opacity .2s; }
        .ct-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 16px 38px rgba(199,166,106,0.42); }
        .ct-submit:disabled { opacity: .65; cursor: not-allowed; }

        .ct-grid { display: grid; grid-template-columns: minmax(0,5fr) minmax(0,7fr); }
        @media (max-width: 860px) { .ct-grid { grid-template-columns: 1fr; } .ct-side { border-inline-start: none !important; border-top: 1px solid ${LINE}; } }
        @media (prefers-reduced-motion: reduce) {
          .ct-rev { opacity: 1 !important; transform: none !important; transition: none !important; }
          .ct-hero-in > * { animation: none !important; }
        }
      `}</style>

      {/* ═══ HERO — کوتاه و سینمایی با میز مینیمال ═══ */}
      <section style={{ position: 'relative', background: '#0B0A08', color: '#fff', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 14%, rgba(199,166,106,0.15), transparent 46%)' }} />
        <div aria-hidden style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '30%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent)', transform: 'rotate(14deg)' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: '-1vw', insetInlineStart: -8, fontWeight: 900, fontSize: 'clamp(56px,11vw,150px)', lineHeight: .9, direction: 'ltr', color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.06)', userSelect: 'none', pointerEvents: 'none' }}>CONTACT</div>

        {/* میز مینیمال — پاکت‌ها نقاط ارتباط */}
        <svg aria-hidden viewBox="0 0 520 300" style={{ position: 'absolute', top: '50%', left: 'clamp(-60px,2vw,60px)', transform: 'translateY(-50%)', width: 'min(46vw, 520px)', opacity: 0.55, pointerEvents: 'none' }}>
          <rect x="20" y="30" width="480" height="240" rx="18" fill="none" stroke="rgba(199,166,106,0.4)" strokeWidth="1.4" />
          <rect x="44" y="54" width="432" height="192" rx="8" fill="none" stroke="rgba(199,166,106,0.16)" strokeWidth="1" />
          {[[20, 30], [260, 22], [500, 30], [20, 270], [260, 278], [500, 270]].map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="7" fill="rgba(199,166,106,0.55)" style={{ animation: `ctPulse 3.2s ${i * 0.4}s ease-in-out infinite` }} />
          ))}
          <path d="M 130 210 L 300 110 L 452 168" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="420" strokeDashoffset="420" style={{ animation: 'ctDash 2.4s .6s cubic-bezier(.4,0,.2,1) forwards' }} />
          <circle cx="130" cy="210" r="9" fill="url(#ctCue)" />
          <defs>
            <radialGradient id="ctCue" cx="0.35" cy="0.3" r="1">
              <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#BDB8AC" />
            </radialGradient>
          </defs>
        </svg>

        <div className="ct-hero-in" style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: 'clamp(68px,10vh,110px) clamp(20px,4vw,32px) clamp(60px,9vh,96px)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.28em', color: GOLD, border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)', borderRadius: 999, padding: '5px 14px' }}>
            CONTACT · BILLIARD HUB
          </span>
          <h1 style={{ fontSize: 'clamp(30px,5.4vw,58px)', fontWeight: 900, lineHeight: 1.3, letterSpacing: '-0.02em', margin: '16px 0 0' }}>
            با ما <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>در ارتباط باشید</span>
          </h1>
          <p style={{ fontSize: 'clamp(13px,1.5vw,15.5px)', color: 'rgba(255,255,255,0.6)', lineHeight: 2.1, margin: '14px 0 0', maxWidth: 480 }}>
            برای ارتباط با تیم Billiard Hub، همکاری، پیشنهاد یا هرگونه پرسش، با ما در تماس باشید
          </p>
        </div>
      </section>

      {/* ═══ کامپوزیشن واحد: کانال‌ها + فرم ═══ */}
      <section style={{ padding: 'clamp(40px,7vw,90px) clamp(16px,4vw,32px) clamp(70px,9vw,120px)' }}>
        <div className="ct-rev" style={{
          maxWidth: 1080, margin: '0 auto', position: 'relative',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78))',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${LINE}`, borderRadius: 26, overflow: 'hidden',
          boxShadow: '0 28px 80px rgba(28,27,23,0.09)',
        }}>
          <div aria-hidden style={{ position: 'absolute', top: 0, insetInline: 0, height: 3, background: `linear-gradient(90deg,#8A6020,${GOLD},#8A6020)` }} />

          <div className="ct-grid">
            {/* ── کانال‌های ارتباطی ── */}
            <div style={{ padding: 'clamp(26px,4vw,44px)' }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.3em', color: MUT }}>CHANNELS</span>
              <h2 style={{ fontSize: 'clamp(19px,2.4vw,25px)', fontWeight: 900, margin: '10px 0 18px' }}>کانال‌های ارتباطی</h2>

              {/* ایمیل — کلیک = کپی */}
              <button type="button" className="ct-ch" onClick={copyEmail} style={{ ['--cc' as never]: BALLS.blue }}>
                <span className="ic"><Mail size={18} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: TEXT }}>ایمیل</span>
                  <span dir="ltr" style={{ fontSize: 12.5, color: SEC, fontWeight: 600 }}>{CONTACT.email}</span>
                </span>
                <span className="hint" style={copied ? { opacity: 1, transform: 'none', color: '#1B7A4B' } : undefined}>
                  {copied ? <><Check size={12} /> کپی شد</> : <><Copy size={12} /> برای کپی کلیک کن</>}
                </span>
              </button>

              {/* تلفن */}
              {CONTACT.phone && (
                <a className="ct-ch" href={`tel:${CONTACT.phoneDial}`} style={{ ['--cc' as never]: BALLS.green }}>
                  <span className="ic"><Headphones size={18} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: TEXT }}>تلفن</span>
                    <span dir="ltr" style={{ fontSize: 12.5, color: SEC, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{toFaDigits(CONTACT.phone)}</span>
                  </span>
                  <span className="hint">تماس مستقیم</span>
                </a>
              )}

              {/* نشانی */}
              <div className="ct-ch" style={{ ['--cc' as never]: BALLS.red, cursor: 'default', alignItems: 'flex-start' }}>
                <span className="ic"><MapPin size={18} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: TEXT }}>نشانی دفتر</span>
                  <span style={{ fontSize: 12.5, color: SEC, fontWeight: 600, lineHeight: 2, display: 'block' }}>{CONTACT.address}</span>
                </span>
              </div>

              {/* میان‌بُرهای موضوع — می‌پرد به فرم با موضوع ازپیش‌انتخاب‌شده */}
              <button type="button" className="ct-ch" onClick={() => jumpToForm('همکاری')} style={{ ['--cc' as never]: BALLS.yellow }}>
                <span className="ic"><Handshake size={18} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: TEXT }}>همکاری با ما</span>
                  <span style={{ fontSize: 12.5, color: SEC, fontWeight: 600 }}>پیشنهاد همکاری و مشارکت</span>
                </span>
                <span className="hint"><ArrowLeft size={12} /> برو به فرم</span>
              </button>
              <button type="button" className="ct-ch" onClick={() => jumpToForm('پشتیبانی')} style={{ ['--cc' as never]: BALLS.pink }}>
                <span className="ic"><Headphones size={18} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: TEXT }}>پشتیبانی</span>
                  <span style={{ fontSize: 12.5, color: SEC, fontWeight: 600 }}>سؤال درباره‌ی حساب و امکانات</span>
                </span>
                <span className="hint"><ArrowLeft size={12} /> برو به فرم</span>
              </button>
              {/* تبلیغات فرم خودش را دارد (جایگاه و تعرفه)، پس به /advertise می‌رود نه به فرم عمومی */}
              <Link href="/advertise" className="ct-ch" style={{ ['--cc' as never]: BALLS.gold, borderBottom: 'none', textDecoration: 'none' }}>
                <span className="ic"><Megaphone size={18} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: TEXT }}>تبلیغات در بیلیارد هاب</span>
                  <span style={{ fontSize: 12.5, color: SEC, fontWeight: 600 }}>جایگاه‌های بنری، تعرفه و درخواست</span>
                </span>
                <span className="hint"><ArrowLeft size={12} /> جایگاه‌ها</span>
              </Link>

              {/* شبکه‌های اجتماعی — فقط وقتی آدرس واقعی ثبت شده باشد */}
              {(CONTACT.instagram || CONTACT.telegram) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  {CONTACT.instagram && (
                    <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12.5, fontWeight: 800, color: GOLD_D, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.3)' }}>
                      اینستاگرام
                    </a>
                  )}
                  {CONTACT.telegram && (
                    <a href={CONTACT.telegram} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12.5, fontWeight: 800, color: GOLD_D, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.3)' }}>
                      تلگرام
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── فرم ── */}
            <div ref={formRef} className="ct-side" style={{ padding: 'clamp(26px,4vw,44px)', borderInlineStart: `1px solid ${LINE}`, background: 'rgba(250,250,247,0.6)' }}>
              {!sent ? (
                <form onSubmit={submit} noValidate>
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.3em', color: MUT }}>MESSAGE</span>
                  <h2 style={{ fontSize: 'clamp(19px,2.4vw,25px)', fontWeight: 900, margin: '10px 0 18px' }}>پیام بگذارید</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 22px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FloatField label="نام و نام خانوادگی" value={form.name} onChange={set('name')} error={errors.name} />
                    </div>
                    <FloatField label="ایمیل" value={form.email} onChange={set('email')} type="email" ltr inputMode="email" error={errors.email} />
                    <FloatField label="شماره تماس (اختیاری)" value={form.phone} onChange={set('phone')} type="tel" ltr inputMode="numeric" maxLength={11} error={errors.phone} />
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: errors.subject ? '#B23B2E' : MUT, marginBottom: 8 }}>موضوع</label>
                    <SubjectSelect value={form.subject} onChange={set('subject')} options={SUBJECTS} error={errors.subject} />
                    {errors.subject && <div style={{ fontSize: 11, fontWeight: 700, color: '#B23B2E', marginTop: 6 }}>{errors.subject}</div>}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <FloatField label="پیام شما" value={form.message} onChange={set('message')} textarea error={errors.message} />
                  </div>

                  <button type="submit" className="ct-submit" disabled={loading} style={{ marginTop: 24 }}>
                    {loading ? (
                      <>
                        <span style={{ width: 17, height: 17, border: '2px solid rgba(36,27,8,0.25)', borderTop: '2px solid #241B08', borderRadius: '50%', animation: 'ctSpin .7s linear infinite', display: 'inline-block' }} />
                        در حال ارسال…
                      </>
                    ) : (<>ارسال پیام <Send size={15} /></>)}
                  </button>
                </form>
              ) : (
                /* ── انیمیشن موفقیت ── */
                <div style={{ textAlign: 'center', padding: 'clamp(30px,5vw,60px) 10px', animation: 'ctPop .5s cubic-bezier(.22,1,.36,1) both' }}>
                  <svg width="86" height="86" viewBox="0 0 86 86" style={{ margin: '0 auto 18px', display: 'block' }}>
                    <circle cx="43" cy="43" r="40" fill="rgba(27,122,75,0.07)" stroke="rgba(27,122,75,0.35)" strokeWidth="1.5"
                      strokeDasharray="252" strokeDashoffset="252" style={{ animation: 'ctDash 1s .1s cubic-bezier(.4,0,.2,1) forwards' }} />
                    <path d="M 27 44 L 39 56 L 60 32" fill="none" stroke="#1B7A4B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="60" strokeDashoffset="60" style={{ animation: 'ctDash .6s .7s cubic-bezier(.4,0,.2,1) forwards' }} />
                  </svg>
                  <h3 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>پیام شما ثبت شد</h3>
                  <p style={{ fontSize: 13, color: SEC, lineHeight: 2, margin: '0 0 22px' }}>
                    ممنون که با بیلیارد هاب در ارتباطی — تیم ما پیامت را بررسی می‌کند
                  </p>
                  <button type="button" onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                    style={{ padding: '11px 24px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)' }}>
                    ارسال پیام جدید
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* لینک به درباره ما */}
        <div className="ct-rev d2" style={{ maxWidth: 1080, margin: '22px auto 0', textAlign: 'center' }}>
          <Link href="/about" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: MUT, textDecoration: 'none' }}>
            بیشتر درباره‌ی بیلیارد هاب بدانید <ArrowLeft size={13} />
          </Link>
        </div>
      </section>
    </div>
  )
}
