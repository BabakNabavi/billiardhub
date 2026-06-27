'use client'

import { useState } from 'react'
import Link from 'next/link'

function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}

const FAQ_ITEMS = [
  { q: 'چطور می‌توانم باشگاه خود را ثبت کنم؟', a: 'پس از ثبت‌نام و انتخاب نقش "باشگاه‌دار"، از پنل مدیریت می‌توانید مشخصات باشگاه را وارد کنید.' },
  { q: 'هزینه استفاده از پلتفرم چقدر است؟', a: 'ثبت‌نام و استفاده پایه رایگان است. برای امکانات پیشرفته، پلن‌های اشتراک موجود است.' },
  { q: 'آیا امکان درج تبلیغات وجود دارد؟', a: 'بله، برای اطلاعات درباره تبلیغات در پلتفرم می‌توانید با تیم ما از طریق فرم تماس ارتباط برقرار کنید.' },
  { q: 'نحوه ارتباط با پشتیبانی چگونه است؟', a: 'از طریق فرم تماس، ایمیل یا تلگرام می‌توانید با تیم پشتیبانی ما در ارتباط باشید.' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'نام الزامی است'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'ایمیل نامعتبر است'
    if (!form.subject.trim()) e.subject = 'موضوع الزامی است'
    if (!form.message.trim() || form.message.length < 10) e.message = 'پیام باید حداقل ۱۰ کاراکتر باشد'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setSent(true)
    setLoading(false)
  }

  const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.50)', marginBottom: 6, display: 'block' }
  const inputStyle = (err?: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    background: '#F7F7F5', border: `1px solid ${err ? 'rgba(239,68,68,0.50)' : 'rgba(0,0,0,0.10)'}`,
    borderRadius: 12, padding: '12px 14px', color: '#111111', fontSize: 16, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.2s',
  })

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        input:focus, select:focus, textarea:focus { border-color: rgba(199,166,106,0.50) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.10) !important; }
        .info-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .info-card:hover { transform: translateY(-4px); border-color: rgba(199,166,106,0.30) !important; box-shadow: 0 16px 48px rgba(0,0,0,0.10) !important; }
        @media(max-width:900px){ .contact-grid{grid-template-columns:1fr!important;} .social-grid{grid-template-columns:1fr 1fr!important;} }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', color: '#111111' }}>

        {/* ambient orb */}
        <div style={{ position: 'fixed', top: -100, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(199,166,106,0.07)0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: -80, left: -60, width: 400, height: 400, background: 'radial-gradient(circle,rgba(6,182,212,0.04)0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* ── Hero mini ── */}
        <div style={{ position: 'relative', height: 240, overflow: 'hidden', background: '#F7F7F5' }}>
          <img src="/images/billiadr-club-6.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.12) saturate(0.4)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,6,4,0.4), rgba(2,8,6,0.98))' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.20)', borderRadius: 100, padding: '6px 18px', animation: 'fadeUp 0.6s ease both' }}>
              <span style={{ fontSize: 12, color: '#C7A66A', fontWeight: 700, letterSpacing: '0.22em' }}>CONTACT US</span>
            </div>
            <h1 style={{ fontSize: 'clamp(31px, 4.4vw, 51px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.035em', animation: 'fadeUp 0.6s ease 0.15s both' }}>تماس با ما</h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', margin: 0, animation: 'fadeUp 0.6s ease 0.3s both' }}>همیشه در کنار شما هستیم</p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>

          {/* ── Contact info cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 60 }}>
            {[
              { icon: 'ti-phone', title: 'تلفن پشتیبانی', value: '۰۲۱-۸۸۱۲۳۴۵۶', sub: 'شنبه تا پنج‌شنبه ۹ تا ۱۸', color: '#C7A66A' },
              { icon: 'ti-mail', title: 'ایمیل', value: 'support@billiardplus.ir', sub: 'پاسخ در کمتر از ۲۴ ساعت', color: '#06b6d4' },
              { icon: 'ti-map-pin', title: 'دفتر مرکزی', value: 'تهران، ونک، خیابان ملاصدرا', sub: 'ساختمان پلاس، طبقه ۴', color: '#a78bfa' },
            ].map((c, i) => (
              <div key={i} className="info-card" style={{ padding: '24px 20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: `${c.color}12`, border: `1px solid ${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <i className={`ti ${c.icon}`} style={{ fontSize: 22, color: c.color }} />
                </div>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: '0 0 6px', fontWeight: 700 }}>{c.title}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>{c.value}</p>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', margin: 0 }}>{c.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Main grid: Form + Sidebar ── */}
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, marginBottom: 64 }}>

            {/* Form */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 24, overflow: 'hidden' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.5),transparent)' }} />
              <div style={{ padding: '32px' }}>
                {sent ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'scaleIn 0.5s ease both' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(199,166,106,0.10)', border: '2px solid rgba(199,166,106,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(199,166,106,0.20)' }}>
                      <i className="ti ti-check" style={{ fontSize: 40, color: '#C7A66A' }} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111111', margin: '0 0 12px' }}>پیام ارسال شد!</h2>
                    <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)', lineHeight: 1.7, margin: '0 0 28px' }}>
                      تیم پشتیبانی ما در اسرع وقت با شما تماس خواهد گرفت.
                    </p>
                    <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                      style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.25)', color: '#C7A66A', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                      ارسال پیام جدید
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-send" style={{ fontSize: 19, color: '#C7A66A' }} />
                      </div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, color: '#111111', margin: 0 }}>ارسال پیام</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                          <label style={labelStyle}>نام و نام خانوادگی *</label>
                          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="نام خود را وارد کنید" style={inputStyle(errors.name)} />
                          {errors.name && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{errors.name}</p>}
                        </div>
                        <div>
                          <label style={labelStyle}>شماره موبایل</label>
                          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" style={inputStyle()} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={labelStyle}>ایمیل *</label>
                          <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@email.com" type="email" style={inputStyle(errors.email)} />
                          {errors.email && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{errors.email}</p>}
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={labelStyle}>موضوع *</label>
                          <select value={form.subject} onChange={e => set('subject', e.target.value)} style={{ ...inputStyle(errors.subject), appearance: 'none' }}>
                            <option value="">موضوع تماس را انتخاب کنید</option>
                            <option>پشتیبانی فنی</option>
                            <option>درخواست تبلیغات</option>
                            <option>ثبت باشگاه</option>
                            <option>گزارش مشکل</option>
                            <option>همکاری و شراکت</option>
                            <option>سایر</option>
                          </select>
                          {errors.subject && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{errors.subject}</p>}
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={labelStyle}>پیام *</label>
                          <textarea value={form.message} onChange={e => set('message', e.target.value)} placeholder="پیام خود را اینجا بنویسید..." rows={5} style={{ ...inputStyle(errors.message), resize: 'vertical', lineHeight: 1.7 }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            {errors.message && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{errors.message}</p>}
                            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', marginRight: 'auto' }}>{toFa(form.message.length)} کاراکتر</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: loading ? 'rgba(199,166,106,0.30)' : 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 8px 28px rgba(199,166,106,0.35)', transition: 'all 0.3s' }}
                      >
                        {loading ? (
                          <><i className="ti ti-loader-2 ti-spin" style={{ fontSize: 20 }} /> در حال ارسال...</>
                        ) : (
                          <><i className="ti ti-send" style={{ fontSize: 20 }} /> ارسال پیام</>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Working hours */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.40),transparent)' }} />
                <div style={{ padding: '20px' }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-clock" style={{ fontSize: 17, color: '#C7A66A' }} />
                    ساعت پشتیبانی
                  </p>
                  {[
                    { day: 'شنبه تا چهارشنبه', hours: '۹:۰۰ — ۱۸:۰۰', active: true },
                    { day: 'پنج‌شنبه', hours: '۹:۰۰ — ۱۴:۰۰', active: true },
                    { day: 'جمعه', hours: 'تعطیل', active: false },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                      <span style={{ color: 'rgba(0,0,0,0.45)' }}>{r.day}</span>
                      <span style={{ color: r.active ? '#C7A66A' : '#ef4444', fontWeight: 600 }}>{r.hours}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(199,166,106,0.06)', borderRadius: 10, border: '1px solid rgba(199,166,106,0.12)', fontSize: 14, color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-info-circle" style={{ fontSize: 15, color: '#C7A66A', flexShrink: 0 }} />
                    پشتیبانی اضطراری از طریق تلگرام ۲۴ ساعته فعال است
                  </div>
                </div>
              </div>

              {/* Social media */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '20px' }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-share" style={{ fontSize: 17, color: '#C7A66A' }} />
                  شبکه‌های اجتماعی
                </p>
                <div className="social-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { icon: 'ti-brand-instagram', label: 'اینستاگرام', handle: '@billiardplus', color: '#e1306c', bg: 'rgba(225,48,108,0.08)' },
                    { icon: 'ti-brand-telegram', label: 'تلگرام', handle: '@BilliardPlus', color: '#2CA5E0', bg: 'rgba(44,165,224,0.08)' },
                    { icon: 'ti-brand-twitter', label: 'توییتر/X', handle: '@billiardplus', color: '#1DA1F2', bg: 'rgba(29,161,242,0.08)' },
                    { icon: 'ti-brand-youtube', label: 'یوتیوب', handle: 'BilliardPlus', color: '#FF0000', bg: 'rgba(255,0,0,0.08)' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '12px', background: s.bg, border: `1px solid ${s.color}20`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}>
                      <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111111', margin: '0 0 1px' }}>{s.label}</p>
                        <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)', margin: 0 }}>{s.handle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div style={{ background: 'rgba(199,166,106,0.04)', border: '1px solid rgba(199,166,106,0.12)', borderRadius: 20, padding: '20px' }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-link" style={{ fontSize: 17, color: '#C7A66A' }} />
                  لینک‌های مفید
                </p>
                {[
                  { href: '/about', label: 'درباره ما', icon: 'ti-info-circle' },
                  { href: '/shop', label: 'فروشگاه', icon: 'ti-shopping-bag' },
                  { href: '/clubs', label: 'باشگاه‌ها', icon: 'ti-building' },
                  { href: '/events', label: 'مسابقات', icon: 'ti-trophy' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.50)', textDecoration: 'none', fontSize: 15, transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C7A66A' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(0,0,0,0.50)' }}>
                    <i className={`ti ${l.icon}`} style={{ fontSize: 16, color: '#C7A66A', opacity: 0.7 }} />
                    {l.label}
                    <i className="ti ti-arrow-left" style={{ fontSize: 14, marginRight: 'auto' }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── FAQ ── */}
          <section>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <p style={{ fontSize: 12, color: '#A07840', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>FAQ</p>
              <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 33px)', fontWeight: 900, color: '#111111', margin: 0 }}>سوالات متداول</h2>
            </div>
            <div style={{ maxWidth: 720, margin: '0 auto', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.40),transparent)' }} />
              <div style={{ padding: '8px 24px' }}>
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <button
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      style={{ width: '100%', textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 700, color: faqOpen === i ? '#C7A66A' : '#111111', transition: 'color 0.2s' }}>{item.q}</span>
                      <span style={{ fontSize: 22, color: '#C7A66A', transition: 'transform 0.3s', transform: faqOpen === i ? 'rotate(45deg)' : 'rotate(0)', flexShrink: 0, lineHeight: 1 }}>+</span>
                    </button>
                    {faqOpen === i && (
                      <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.50)', lineHeight: 1.8, margin: '0 0 16px', paddingRight: 4 }}>{item.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
