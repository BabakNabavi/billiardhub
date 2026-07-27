'use client'

/* رندر صفحات حقوقی — طراحی هماهنگ با بقیه سایت:
   هدر روشن با هاله طلایی، فهرست مطالب چسبان روی دسکتاپ و آکاردئونی روی موبایل،
   بخش‌های شماره‌دار با لنگر برای لینک مستقیم. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ListOrdered, ChevronDown, FileText, ShieldCheck, ArrowUp, Check } from 'lucide-react'
import type { LegalDocument } from '../../lib/legal-content'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', GROUND = '#FAF8F3', FELT = '#0E7A38'
const faNum = (n: number) => n.toLocaleString('fa-IR')

export default function LegalDoc({ doc, icon = 'terms' }: { doc: LegalDocument; icon?: 'terms' | 'privacy' }) {
  const [active, setActive] = useState<string>('')
  const [tocOpen, setTocOpen] = useState(false)
  const [showTop, setShowTop] = useState(false)
  /* وقتی کاربر از فرمِ ثبت‌نام به این‌جا آمده، نوارِ تأیید پایین صفحه می‌آید.
     از window خوانده می‌شود (نه useSearchParams) تا صفحه استاتیک بماند. */
  const [fromRegister, setFromRegister] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    setFromRegister(new URLSearchParams(window.location.search).get('from') === 'register')
  }, [])

  const acceptTerms = () => {
    try { localStorage.setItem('bh_terms_accepted', String(Date.now())) } catch { /* ignore */ }
    setAccepted(true)
    setTimeout(() => { window.location.href = '/register' }, 550)
  }

  /* بخش فعال در فهرست، بر اساس موقعیت اسکرول */
  useEffect(() => {
    const ids = doc.sections.map(s => s.id)
    const onScroll = () => {
      setShowTop(window.scrollY > 600)
      let current = ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 140) current = id
      }
      setActive(current || ids[0] || '')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [doc])

  /* لنگرِ آدرس (/terms#market) — چون محتوا سمتِ کلاینت رندر می‌شود، مرورگر
     در لحظه‌ی لودِ اول عنصر را پیدا نمی‌کند و اسکرول نمی‌کند؛ پس خودمان انجام می‌دهیم.
     دو تلاش (rAF و ۳۰۰ms) تا فونت/تصاویر ارتفاع را جابه‌جا نکنند. */
  useEffect(() => {
    const go = (behavior: ScrollBehavior) => {
      const id = decodeURIComponent(window.location.hash.replace('#', ''))
      if (!id) return
      const el = document.getElementById(id)
      if (!el) return
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior })
    }
    const raf = requestAnimationFrame(() => go('auto'))
    const t = setTimeout(() => go('auto'), 300)
    const onHash = () => go('smooth')
    window.addEventListener('hashchange', onHash)
    return () => { cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener('hashchange', onHash) }
  }, [doc])

  const jump = (id: string) => {
    setTocOpen(false)
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' })
  }

  const Icon = icon === 'privacy' ? ShieldCheck : FileText

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: GROUND, color: INK, fontFamily: 'var(--font-base)' }}>
      <style>{`
        .lg-wrap { max-width: 1120px; margin: 0 auto; padding: 0 clamp(18px,3.2vw,32px); }
        .lg-layout { display: grid; grid-template-columns: 260px minmax(0,1fr); gap: clamp(20px,3vw,44px); align-items: start; }
        .lg-toc { position: sticky; top: 88px; }
        .lg-toc-btn { display:flex; align-items:center; gap:9px; width:100%; text-align:right; padding:9px 12px; border-radius:10px;
          border:none; background:transparent; cursor:pointer; font-family:inherit; font-size:13px; color:${SEC}; transition: all .18s; line-height:1.7; }
        .lg-toc-btn:hover { background:#fff; color:${INK}; }
        .lg-toc-btn.on { background:rgba(199,166,106,0.13); color:${GOLD_D}; font-weight:800; }
        .lg-sec { scroll-margin-top: 96px; background:#fff; border:1px solid ${LINE}; border-radius:20px;
          padding: clamp(20px,2.6vw,30px); margin-bottom:16px; }
        .lg-sec h2 { display:flex; align-items:center; gap:12px; font-size:clamp(16.5px,2.1vw,20px); font-weight:900;
          margin:0 0 16px; letter-spacing:-0.02em; line-height:1.6; }
        .lg-num { flex-shrink:0; width:34px; height:34px; border-radius:11px; display:inline-flex; align-items:center; justify-content:center;
          font-size:14px; font-weight:900; color:#241B08; background:linear-gradient(135deg,#E8CE96,#8A6020); }
        .lg-sec p { font-size:14.5px; line-height:2.3; color:${SEC}; margin:0 0 14px; text-align:justify; }
        .lg-sec p:last-child { margin-bottom:0; }
        .lg-hl { background:rgba(199,166,106,0.09); border:1px solid rgba(199,166,106,0.3); border-radius:14px;
          padding:14px 16px; margin:0 0 14px; }
        .lg-hl p { color:${INK}; font-weight:700; margin:0; }
        .lg-li { display:flex; align-items:flex-start; gap:10px; font-size:14.5px; line-height:2.2; color:${SEC}; margin-bottom:8px; }
        .lg-li::before { content:''; flex-shrink:0; width:6px; height:6px; border-radius:50%; background:${GOLD}; margin-top:13px; }
        @media (max-width: 900px) {
          .lg-layout { grid-template-columns: 1fr; }
          .lg-toc { position: static; }
          .lg-sec p, .lg-li { font-size:14px; line-height:2.2; text-align:right; }
        }
      `}</style>

      {/* ── هدر ── */}
      <header style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${LINE}`,
        background: 'radial-gradient(circle at 84% 0%, rgba(199,166,106,0.13), transparent 48%), radial-gradient(circle at 8% 100%, rgba(14,122,56,0.06), transparent 44%)' }}>
        <div className="lg-wrap" style={{ padding: 'clamp(24px,3.6vw,44px) clamp(18px,3.2vw,32px)' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 16 }}>
            <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link>
            <ChevronLeft size={12} />
            <span style={{ color: SEC }}>{icon === 'privacy' ? 'حریم خصوصی' : 'قوانین و مقررات'}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(199,166,106,0.13)', border: '1px solid rgba(199,166,106,0.32)', color: GOLD_D }}>
              <Icon size={24} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, margin: 0, lineHeight: 1.45, letterSpacing: '-0.02em' }}>
                {doc.title}
              </h1>
              <p style={{ fontSize: 13.5, color: SEC, margin: '10px 0 0', lineHeight: 2.1, maxWidth: 680 }}>{doc.lead}</p>
              <span style={{ display: 'inline-block', marginTop: 12, fontSize: 11.5, color: MUT, background: '#fff',
                border: `1px solid ${LINE}`, borderRadius: 999, padding: '4px 12px' }}>
                آخرین به‌روزرسانی: {doc.updatedAt}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="lg-wrap" style={{ padding: 'clamp(22px,3vw,36px) clamp(18px,3.2vw,32px) 80px' }}>
        <div className="lg-layout">

          {/* ── فهرست مطالب ── */}
          <aside className="lg-toc">
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: 10 }}>
              <button onClick={() => setTocOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: 'none',
                  background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                <ListOrdered size={16} style={{ color: GOLD_D }} />
                <span style={{ flex: 1, textAlign: 'right', fontSize: 13.5, fontWeight: 900, color: INK }}>فهرست مطالب</span>
                <ChevronDown size={15} className="lg-only-mobile"
                  style={{ color: MUT, transition: 'transform .2s', transform: tocOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              <div className={tocOpen ? 'lg-toc-list open' : 'lg-toc-list'}>
                {doc.sections.map((s, i) => (
                  <button key={s.id} onClick={() => jump(s.id)} className={`lg-toc-btn${active === s.id ? ' on' : ''}`}>
                    <span style={{ fontSize: 11.5, color: MUT, fontVariantNumeric: 'tabular-nums', minWidth: 16 }}>{faNum(i + 1)}</span>
                    <span style={{ flex: 1 }}>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* پیوند به سند دیگر */}
            <Link href={doc.slug === 'terms' ? '/privacy' : '/terms'}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '12px 14px', borderRadius: 14,
                textDecoration: 'none', background: '#fff', border: `1px solid ${LINE}`, color: GOLD_D, fontSize: 13, fontWeight: 800 }}>
              {doc.slug === 'terms' ? <ShieldCheck size={16} /> : <FileText size={16} />}
              {doc.slug === 'terms' ? 'حریم خصوصی' : 'قوانین و مقررات'}
              <ChevronLeft size={14} style={{ marginInlineStart: 'auto' }} />
            </Link>
          </aside>

          {/* ── متن ── */}
          <div>
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="lg-sec">
                <h2><span className="lg-num">{faNum(i + 1)}</span>{s.title}</h2>
                {s.blocks.map((b, bi) => {
                  if (b.type === 'p') return <p key={bi}>{b.text}</p>
                  if (b.type === 'highlight') return <div key={bi} className="lg-hl"><p>{b.text}</p></div>
                  return (
                    <div key={bi} style={{ margin: '0 0 14px' }}>
                      {b.items.map((it, ii) => <div key={ii} className="lg-li"><span>{it}</span></div>)}
                    </div>
                  )
                })}
              </section>
            ))}

            {/* تماس */}
            <div style={{ background: 'linear-gradient(135deg, rgba(14,122,56,0.05), rgba(199,166,106,0.05))',
              border: `1px solid ${LINE}`, borderRadius: 20, padding: 'clamp(20px,2.6vw,28px)', textAlign: 'center' }}>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: INK, margin: '0 0 8px' }}>پرسشی دارید؟</p>
              <p style={{ fontSize: 13, color: SEC, margin: '0 0 16px', lineHeight: 2 }}>
                برای دریافت پشتیبانی، ارسال درخواست یا گزارش تخلف با ما در ارتباط باشید.
              </p>
              <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px',
                borderRadius: 12, textDecoration: 'none', fontSize: 13.5, fontWeight: 800, background: GOLD, color: '#241B08' }}>
                تماس با ما <ChevronLeft size={15} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* بازگشت به بالا */}
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="بازگشت به بالا"
          style={{ position: 'fixed', insetInlineStart: 20, bottom: fromRegister ? 92 : 24, zIndex: 50, width: 44, height: 44, borderRadius: '50%',
            border: `1px solid ${LINE}`, background: '#fff', color: GOLD_D, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 26px rgba(28,27,23,0.14)' }}>
          <ArrowUp size={18} />
        </button>
      )}

      {/* نوارِ تأیید — فقط وقتی از فرمِ ثبت‌نام آمده باشد */}
      {fromRegister && (
        <div style={{
          position: 'fixed', insetInline: 0, bottom: 0, zIndex: 60,
          background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          borderTop: `1px solid ${LINE}`, boxShadow: '0 -8px 30px rgba(28,27,23,0.07)',
          padding: '12px clamp(14px,3vw,28px) calc(12px + env(safe-area-inset-bottom))',
        }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ flex: '1 1 200px', minWidth: 0, fontSize: 12.5, color: SEC, lineHeight: 1.9 }}>
              پس از مطالعه، تأیید کنید تا به فرم ثبت‌نام بازگردید.
            </span>
            <button onClick={acceptTerms} disabled={accepted}
              style={{
                flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 22px', borderRadius: 12, cursor: accepted ? 'default' : 'pointer', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 800, transition: 'all .2s',
                background: accepted ? 'rgba(14,122,56,0.10)' : 'rgba(199,166,106,0.14)',
                border: `1px solid ${accepted ? 'rgba(14,122,56,0.34)' : 'rgba(199,166,106,0.45)'}`,
                color: accepted ? FELT : GOLD_D,
              }}>
              {accepted
                ? <><Check size={15} /> تأیید شد — در حال بازگشت…</>
                : <><Check size={15} /> قوانین را مطالعه کردم و می‌پذیرم</>}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .lg-only-mobile { display: none; }
        @media (max-width: 900px) {
          .lg-only-mobile { display: inline-flex; }
          .lg-toc-list { display: none; }
          .lg-toc-list.open { display: block; }
        }
      `}</style>
    </div>
  )
}
